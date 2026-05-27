import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { productsAPI, branchesAPI } from '../../services/api'
import ProductForm from './ProductForm'
import FilterPanel from '../FilterPanel'
import AdminProductCard from './AdminProductCard'
import '../ProductListing.css'
import './AdminProductsManagement.css'

const ProductsManagement = () => {
  const [products, setProducts] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Filter states (same as frontend)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedBranches, setSelectedBranches] = useState([])
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [selectedStorage, setSelectedStorage] = useState([])
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [productsData, branchesData] = await Promise.all([
        productsAPI.getAll(),
        branchesAPI.getAll()
      ])
      setProducts(productsData)
      setBranches(branchesData)
      
      // Set max price from products (only once on initial load)
      if (isInitialLoad && productsData.length > 0) {
        const maxPrice = Math.max(...productsData.map(p => p.price || 0))
        if (maxPrice > 0) {
          setPriceRange([0, Math.ceil(maxPrice)])
          setIsInitialLoad(false)
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [isInitialLoad])

  // Extract unique brands from products
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))]
    return uniqueBrands.sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    if (loading) return []
    
    let filtered = [...products]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        product.color.toLowerCase().includes(query)
      )
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => selectedBrands.includes(product.brand))
    }

    // Branch filter
    if (selectedBranches.length > 0) {
      filtered = filtered.filter(product => selectedBranches.includes(product.branchId))
    }

    // Price filter
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    )

    // Storage filter
    if (selectedStorage.length > 0) {
      filtered = filtered.filter(product => selectedStorage.includes(product.storage))
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'grade':
          const gradeOrder = { 'A': 4, 'B': 3, 'C': 2, 'F': 1 }
          return (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0)
        case 'stock':
          return b.stock - a.stock
        default:
          return 0
      }
    })

    return filtered
  }, [products, loading, searchQuery, selectedBrands, selectedBranches, priceRange, selectedStorage, sortBy])

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 2000
    return Math.ceil(Math.max(...products.map(p => p.price)))
  }, [products])

  const clearFilters = () => {
    setSelectedBrands([])
    setSelectedBranches([])
    setPriceRange([0, maxPrice])
    setSelectedStorage([])
    setSearchQuery('')
  }

  const hasActiveFilters = selectedBrands.length > 0 ||
    selectedBranches.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    selectedStorage.length > 0

  const handleCreate = useCallback(() => {
    setEditingProduct(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback(async (product) => {
    try {
      // Fetch fresh product data to ensure we have all fields including imeiOrSerial
      const freshProduct = await productsAPI.getById(product.id)
      setEditingProduct(freshProduct)
      setShowForm(true)
    } catch (err) {
      console.error('Error fetching product for edit:', err)
      // Fallback to using the product from the list
      setEditingProduct(product)
      setShowForm(true)
    }
  }, [])

  const handleDelete = useCallback(async (id) => {
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

  if (loading) {
    return (
      <div className="product-listing">
        <div className="loading-state">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="product-listing admin-product-listing">
      <div className="listing-header">
        <h2 className="page-title">Products Management</h2>
        <p className="page-subtitle">Manage mobile products for all branches</p>
      </div>

      <div className="admin-header-actions">
        <button onClick={handleCreate} className="create-button">
          <Plus size={18} />
          Add New Product
        </button>
      </div>

      {error && (
        <div className="error-banner admin-error-banner">
          {error}
        </div>
      )}

      <div className="search-and-filters">
        <div className="search-bar-container">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, brand, color, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="clear-search"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="controls-row">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="listing-content">
        <FilterPanel
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          selectedBranches={selectedBranches}
          setSelectedBranches={setSelectedBranches}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          selectedStorage={selectedStorage}
          setSelectedStorage={setSelectedStorage}
          branches={branches}
          brands={brands}
          maxPrice={maxPrice}
        />

        <div className="products-section">
          <div className="results-header">
            <div className="results-info">
              <p>
                <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
                {products.length !== filteredProducts.length && (
                  <span className="filtered-count"> (of {products.length} total)</span>
                )}
              </p>
            </div>
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort By:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="grade">Best Grade (A to F)</option>
                <option value="stock">Most Stock</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  branches={branches}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Search size={48} />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          branches={branches}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default ProductsManagement
