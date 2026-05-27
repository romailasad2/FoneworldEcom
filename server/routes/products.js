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

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await db.all(`
      SELECT p.*, b.name as branchName, b.address as branchAddress, b.phone as branchPhone
      FROM products p
      LEFT JOIN branches b ON p.branchId = b.id
      ORDER BY p.id DESC
    `);
    res.json(products);
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

    const existingProduct = await db.get(
      `SELECT id, name, brand, isSold, soldDate, repurchasedDate, createdAt 
       FROM products 
       WHERE imeiOrSerial = ? 
       ORDER BY createdAt DESC 
       LIMIT 1`,
      [imeiOrSerial.trim()]
    );

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
    const product = await db.get(`
      SELECT p.*, b.name as branchName, b.address as branchAddress, b.phone as branchPhone
      FROM products p
      LEFT JOIN branches b ON p.branchId = b.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Fetching product ID:', req.params.id);
    console.log('Product data:', JSON.stringify(product, null, 2));
    console.log('IMEI/Serial value:', product.imeiOrSerial, 'Type:', typeof product.imeiOrSerial);
    console.log('All product keys:', Object.keys(product));

    // Ensure imeiOrSerial is always included (even if null)
    const response = {
      ...product,
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
  console.log('Product creation request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  // Handle file upload (optional)
  uploadOptional(req, res, (err) => {
    if (err) {
      // Only fail if it's not a "no file" error
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.message !== 'Unexpected field') {
        console.error('Multer error:', err);
        console.error('Multer error details:', err.message, err.code);
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      // If it's just "no file", that's okay - continue
      console.log('No file uploaded, continuing without file');
    } else {
      console.log('Multer processing complete');
      if (req.file) {
        console.log('File uploaded:', req.file.filename);
      } else {
        console.log('No file uploaded');
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, brand, price, storage, color, branchId, stock, grade, description, image, productType, imeiOrSerial } = req.body;

    console.log('Received product data:', { name, brand, price, storage, color, branchId, stock, grade, description, image, productType, imeiOrSerial });
    console.log('File uploaded:', req.file ? req.file.filename : 'none');
    console.log('Image URL provided:', image || 'none');

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
        // Remove any spaces or dashes that might be in the IMEI
        const cleanImei = trimmedImei.replace(/[\s-]/g, '');
        
        // Check if it's exactly 15 digits
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
      const duplicateCheck = await db.get(
        `SELECT id, name, brand, isSold 
         FROM products 
         WHERE imeiOrSerial = ? AND isSold = 0
         LIMIT 1`,
        [trimmedImei]
      );

      if (duplicateCheck) {
        // IMEI/Serial already exists and is not sold - this is a duplicate
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
      const existingProduct = await db.get(
        `SELECT id, name, brand, isSold, soldDate, repurchasedDate, createdAt 
         FROM products 
         WHERE imeiOrSerial = ? 
         ORDER BY createdAt DESC 
         LIMIT 1`,
        [trimmedImei]
      );

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
          // IMEI/Serial already exists and is not sold - duplicate
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
    const repurchasedDate = isRepurchase ? new Date().toISOString() : null;

    console.log('Inserting product with data:', {
      name, brand, price: parsedPrice, image: imagePath, storage, color,
      branchId: parsedBranchId, stock: parsedStock, grade: grade || 'A', description,
      productType: productType || 'Phone', imeiOrSerial: imeiOrSerial?.trim() || null,
      isRepurchase, repurchasedDate
    });

    const result = await db.run(
      `INSERT INTO products (name, brand, price, image, storage, color, branchId, stock, grade, description, productType, imeiOrSerial, isSold, repurchasedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        name, brand, parsedPrice, imagePath, storage, color, finalBranchId, parsedStock, 
        grade || 'A', description || '', productType || 'Phone', 
        (imeiOrSerial?.trim() ? imeiOrSerial.trim().replace(/[\s-]/g, '') : null), repurchasedDate
      ]
    );

    console.log('Insert result:', result);

    if (!result || result.lastID === undefined || result.lastID === null) {
      console.error('Insert failed - no lastID returned. Result:', result);
      throw new Error('Failed to insert product into database - no ID returned');
    }

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    if (!newProduct) {
      throw new Error('Product was created but could not be retrieved');
    }
    
    console.log('Product created successfully with ID:', result.lastID);
    console.log('Created product data:', JSON.stringify(newProduct, null, 2));
    console.log('IMEI/Serial in created product:', newProduct.imeiOrSerial);
    
    // Return product with repurchase info if applicable
    const response = { ...newProduct };
    if (repurchaseInfo) {
      response.repurchaseWarning = repurchaseInfo;
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error stack:', error.stack);
    // Delete uploaded file if error occurs
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
      // Only fail if it's not a "no file" error
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.message !== 'Unexpected field') {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      // If it's just "no file", that's okay - continue
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, brand, price, image, storage, color, branchId, stock, grade, description, productType, imeiOrSerial, isSold } = req.body;

    // Check if product exists
    const existing = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      // Delete uploaded file if product doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    // If branch user, ensure they can only edit their branch's products
    let finalBranchId = branchId || existing.branchId;
    if (req.isBranchUser && req.branchUser) {
      if (existing.branchId !== req.branchUser.branchId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ error: 'You can only edit products from your branch.' });
      }
      // Force branchId to their branch
      finalBranchId = req.branchUser.branchId;
    }

    // Validate and check for IMEI/Serial conflicts if changed
    if (imeiOrSerial !== undefined && imeiOrSerial.trim() !== '') {
      const trimmedImei = imeiOrSerial.trim();
      const finalProductType = productType !== undefined ? productType : existing.productType || 'Phone';
      
      // For phones, IMEI must be exactly 15 digits
      if (finalProductType === 'Phone') {
        // Remove any spaces or dashes that might be in the IMEI
        const cleanImei = trimmedImei.replace(/[\s-]/g, '');
        
        // Check if it's exactly 15 digits
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
        const conflictingProduct = await db.get(
          `SELECT id, name, brand FROM products 
           WHERE imeiOrSerial = ? AND id != ? AND isSold = 0`,
          [trimmedImei.replace(/[\s-]/g, ''), req.params.id]
        );
        
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
    if (isSold !== undefined) {
      const newIsSold = isSold === true || isSold === 1 || isSold === '1';
      const oldIsSold = existing.isSold === 1;
      
      if (newIsSold && !oldIsSold) {
        // Product is being marked as sold
        soldDate = new Date().toISOString();
      } else if (!newIsSold && oldIsSold) {
        // Product is being marked as available again
        soldDate = null;
      }
    }

    await db.run(
      `UPDATE products 
       SET name = ?, brand = ?, price = ?, image = ?, storage = ?, color = ?, 
           branchId = ?, stock = ?, grade = ?, description = ?, productType = ?, 
           imeiOrSerial = ?, isSold = ?, soldDate = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || existing.name,
        brand || existing.brand,
        price !== undefined ? price : existing.price,
        imagePath,
        storage || existing.storage,
        color || existing.color,
        finalBranchId,
        stock !== undefined ? stock : existing.stock,
        grade !== undefined ? grade : existing.grade,
        description !== undefined ? description : existing.description,
        productType !== undefined ? productType : existing.productType || 'Phone',
        imeiOrSerial !== undefined ? (imeiOrSerial.trim() ? imeiOrSerial.trim().replace(/[\s-]/g, '') : null) : existing.imeiOrSerial,
        isSold !== undefined ? (isSold === true || isSold === 1 || isSold === '1' ? 1 : 0) : existing.isSold,
        soldDate,
        req.params.id
      ]
    );

    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error stack:', error.stack);
    // Delete uploaded file if error occurs
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
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
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

    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

