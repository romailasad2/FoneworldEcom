import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Lock, User } from 'lucide-react'
import { branchAuthAPI } from '../../services/api'
import './BranchLogin.css'

const BranchLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting branch login for:', username)
      const response = await branchAuthAPI.login(username, password)
      console.log('Login response received:', response)
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server')
      }
      
      localStorage.setItem('branch_token', response.token)
      localStorage.setItem('branch_user', JSON.stringify(response.user))
      
      console.log('Token saved, navigating to dashboard...')
      navigate('/branch/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      let errorMessage = err.message || 'Invalid username or password'
      
      if (errorMessage.includes('Cannot connect') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000 and has been restarted to include branch authentication routes.'
      } else if (errorMessage.includes('Cannot GET') || errorMessage.includes('404')) {
        errorMessage = 'Branch authentication route not found. Please restart the backend server.'
      } else if (errorMessage.includes('401') || errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid username or password. Please check your credentials.'
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Access denied. Please contact your administrator.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Store className="login-logo" />
          <h1>Branch Portal</h1>
          <p>Sign in to manage your branch products</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>
              <User size={18} />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Contact your administrator for login credentials</p>
        </div>
      </div>
    </div>
  )
}

export default BranchLogin

