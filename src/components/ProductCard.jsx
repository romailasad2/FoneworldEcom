import React from 'react'
import './ProductCard.css'

const ProductCard = ({ product, branches }) => {

  const getGradeLabel = (grade) => {
    const labels = { 'A': 'Excellent', 'B': 'Good', 'C': 'Fair', 'F': 'Poor' }
    return labels[grade] || 'Good'
  }

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image && product.image.startsWith('/uploads/') 
            ? `https://foneworldecom.onrender.com${product.image}` 
            : product.image || 'https://via.placeholder.com/200x200?text=Mobile+Phone'}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            if (e.target.src !== 'https://via.placeholder.com/200x200?text=Mobile+Phone') {
              e.target.src = 'https://via.placeholder.com/200x200?text=Mobile+Phone'
            }
          }}
        />
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

        <div className="product-specs">
          <div className="product-spec-row">
            <span className="spec-label">Storage:</span>
            <span className="spec-value">{product.storage}</span>
          </div>
          <div className="product-spec-row">
            <span className="spec-label">Color:</span>
            <span className="spec-value">{product.color}</span>
          </div>
        </div>

        <div className="product-footer">
          <div className="product-price">£{product.price}</div>
          <button className="add-to-cart-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard

