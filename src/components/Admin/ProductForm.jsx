import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { productsAPI } from '../../services/api'
import { resolveImageUrl } from '../../config.js'
import './ProductForm.css'

const ProductForm = ({ product, branches, onClose, onSuccess, branchLocked = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    image: '',
    storage: '128GB',
    color: '',
    branchId: '',
    stock: '',
    grade: 'A',
    description: '',
    productType: 'Phone',
    imeiOrSerial: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [repurchaseWarning, setRepurchaseWarning] = useState(null)
  const [checkingImei, setCheckingImei] = useState(false)
  const [imeiError, setImeiError] = useState('')

  useEffect(() => {
    if (product) {
      console.log('=== PRODUCT EDIT DEBUG ===')
      console.log('Product data received:', product)
      console.log('IMEI/Serial field:', product.imeiOrSerial, 'Type:', typeof product.imeiOrSerial)
      console.log('All product keys:', Object.keys(product))
      console.log('Has imeiOrSerial key?', 'imeiOrSerial' in product)
      console.log('imeiOrSerial value check:', product.imeiOrSerial === null, product.imeiOrSerial === undefined, product.imeiOrSerial === '')
      
      // Handle imeiOrSerial - check for null, undefined, or empty string
      let imeiValue = '';
      if (product.imeiOrSerial !== null && product.imeiOrSerial !== undefined && product.imeiOrSerial !== '') {
        imeiValue = String(product.imeiOrSerial);
      }
      
      const formDataToSet = {
        name: product.name || '',
        brand: product.brand || '',
        price: product.price || '',
        image: product.image || '',
        storage: product.storage || '128GB',
        color: product.color || '',
        branchId: product.branchId || '',
        stock: product.stock || '',
        grade: product.grade || 'A',
        description: product.description || '',
        productType: product.productType || 'Phone',
        imeiOrSerial: imeiValue,
        isSold: product.isSold === 1 || product.isSold === true
      }
      
      console.log('Form data being set:', formDataToSet)
      console.log('IMEI value in formData:', formDataToSet.imeiOrSerial)
      console.log('========================')
      setFormData(formDataToSet)
      // Clear IMEI error when loading product
      setImeiError('')
      // Set image preview if product has image
      if (product.image) {
        setImagePreview(resolveImageUrl(product.image) || product.image)
      }
    } else if (branchLocked && branches.length === 1) {
      // If branch is locked and creating new product, set the branchId
      setFormData(prev => ({
        ...prev,
        branchId: branches[0].id
      }))
    }
  }, [product, branchLocked, branches])

  const validateImei = (imei, productType) => {
    if (!imei || imei.trim() === '') {
      return { valid: true, error: '' }
    }
    
    // For phones, IMEI must be exactly 15 digits
    if (productType === 'Phone') {
      const cleanImei = imei.replace(/[\s-]/g, '')
      if (!/^\d{15}$/.test(cleanImei)) {
        if (cleanImei.length < 15) {
          return { valid: false, error: `IMEI must be exactly 15 digits. Currently ${cleanImei.length} digits.` }
        } else if (cleanImei.length > 15) {
          return { valid: false, error: `IMEI must be exactly 15 digits. Currently ${cleanImei.length} digits.` }
        } else if (!/^\d+$/.test(cleanImei)) {
          return { valid: false, error: 'IMEI must contain only numbers (no letters or special characters).' }
        }
      }
    }
    
    return { valid: true, error: '' }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' 
        ? (value === '' ? '' : parseFloat(value)) 
        : value
    }))
    
    // Validate IMEI/Serial when it changes
    if (name === 'imeiOrSerial') {
      setRepurchaseWarning(null)
      const validation = validateImei(value, formData.productType)
      setImeiError(validation.error)
    }
    
    // Re-validate IMEI if product type changes
    if (name === 'productType' && formData.imeiOrSerial) {
      const validation = validateImei(formData.imeiOrSerial, value)
      setImeiError(validation.error)
    }
  }

  // Check IMEI/Serial when it's entered (debounced)
  useEffect(() => {
    if (!formData.imeiOrSerial || formData.imeiOrSerial.trim() === '' || product) {
      setRepurchaseWarning(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setCheckingImei(true)
      try {
        const result = await productsAPI.checkImei(formData.imeiOrSerial)
        if (result.exists && result.wasSold) {
          setRepurchaseWarning({
            wasSold: true,
            soldDate: result.soldDate,
            previousProduct: result.product
          })
        } else {
          setRepurchaseWarning(null)
        }
      } catch (error) {
        console.error('Error checking IMEI/Serial:', error)
        setRepurchaseWarning(null)
      } finally {
        setCheckingImei(false)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.imeiOrSerial, product])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, image: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validate IMEI before submission
    if (formData.imeiOrSerial && formData.imeiOrSerial.trim() !== '') {
      const validation = validateImei(formData.imeiOrSerial, formData.productType)
      if (!validation.valid) {
        setError(validation.error)
        setLoading(false)
        return
      }
    }

    try {
      console.log('Submitting product:', { formData, imageFile: imageFile ? imageFile.name : 'none' })
      
      let result
      if (product) {
        result = await productsAPI.update(product.id, formData, imageFile)
        setSuccess('Product updated successfully!')
      } else {
        result = await productsAPI.create(formData, imageFile)
        
        // Check if there's a repurchase warning in the response
        if (result.repurchaseWarning) {
          setRepurchaseWarning(result.repurchaseWarning)
          // Still show success but with warning
          setSuccess('Product created successfully! (Repurchase detected)')
        } else {
          setSuccess('Product created successfully!')
        }
      }
      
      console.log('Product saved successfully:', result)
      
      // Clear form state
      setImageFile(null)
      setImagePreview('')
      setFormData({
        name: '',
        brand: '',
        price: '',
        image: '',
        storage: '128GB',
        color: '',
        branchId: '',
        stock: '',
        grade: 'A',
        description: '',
        productType: 'Phone',
        imeiOrSerial: ''
      })
      setRepurchaseWarning(null)
      
      // Wait a moment to show success message, then close form
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err.message || 'Failed to save product. Please check all fields and try again.')
      setLoading(false) // Don't close form on error
    }
  }

  const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Oppo', 'Vivo', 'Realme', 'Motorola']
  const storageOptions = ['128GB', '256GB', '512GB', '1TB']
  const productTypeOptions = [
    { value: 'Phone', label: 'Phone' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'iPad', label: 'iPad' }
  ]
  const gradeOptions = [
    { value: 'A', label: 'A - Very Good (Mint Condition)' },
    { value: 'B', label: 'B - Slightly Used (Use Marks)' },
    { value: 'C', label: 'C - Bad Condition (Scratches)' },
    { value: 'F', label: 'F - Non Working' }
  ]

  const getImeiLabel = () => {
    switch (formData.productType) {
      case 'Tablet':
      case 'iPad':
        return 'Serial Number *'
      case 'Phone':
      default:
        return 'IMEI Number *'
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="form-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="form-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}
        
        {repurchaseWarning && (
          <div className="repurchase-warning">
            <AlertTriangle size={18} />
            <div className="repurchase-warning-content">
              <strong>Repurchase Detected!</strong>
              <p>This {formData.productType === 'Phone' ? 'IMEI' : 'Serial Number'} was previously in the system and was sold.</p>
              {repurchaseWarning.previousProduct && (
                <div className="repurchase-details">
                  <p><strong>Previous Product:</strong> {repurchaseWarning.previousProduct.brand} {repurchaseWarning.previousProduct.name}</p>
                  {repurchaseWarning.soldDate && (
                    <p><strong>Sold Date:</strong> {new Date(repurchaseWarning.soldDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => setRepurchaseWarning(null)}
              className="close-warning-btn"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label>Product Type *</label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                required
              >
                {productTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., iPhone 15 Pro Max"
              />
            </div>

            <div className="form-group">
              <label>{getImeiLabel()}</label>
              <input
                type="text"
                name="imeiOrSerial"
                value={formData.imeiOrSerial || ''}
                onChange={handleChange}
                required
                placeholder={formData.productType === 'Phone' ? 'Enter 15-digit IMEI number' : 'Enter Serial number'}
                maxLength={formData.productType === 'Phone' ? 15 : undefined}
                style={{ 
                  borderColor: imeiError ? '#DC2626' : (formData.imeiOrSerial && !imeiError ? '#22C55E' : undefined)
                }}
              />
              {formData.productType === 'Phone' && (
                <p className="form-hint" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Must be exactly 15 digits
                </p>
              )}
              {imeiError && (
                <p className="form-hint" style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {imeiError}
                </p>
              )}
              {checkingImei && (
                <p className="form-hint">Checking for duplicates...</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (£) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="799.99"
              />
            </div>

            <div className="form-group">
              <label>Storage *</label>
              <select
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                required
              >
                {storageOptions.map(storage => (
                  <option key={storage} value={storage}>{storage}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Color *</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                placeholder="e.g., Titanium Blue"
              />
            </div>

            <div className="form-group">
              <label>Branch *</label>
              {branchLocked && branches.length === 1 ? (
                <input
                  type="text"
                  value={branches[0].name}
                  disabled
                  className="disabled-input"
                />
              ) : (
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  required
                  disabled={branchLocked}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              )}
              {branchLocked && (
                <p className="form-hint">Branch is locked to your branch</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="15"
              />
            </div>

            <div className="form-group">
              <label>Grade (Condition) *</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
              >
                {gradeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {product && (
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isSold"
                    checked={formData.isSold || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isSold: e.target.checked }))}
                  />
                  <span>Mark as Sold</span>
                </label>
                {formData.isSold && product.soldDate && (
                  <p className="form-hint">
                    Previously sold on: {new Date(product.soldDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Product Image</label>
            <div className="image-upload-section">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="image-upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-file-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    Choose Image File
                  </label>
                  <p className="image-upload-hint">or enter URL below</p>
                </div>
              )}
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Or enter image URL: https://example.com/image.jpg"
                className="image-url-input"
                disabled={!!imageFile}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Product description..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm

