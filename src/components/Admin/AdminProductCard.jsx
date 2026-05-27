import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import '../ProductCard.css'
import './AdminProductCard.css'

const AdminProductCard = ({ product, branches, onEdit, onDelete }) => {
  const getGradeLabel = (grade) => {
    const labels = { 'A': 'Excellent', 'B': 'Good', 'C': 'Fair', 'F': 'Poor' }
    return labels[grade] || 'Good'
  }

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : 'Unknown Branch'
  }

  const imageSrc = product.image && product.image.startsWith('/uploads/')
    ? `http://localhost:5000${product.image}`
    : product.image || 'https://via.placeholder.com/200x200?text=Mobile+Phone'

  return (
    <div className="product-card admin-product-card">
      <div className="product-image-container">
        <img
          src={imageSrc}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            if (e.target.src !== 'https://via.placeholder.com/200x200?text=Mobile+Phone') {
              e.target.src = 'https://via.placeholder.com/200x200?text=Mobile+Phone'
            }
          }}
        />
        <div className="admin-card-overlay">
          <button
            onClick={() => onEdit(product)}
            className="admin-card-btn edit-btn"
            title="Edit Product"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                onDelete(product.id)
              }
            }}
            className="admin-card-btn delete-btn"
            title="Delete Product"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-grade-badge">
          <span className={`grade-circle grade-${product.grade || 'A'}`}>
            {product.grade || 'A'}
          </span>
          <span className="grade-label">{getGradeLabel(product.grade || 'A')}</span>
        </div>

        <p className="product-type">{product.brand}</p>
        
        <h3 className="product-name">{product.name}</h3>

        <div className="product-details-admin">
          <div className="product-detail-row">
            <span className="detail-label">Storage:</span>
            <span className="detail-value">{product.storage}</span>
          </div>
          <div className="product-detail-row">
            <span className="detail-label">Color:</span>
            <span className="detail-value">{product.color}</span>
          </div>
          <div className="product-detail-row">
            <span className="detail-label">Branch:</span>
            <span className="detail-value branch-name">{getBranchName(product.branchId)}</span>
          </div>
          <div className="product-detail-row product-detail-row-with-price">
            <div className="stock-section">
              <span className="detail-label">Stock:</span>
              <span className={`detail-value stock-value ${product.stock > 15 ? 'in-stock' : product.stock > 5 ? 'low-stock' : 'very-low-stock'}`}>
                {product.stock}
              </span>
            </div>
            <div className="product-price admin-price-inline">£{product.price}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProductCard

