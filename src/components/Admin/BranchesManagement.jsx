import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Store, Key, User } from 'lucide-react'
import { branchesAPI, branchUsersAPI } from '../../services/api'
import BranchForm from './BranchForm'
import BranchUserForm from './BranchUserForm'
import './BranchesManagement.css'

const BranchesManagement = () => {
  const [branches, setBranches] = useState([])
  const [branchUsers, setBranchUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [editingBranchUser, setEditingBranchUser] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [branchesData, usersData] = await Promise.all([
        branchesAPI.getAll(),
        branchUsersAPI.getAll().catch(() => []) // If it fails, just use empty array
      ])
      setBranches(branchesData)
      setBranchUsers(usersData || [])
    } catch (err) {
      setError('Failed to load branches: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateBranch = useCallback(() => {
    setEditingBranch(null)
    setShowBranchForm(true)
  }, [])

  const handleEditBranch = useCallback((branch) => {
    setEditingBranch(branch)
    setShowBranchForm(true)
  }, [])

  const handleDeleteBranch = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? This will also delete the branch login credentials and all associated products.')) {
      return
    }

    try {
      await branchesAPI.delete(id)
      setBranches(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      alert('Failed to delete branch: ' + err.message)
    }
  }, [])

  const handleBranchFormClose = useCallback(() => {
    setShowBranchForm(false)
    setEditingBranch(null)
  }, [])

  const handleBranchFormSuccess = useCallback(async () => {
    await loadData()
    setTimeout(() => {
      handleBranchFormClose()
    }, 100)
  }, [loadData, handleBranchFormClose])

  const handleManageCredentials = useCallback((branch) => {
    // Find existing branch user for this branch
    const existingUser = branchUsers.find(u => u.branchId === branch.id)
    if (existingUser) {
      setEditingBranchUser(existingUser)
    } else {
      setEditingBranchUser(null)
    }
    setSelectedBranch(branch)
    setShowUserForm(true)
  }, [branchUsers])

  const handleDeleteCredentials = useCallback(async (branchUserId) => {
    if (!window.confirm('Are you sure you want to delete these login credentials? The branch user will no longer be able to log in.')) {
      return
    }

    try {
      await branchUsersAPI.delete(branchUserId)
      await loadData()
    } catch (err) {
      alert('Failed to delete credentials: ' + err.message)
    }
  }, [loadData])

  const handleUserFormClose = useCallback(() => {
    setShowUserForm(false)
    setEditingBranchUser(null)
    setSelectedBranch(null)
  }, [])

  const handleUserFormSuccess = useCallback(async () => {
    await loadData()
    setTimeout(() => {
      handleUserFormClose()
    }, 100)
  }, [loadData, handleUserFormClose])

  const getBranchUser = useCallback((branchId) => {
    return branchUsers.find(u => u.branchId === branchId)
  }, [branchUsers])


  if (loading) {
    return (
      <div className="loading">Loading...</div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <Store className="header-icon" size={24} />
        <div>
          <h2>Branches Management</h2>
          <p>Manage branches and branch logins</p>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-actions">
          <button onClick={handleCreateBranch} className="create-button">
            <Plus size={18} />
            Add New Branch
          </button>
          <div className="products-count">
            Total Branches: <strong>{branches.length}</strong>
          </div>
        </div>

        <div className="branches-table-container">
          <table className="branches-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Branch Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Login Credentials</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No branches found. Click "Add New Branch" to get started.
                  </td>
                </tr>
              ) : (
                branches.map(branch => {
                  const branchUser = getBranchUser(branch.id)
                  return (
                    <tr key={branch.id}>
                      <td>{branch.id}</td>
                      <td className="branch-name-cell">{branch.name}</td>
                      <td className="branch-address-cell">{branch.address}</td>
                      <td>{branch.phone}</td>
                      <td>
                        {branchUser ? (
                          <div className="credentials-cell">
                            <div className="credentials-info">
                              <User size={14} />
                              <span className="username-display">{branchUser.username}</span>
                            </div>
                            <button
                              onClick={() => handleManageCredentials(branch)}
                              className="manage-credentials-button"
                              title="Edit credentials"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCredentials(branchUser.id)}
                              className="delete-credentials-button"
                              title="Delete credentials"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleManageCredentials(branch)}
                            className="add-credentials-button"
                            title="Create login credentials"
                          >
                            <Key size={14} />
                            <span>Add Credentials</span>
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditBranch(branch)}
                            className="edit-button"
                            title="Edit Branch"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="delete-button"
                            title="Delete Branch"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showBranchForm && (
        <BranchForm
          branch={editingBranch}
          onClose={handleBranchFormClose}
          onSuccess={handleBranchFormSuccess}
        />
      )}

      {showUserForm && selectedBranch && (
        <BranchUserForm
          branchUser={editingBranchUser}
          branches={[selectedBranch]}
          onClose={handleUserFormClose}
          onSuccess={handleUserFormSuccess}
        />
      )}
    </div>
  )
}

export default BranchesManagement

