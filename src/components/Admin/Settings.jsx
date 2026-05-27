import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import './Settings.css'

const Settings = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [passwordInfo, setPasswordInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Username update form
  const [usernameForm, setUsernameForm] = useState({
    currentPassword: '',
    newUsername: ''
  })

  // Password update form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showUsernamePasswords, setShowUsernamePasswords] = useState({
    current: false
  })

  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      setLoading(true)
      setError('')
      const user = await authAPI.getCurrentUser()
      
      if (!user || !user.username) {
        throw new Error('Invalid user data received')
      }
      
      setCurrentUser(user)
      setUsernameForm(prev => ({ ...prev, newUsername: user.username || '' }))
      
      // Load password info
      try {
        const pwdInfo = await authAPI.getPasswordInfo()
        setPasswordInfo(pwdInfo)
      } catch (pwdErr) {
        console.warn('Could not load password info:', pwdErr)
        // Don't fail the whole load if password info fails
      }
    } catch (err) {
      console.error('Error loading user:', err)
      const errorMessage = err.message || 'Failed to load user information'
      setError(errorMessage)
      
      // If unauthorized, redirect to login
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('token')) {
        setTimeout(() => {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          navigate('/admin/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameChange = (e) => {
    const { name, value } = e.target
    setUsernameForm(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (!usernameForm.currentPassword) {
        setError('Current password is required')
        setSaving(false)
        return
      }

      if (!usernameForm.newUsername || usernameForm.newUsername.trim() === '') {
        setError('New username is required')
        setSaving(false)
        return
      }

      if (currentUser && usernameForm.newUsername === currentUser.username) {
        setError('New username must be different from current username')
        setSaving(false)
        return
      }

      const result = await authAPI.updateCredentials(
        usernameForm.currentPassword,
        usernameForm.newUsername.trim(),
        null
      )

      if (!result || !result.user) {
        throw new Error('Invalid response from server')
      }

      setSuccess('Username updated successfully!')
      setCurrentUser(result.user)
      
      // Update token if returned
      if (result.token) {
        localStorage.setItem('admin_token', result.token)
        localStorage.setItem('admin_user', JSON.stringify(result.user))
      }

      // Clear form with new username
      setUsernameForm({
        currentPassword: '',
        newUsername: result.user.username || usernameForm.newUsername.trim()
      })

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating username:', err)
      setError(err.message || 'Failed to update username')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (!passwordForm.currentPassword) {
        setError('Current password is required')
        setSaving(false)
        return
      }

      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
        setError('New password must be at least 6 characters long')
        setSaving(false)
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New password and confirm password do not match')
        setSaving(false)
        return
      }

      await authAPI.updateCredentials(
        passwordForm.currentPassword,
        null,
        passwordForm.newPassword
      )

      setSuccess('Password updated successfully!')
      
      // Reload password info to check if it's still default
      try {
        const pwdInfo = await authAPI.getPasswordInfo()
        setPasswordInfo(pwdInfo)
        setShowPassword(false) // Hide password after update
      } catch (pwdErr) {
        console.warn('Could not reload password info:', pwdErr)
      }
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating password:', err)
      setError(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <div>Loading settings...</div>
      </div>
    )
  }

  // Don't render forms if user data failed to load
  const canEdit = currentUser && currentUser.username

  return (
    <div className="settings-container">
      <div className="section-header">
        <SettingsIcon className="header-icon" />
        <div>
          <h2>Admin Settings</h2>
          <p>Manage your admin account credentials</p>
        </div>
      </div>

      <div className="settings-content">
        {error && (
          <div className="settings-message settings-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="settings-message settings-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Current User Info */}
        <div className="settings-section">
          <div className="settings-section-header">
            <User size={20} />
            <h3>Current Account Information</h3>
          </div>
          <div className="settings-info-card">
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{currentUser && currentUser.username ? currentUser.username : 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Password:</span>
              <span className="info-value password-display">
                {passwordInfo && passwordInfo.isDefault && passwordInfo.defaultPassword ? (
                  <>
                    {showPassword ? (
                      <>
                        <span className="password-visible">{passwordInfo.defaultPassword}</span>
                        <button 
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(false)}
                          title="Hide password"
                        >
                          <EyeOff size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="password-masked">••••••••</span>
                        <button 
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(true)}
                          title="Show password"
                        >
                          <Eye size={16} />
                        </button>
                      </>
                    )}
                    <span className="password-note">(Default password)</span>
                  </>
                ) : (
                  <>
                    <span className="password-masked">••••••••</span>
                    <span className="password-note">(Encrypted - cannot be displayed)</span>
                  </>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Account Created:</span>
              <span className="info-value">
                {currentUser && currentUser.createdAt 
                  ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Update Username */}
        {canEdit && (
        <div className="settings-section">
          <div className="settings-section-header">
            <User size={20} />
            <h3>Update Username</h3>
          </div>
          <form onSubmit={handleUpdateUsername} className="settings-form">
            <div className="form-group">
              <label htmlFor="currentPasswordUsername">Current Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showUsernamePasswords.current ? 'text' : 'password'}
                  id="currentPasswordUsername"
                  name="currentPassword"
                  value={usernameForm.currentPassword}
                  onChange={handleUsernameChange}
                  required
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowUsernamePasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showUsernamePasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newUsername">New Username *</label>
              <input
                type="text"
                id="newUsername"
                name="newUsername"
                value={usernameForm.newUsername}
                onChange={handleUsernameChange}
                required
                placeholder="Enter new username"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button" disabled={saving}>
                <Save size={18} />
                {saving ? 'Updating...' : 'Update Username'}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Update Password */}
        {canEdit && (
        <div className="settings-section">
          <div className="settings-section-header">
            <Lock size={20} />
            <h3>Update Password</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="settings-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordFields.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswordFields(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswordFields.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordFields.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  placeholder="Enter new password (min. 6 characters)"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswordFields(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswordFields.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordFields.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswordFields(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswordFields.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button" disabled={saving}>
                <Save size={18} />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  )
}

export default Settings

