import React, { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import './FilterPanel.css'

const FilterPanel = ({
  selectedBrands,
  setSelectedBrands,
  selectedBranches,
  setSelectedBranches,
  priceRange,
  setPriceRange,
  selectedStorage,
  setSelectedStorage,
  branches,
  brands,
  maxPrice = 2000
}) => {
  const storageOptions = ['128GB', '256GB', '512GB', '1TB']
  const [branchSearchTerm, setBranchSearchTerm] = useState('')

  const filteredBranches = useMemo(() => {
    if (!branchSearchTerm.trim()) {
      return branches
    }
    const searchLower = branchSearchTerm.toLowerCase()
    return branches.filter(branch =>
      branch.name.toLowerCase().includes(searchLower)
    )
  }, [branches, branchSearchTerm])

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const toggleBranch = (branchId) => {
    setSelectedBranches(prev =>
      prev.includes(branchId)
        ? prev.filter(b => b !== branchId)
        : [...prev, branchId]
    )
  }

  const toggleStorage = (storage) => {
    setSelectedStorage(prev =>
      prev.includes(storage)
        ? prev.filter(s => s !== storage)
        : [...prev, storage]
    )
  }

  return (
    <aside className="filter-panel">
      <div className="filter-panel-content">
        <h3 className="filter-title">Filters</h3>

        <div className="filter-section">
          <h4 className="filter-section-title">Price Range</h4>
          <div className="price-range">
            <div className="price-inputs">
              <div className="price-input-wrapper">
                <span className="price-currency">£</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="price-input"
                  placeholder="0"
                />
              </div>
              <span className="price-separator">-</span>
              <div className="price-input-wrapper">
                <span className="price-currency">£</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
                  className="price-input"
                  placeholder={maxPrice.toString()}
                />
              </div>
            </div>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="price-slider"
              />
            <div className="price-labels">
              <span>£{priceRange[0]}</span>
              <span>£{priceRange[1]}</span>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Brand</h4>
          <div className="filter-options">
            {brands.map(brand => (
              <label key={brand} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Storage</h4>
          <div className="filter-options">
            {storageOptions.map(storage => (
              <label key={storage} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedStorage.includes(storage)}
                  onChange={() => toggleStorage(storage)}
                />
                <span>{storage}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Branch</h4>
          <div className="branch-search-wrapper">
            <div className="branch-search-input-wrapper">
              <Search size={18} className="branch-search-icon" />
              <input
                type="text"
                placeholder="Search branches..."
                value={branchSearchTerm}
                onChange={(e) => setBranchSearchTerm(e.target.value)}
                className="branch-search-input"
              />
            </div>
          </div>
          <div className="filter-options branch-options">
            {filteredBranches.length > 0 ? (
              filteredBranches.map(branch => (
                <label key={branch.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch.id)}
                    onChange={() => toggleBranch(branch.id)}
                  />
                  <span>{branch.name}</span>
                </label>
              ))
            ) : (
              <div className="no-branches-found">
                No branches found
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default FilterPanel

