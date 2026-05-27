import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Lock, User } from 'lucide-react'
import { authAPI } from '../../services/api'
import './Login.css'

const Login = () => {
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
      const response = await authAPI.login(username, password)
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
      navigate('/admin/dashboard')
    } catch (err) {
      // Show more detailed error messages
      let errorMessage = err.message || 'Invalid username or password'
      
      // Check if it's a connection error
      if (errorMessage.includes('Cannot connect') || errorMessage.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running.\n\nTo start the server:\n1. Open a terminal\n2. Navigate to the server folder: cd server\n3. Run: npm start'
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
          <Smartphone className="login-logo" />
          <h1>FoneWorld Admin</h1>
          <p>Sign in to manage products</p>
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
          <p>Default credentials: admin / admin123</p>
          <p className="server-note">
            ⚠️ Make sure the backend server is running on port 5000
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

