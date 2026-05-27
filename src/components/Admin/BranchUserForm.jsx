import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { branchUsersAPI } from '../../services/api'
import './BranchUserForm.css'

const BranchUserForm = ({ branchUser, branches, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    branchId: '',
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (branchUser) {
      setFormData({
        branchId: branchUser.branchId || '',
        username: branchUser.username || '',
        password: '' // Don't pre-fill password
      })
    } else if (branches.length === 1) {
      // If only one branch is provided (from manage credentials), pre-select it
      setFormData({
        branchId: branches[0].id,
        username: '',
        password: ''
      })
    } else {
      // Reset form when no branch user and multiple branches
      setFormData({
        branchId: '',
        username: '',
        password: ''
      })
    }
  }, [branchUser, branches])

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
      const submitData = { ...formData }
      
      // If only one branch provided, ensure branchId is set
      if (branches.length === 1 && !submitData.branchId) {
        submitData.branchId = branches[0].id
      }
      
      // If editing and password is empty, don't send it
      if (branchUser && !submitData.password) {
        delete submitData.password
      }

      if (branchUser) {
        await branchUsersAPI.update(branchUser.id, submitData)
        setSuccess('Branch user updated successfully!')
      } else {
        // For new users, password is required
        if (!submitData.password) {
          throw new Error('Password is required for new users')
        }
        await branchUsersAPI.create(submitData)
        setSuccess('Branch user created successfully!')
      }
      
      // Clear form state
      setFormData({
        branchId: '',
        username: '',
        password: ''
      })
      
      // Wait a moment to show success message, then close form
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      console.error('Error saving branch user:', err)
      setError(err.message || 'Failed to save branch user. Please check all fields and try again.')
      setLoading(false) // Don't close form on error
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{branchUser ? 'Edit Branch User' : 'Add New Branch User'}</h2>
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

        <form onSubmit={handleSubmit} className="branch-user-form">
          <div className="form-group">
            <label>Branch *</label>
            {branches.length === 1 ? (
              <>
                <input
                  type="text"
                  value={branches[0].name}
                  disabled
                  className="disabled-input"
                />
                <input
                  type="hidden"
                  name="branchId"
                  value={branches[0].id}
                />
              </>
            ) : (
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                required
                disabled={!!branchUser}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            )}
            {(branchUser || branches.length === 1) && (
              <p className="form-hint">
                {branchUser ? 'Branch cannot be changed for existing users' : 'Branch is locked to the selected branch'}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="e.g., branch_manager_derby"
            />
          </div>

          <div className="form-group">
            <label>Password {branchUser ? '(leave empty to keep current)' : '*'}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!branchUser}
              placeholder="Enter password"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : (branchUser ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BranchUserForm

