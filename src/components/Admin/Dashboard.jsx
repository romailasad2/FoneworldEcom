import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, Store, Settings } from 'lucide-react'
import ProductsManagement from './ProductsManagement'
import BranchesManagement from './BranchesManagement'
import SettingsComponent from './Settings'
import './Dashboard.css'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('products')
  const navigate = useNavigate()

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }, [navigate])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Package className="header-icon" />
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage your e-commerce store</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} />
          Products
        </button>
        <button
          className={`tab-button ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <Store size={18} />
          Branches
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      <div className="dashboard-content-wrapper">
        {activeTab === 'products' && <ProductsManagement />}
        {activeTab === 'branches' && <BranchesManagement />}
        {activeTab === 'settings' && <SettingsComponent />}
      </div>
    </div>
  )
}

export default Dashboard

