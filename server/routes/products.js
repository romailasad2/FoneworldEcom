import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/flexibleAuth.js';
import db from '../database.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Make upload optional - don't require file
const uploadOptional = upload.single('image');

const router = express.Router();

// Flatten the branch relation into branchName/branchAddress/branchPhone.
const presentProduct = (p) => {
  if (!p) return p;
  const { branch, ...rest } = p;
  return {
    ...rest,
    branchName: branch ? branch.name : null,
    branchAddress: branch ? branch.address : null,
    branchPhone: branch ? branch.phone : null
  };
};

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await db.product.findMany({
      include: { branch: true },
      orderBy: { id: 'desc' }
    });
    res.json(products.map(presentProduct));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Check IMEI/Serial for repurchase detection
router.get('/check-imei/:imeiOrSerial', async (req, res) => {
  try {
    const { imeiOrSerial } = req.params;

    if (!imeiOrSerial || imeiOrSerial.trim() === '') {
      return res.json({ exists: false });
    }

    const existingProduct = await db.product.findFirst({
      where: { imeiOrSerial: imeiOrSerial.trim() },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, brand: true, isSold: true, soldDate: true, repurchasedDate: true, createdAt: true }
    });

    if (!existingProduct) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      product: existingProduct,
      wasSold: existingProduct.isSold === 1,
      soldDate: existingProduct.soldDate,
      repurchasedDate: existingProduct.repurchasedDate
    });
  } catch (error) {
    console.error('Error checking IMEI/Serial:', error);
    res.status(500).json({ error: 'Failed to check IMEI/Serial' });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { branch: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const response = {
      ...presentProduct(product),
      imeiOrSerial: product.imeiOrSerial !== undefined ? product.imeiOrSerial : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticateToken, (req, res, next) => {
  // Handle file upload (optional)
  uploadOptional(req, res, (err) => {
    if (err) {
      // Only fail if it's not a "no file" error
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.message !== 'Unexpected field') {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, brand, price, storage, color, branchId, stock, grade, description, image, productType, imeiOrSerial } = req.body;

    // Parse numeric fields (they come as strings from FormData)
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);
    const parsedBranchId = parseInt(branchId);

    if (!name || !brand || !price || !storage || !color || !branchId || stock === undefined) {
      // Delete uploaded file if validation fails
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      return res.status(400).json({ error: 'Missing required fields. Please fill in all required fields.' });
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      return res.status(400).json({ error: 'Invalid price. Please enter a valid number.' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      return res.status(400).json({ error: 'Invalid stock. Please enter a valid number.' });
    }

    // If branch user, enforce their branchId
    let finalBranchId = parsedBranchId;
    if (req.isBranchUser && req.branchUser) {
      finalBranchId = req.branchUser.branchId;
    }

    if (isNaN(finalBranchId)) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      return res.status(400).json({ error: 'Invalid branch. Please select a branch.' });
    }

    // Validate IMEI/Serial Number
    if (imeiOrSerial && imeiOrSerial.trim() !== '') {
      const trimmedImei = imeiOrSerial.trim();

      // For phones, IMEI must be exactly 15 digits
      if (productType === 'Phone' || !productType) {
        const cleanImei = trimmedImei.replace(/[\s-]/g, '');

        if (!/^\d{15}$/.test(cleanImei)) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          }
          return res.status(400).json({
            error: 'Invalid IMEI number. IMEI must be exactly 15 digits (numbers only).'
          });
        }
      }

      // Check for duplicate IMEI/Serial (excluding sold products for repurchase detection)
      const duplicateCheck = await db.product.findFirst({
        where: { imeiOrSerial: trimmedImei, isSold: 0 }
      });

      if (duplicateCheck) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
        return res.status(400).json({
          error: `This IMEI/Serial Number already exists in the system (Product: ${duplicateCheck.brand} ${duplicateCheck.name}). Each device must have a unique IMEI/Serial Number.`
        });
      }
    }

    // Check for existing IMEI/Serial if provided (for repurchase detection)
    let repurchaseInfo = null;
    if (imeiOrSerial && imeiOrSerial.trim() !== '') {
      const trimmedImei = imeiOrSerial.trim().replace(/[\s-]/g, '');
      const existingProduct = await db.product.findFirst({
        where: { imeiOrSerial: trimmedImei },
        orderBy: { createdAt: 'desc' }
      });

      if (existingProduct) {
        if (existingProduct.isSold === 1) {
          repurchaseInfo = {
            wasSold: true,
            soldDate: existingProduct.soldDate,
            previousProduct: {
              id: existingProduct.id,
              name: existingProduct.name,
              brand: existingProduct.brand,
              createdAt: existingProduct.createdAt
            }
          };
        } else {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          }
          return res.status(400).json({ error: 'This IMEI/Serial Number already exists in the system and is currently available.' });
        }
      }
    }

    // Handle image - either uploaded file or URL
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else if (req.body.image && req.body.image.trim() !== '') {
      imagePath = req.body.image.trim(); // URL provided
    }

    // Determine if this is a repurchase
    const isRepurchase = repurchaseInfo !== null;
    const repurchasedDate = isRepurchase ? new Date() : null;

    const newProduct = await db.product.create({
      data: {
        name,
        brand,
        price: parsedPrice,
        image: imagePath,
        storage,
        color,
        branchId: finalBranchId,
        stock: parsedStock,
        grade: grade || 'A',
        description: description || '',
        productType: productType || 'Phone',
        imeiOrSerial: imeiOrSerial?.trim() ? imeiOrSerial.trim().replace(/[\s-]/g, '') : null,
        isSold: 0,
        repurchasedDate
      }
    });

    console.log('Product created successfully with ID:', newProduct.id);

    // Return product with repurchase info if applicable
    const response = { ...newProduct };
    if (repurchaseInfo) {
      response.repurchaseWarning = repurchaseInfo;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error stack:', error.stack);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, (req, res, next) => {
  // Handle file upload (optional)
  uploadOptional(req, res, (err) => {
    if (err) {
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.message !== 'Unexpected field') {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, brand, price, image, storage, color, branchId, stock, grade, description, productType, imeiOrSerial, isSold } = req.body;

    // Check if product exists
    const existing = await db.product.findUnique({ where: { id: productId } });
    if (!existing) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    // If branch user, ensure they can only edit their branch's products
    let finalBranchId = (branchId !== undefined && branchId !== '') ? parseInt(branchId) : existing.branchId;
    if (req.isBranchUser && req.branchUser) {
      if (existing.branchId !== req.branchUser.branchId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ error: 'You can only edit products from your branch.' });
      }
      finalBranchId = req.branchUser.branchId;
    }

    // Validate and check for IMEI/Serial conflicts if changed
    if (imeiOrSerial !== undefined && imeiOrSerial.trim() !== '') {
      const trimmedImei = imeiOrSerial.trim();
      const finalProductType = productType !== undefined ? productType : existing.productType || 'Phone';

      // For phones, IMEI must be exactly 15 digits
      if (finalProductType === 'Phone') {
        const cleanImei = trimmedImei.replace(/[\s-]/g, '');

        if (!/^\d{15}$/.test(cleanImei)) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          }
          return res.status(400).json({
            error: 'Invalid IMEI number. IMEI must be exactly 15 digits (numbers only).'
          });
        }
      }

      // Check for duplicate IMEI/Serial (excluding current product and sold products)
      if (trimmedImei.replace(/[\s-]/g, '') !== (existing.imeiOrSerial || '').replace(/[\s-]/g, '')) {
        const conflictingProduct = await db.product.findFirst({
          where: {
            imeiOrSerial: trimmedImei.replace(/[\s-]/g, ''),
            id: { not: productId },
            isSold: 0
          }
        });

        if (conflictingProduct) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          }
          return res.status(400).json({
            error: `This IMEI/Serial Number is already in use by another product (${conflictingProduct.brand} ${conflictingProduct.name}). Each device must have a unique IMEI/Serial Number.`
          });
        }
      }
    }

    // Handle image - either uploaded file or URL
    let imagePath = existing.image;
    if (req.file) {
      // Delete old image if it's a local file
      if (existing.image && existing.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', existing.image);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (unlinkError) {
          console.error('Error deleting old image:', unlinkError);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    } else if (image !== undefined) {
      imagePath = image;
    }

    // Handle sold status
    let soldDate = existing.soldDate;
    let newIsSoldValue = existing.isSold;
    if (isSold !== undefined) {
      const newIsSold = isSold === true || isSold === 1 || isSold === '1';
      const oldIsSold = existing.isSold === 1;
      newIsSoldValue = newIsSold ? 1 : 0;

      if (newIsSold && !oldIsSold) {
        soldDate = new Date();
      } else if (!newIsSold && oldIsSold) {
        soldDate = null;
      }
    }

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        name: name || existing.name,
        brand: brand || existing.brand,
        price: price !== undefined ? parseFloat(price) : existing.price,
        image: imagePath,
        storage: storage || existing.storage,
        color: color || existing.color,
        branchId: finalBranchId,
        stock: stock !== undefined ? parseInt(stock) : existing.stock,
        grade: grade !== undefined ? grade : existing.grade,
        description: description !== undefined ? description : existing.description,
        productType: productType !== undefined ? productType : existing.productType || 'Phone',
        imeiOrSerial: imeiOrSerial !== undefined
          ? (imeiOrSerial.trim() ? imeiOrSerial.trim().replace(/[\s-]/g, '') : null)
          : existing.imeiOrSerial,
        isSold: newIsSoldValue,
        soldDate
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error stack:', error.stack);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// Delete product (admin or branch user)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If branch user, ensure they can only delete their branch's products
    if (req.isBranchUser && req.branchUser) {
      if (product.branchId !== req.branchUser.branchId) {
        return res.status(403).json({ error: 'You can only delete products from your branch.' });
      }
    }

    // Delete associated image file if it's a local file
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (unlinkError) {
        console.error('Error deleting image file:', unlinkError);
      }
    }

    await db.product.delete({ where: { id: productId } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
