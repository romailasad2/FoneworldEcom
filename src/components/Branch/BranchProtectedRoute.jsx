import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { branchAuthAPI } from '../../services/api'

const BranchProtectedRoute = ({ children }) => {
  // CRITICAL: Start with false - never allow access by default
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      // Always start with false and loading true
      setIsAuthenticated(false)
      setLoading(true)
      setHasChecked(false)
      
      const token = localStorage.getItem('branch_token')
      const user = localStorage.getItem('branch_user')
      
      // If no token or user, immediately reject
      if (!token || !user) {
        console.log('[BranchProtectedRoute] No token or user found - redirecting to login')
        // Clear any stale data
        localStorage.removeItem('branch_token')
        localStorage.removeItem('branch_user')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setIsAuthenticated(false)
        setHasChecked(true)
        setLoading(false)
        return
      }

      // Verify token is valid
      let authSuccessful = false
      try {
        console.log('[BranchProtectedRoute] Verifying token...')
        const result = await branchAuthAPI.verify()
        console.log('[BranchProtectedRoute] Verify result:', result)
        
        // STRICT check - must have valid: true AND user object with branchId
        if (result && result.valid === true && result.user && result.user.branchId) {
          console.log('[BranchProtectedRoute] Token verified successfully')
          authSuccessful = true
          setIsAuthenticated(true)
        } else {
          console.warn('[BranchProtectedRoute] Invalid token response - missing required fields:', result)
          throw new Error('Invalid token response - missing required authentication data')
        }
      } catch (error) {
        console.error('[BranchProtectedRoute] Verification failed:', error)
        console.error('[BranchProtectedRoute] Error details:', {
          message: error.message,
          name: error.name
        })
        // Clear invalid credentials immediately - CRITICAL
        localStorage.removeItem('branch_token')
        localStorage.removeItem('branch_user')
        // Also clear admin tokens to prevent confusion
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        // EXPLICITLY set to false - never allow access on error
        authSuccessful = false
        setIsAuthenticated(false)
      } finally {
        // Always mark as checked and stop loading
        setHasChecked(true)
        setLoading(false)
        
        if (!authSuccessful) {
          console.log('[BranchProtectedRoute] Authentication failed - will redirect to login')
        }
      }
    }

    checkAuth()
  }, [location.pathname]) // Re-check on route change

  // CRITICAL: Never render children until we've checked AND authenticated
  // Show loading while checking
  if (loading || !hasChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        <div>Verifying authentication...</div>
      </div>
    )
  }

  // CRITICAL: Only allow access if explicitly authenticated AND checked
  // Must satisfy BOTH conditions
  const shouldAllowAccess = isAuthenticated === true && hasChecked === true
  
  if (!shouldAllowAccess) {
    // Clear any stale data before redirecting
    if (!isAuthenticated) {
      console.log('[BranchProtectedRoute] Blocking access - not authenticated')
      localStorage.removeItem('branch_token')
      localStorage.removeItem('branch_user')
    }
    return <Navigate to="/branch/login" replace state={{ from: location.pathname }} />
  }

  // Only render children if BOTH conditions are true
  console.log('[BranchProtectedRoute] Access granted - authenticated and checked')
  return children
}

export default BranchProtectedRoute

