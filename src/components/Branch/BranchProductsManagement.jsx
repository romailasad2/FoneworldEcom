import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { productsAPI } from '../../services/api'
import { resolveImageUrl } from '../../config.js'
import ProductForm from '../Admin/ProductForm'
import './BranchDashboard.css'

const BranchProductsManagement = ({ branchId, branchName }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [branchId])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const allProducts = await productsAPI.getAll()
      // Filter products to only show this branch's products
      const branchProducts = allProducts.filter(p => p.branchId === branchId)
      setProducts(branchProducts)
    } catch (err) {
      setError('Failed to load products: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [branchId])

  const handleCreate = useCallback(() => {
    setEditingProduct(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((product) => {
    setEditingProduct(product)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await productsAPI.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete product: ' + err.message)
    }
  }, [])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingProduct(null)
  }, [])

  const handleFormSuccess = useCallback(async () => {
    try {
      await loadData()
      setTimeout(() => {
        handleFormClose()
      }, 100)
    } catch (err) {
      console.error('Error reloading data:', err)
      handleFormClose()
    }
  }, [loadData, handleFormClose])

  // Create a branches array with only this branch for the form
  const branches = useMemo(() => {
    return [{ id: branchId, name: branchName }]
  }, [branchId, branchName])

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <Package className="header-icon" size={24} />
        <div>
          <h2>Products Management</h2>
          <p>Manage products for {branchName}</p>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-actions">
          <button onClick={handleCreate} className="create-button">
            <Plus size={18} />
            Add New Product
          </button>
          <div className="products-count">
            Total Products: <strong>{products.length}</strong>
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Storage</th>
                <th>Color</th>
                <th>Stock</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-state">
                    No products found. Click "Add New Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const imageSrc = resolveImageUrl(product.image) || 'https://via.placeholder.com/50?text=No+Image'
                  
                  const handleImageError = (e) => {
                    if (e.target.src !== 'https://via.placeholder.com/50?text=No+Image') {
                      e.target.src = 'https://via.placeholder.com/50?text=No+Image'
                    }
                  }

                  return (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="product-thumbnail"
                          onError={handleImageError}
                          loading="lazy"
                        />
                      </td>
                      <td className="product-name-cell">{product.name}</td>
                      <td>{product.brand}</td>
                      <td className="price-cell">£{product.price}</td>
                      <td>{product.storage}</td>
                      <td>{product.color}</td>
                      <td>
                        <span className={`stock-badge ${product.stock > 15 ? 'in-stock' : product.stock > 5 ? 'low-stock' : 'very-low-stock'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`grade-badge grade-${product.grade || 'A'}`}>
                          {product.grade || 'A'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(product)}
                            className="edit-button"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="delete-button"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          branches={branches}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          branchLocked={true}
        />
      )}
    </div>
  )
}

export default BranchProductsManagement




