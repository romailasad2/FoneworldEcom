import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { branchesAPI } from '../../services/api'
import './BranchForm.css'

const BranchForm = ({ branch, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || ''
      })
    }
  }, [branch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (branch) {
        await branchesAPI.update(branch.id, formData)
        setSuccess('Branch updated successfully!')
      } else {
        await branchesAPI.create(formData)
        setSuccess('Branch created successfully!')
      }
      
      // Clear form state
      setFormData({
        name: '',
        address: '',
        phone: '',
        username: '',
        password: ''
      })
      
      // Wait a moment to show success message, then close form
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      console.error('Error saving branch:', err)
      setError(err.message || 'Failed to save branch. Please check all fields and try again.')
      setLoading(false) // Don't close form on error
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{branch ? 'Edit Branch' : 'Add New Branch'}</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="form-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="form-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="branch-form">
          <div className="form-group">
            <label>Branch Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., FoneWorld Derby"
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows="3"
              placeholder="e.g., 123 High Street, Derby, DE1 1AA"
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="e.g., 01332 123456"
            />
          </div>

          {!branch && (
            <>
              <div className="form-divider">
                <h3>Branch Login Credentials</h3>
                <p>Create login credentials for this branch. The branch manager will use these to access their branch portal.</p>
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!branch}
                  placeholder="e.g., branch_derby"
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!branch}
                  placeholder="Enter password for branch login"
                />
              </div>
            </>
          )}

          {branch && (
            <div className="form-info">
              <p>ℹ️ Branch login credentials cannot be changed from here. To update credentials, please contact the administrator.</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : (branch ? 'Update Branch' : 'Create Branch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BranchForm

