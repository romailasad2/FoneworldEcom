import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Store, Package } from 'lucide-react'
import BranchProductsManagement from './BranchProductsManagement'
import './BranchDashboard.css'

const BranchDashboard = () => {
  const [branchUser, setBranchUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // ProtectedRoute handles authentication, so if we're here, we're authenticated
    // Just load the user data
    const userStr = localStorage.getItem('branch_user')
    
    if (!userStr) {
      // This shouldn't happen if ProtectedRoute is working, but as a safeguard:
      console.error('[BranchDashboard] No user data found - redirecting')
      navigate('/branch/login', { replace: true })
      return
    }
    
    try {
      const user = JSON.parse(userStr)
      // Verify user has required fields
      if (!user.branchId) {
        throw new Error('Invalid user data - missing branchId')
      }
      setBranchUser(user)
    } catch (err) {
      console.error('[BranchDashboard] Error parsing user:', err)
      // Clear invalid data and redirect
      localStorage.removeItem('branch_token')
      localStorage.removeItem('branch_user')
      navigate('/branch/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('branch_token')
    localStorage.removeItem('branch_user')
    navigate('/branch/login')
  }, [navigate])

  if (!branchUser) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Store className="header-icon" />
            <div>
              <h1>Branch Portal</h1>
              <p>{branchUser.branchName || 'Branch Dashboard'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content-wrapper">
        <BranchProductsManagement branchId={branchUser.branchId} branchName={branchUser.branchName} />
      </div>
    </div>
  )
}

export default BranchDashboard

