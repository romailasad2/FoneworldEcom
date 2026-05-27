import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import ProductListing from './components/ProductListing'
import Login from './components/Admin/Login'
import Dashboard from './components/Admin/Dashboard'
import ProtectedRoute from './components/Admin/ProtectedRoute'
import BranchLogin from './components/Branch/BranchLogin'
import BranchDashboard from './components/Branch/BranchDashboard'
import BranchProtectedRoute from './components/Branch/BranchProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <div className="app">
            <Header />
            <main className="main-content">
              <ProductListing />
            </main>
          </div>
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Branch Routes */}
        <Route path="/branch/login" element={<BranchLogin />} />
        <Route path="/branch/dashboard" element={
          <BranchProtectedRoute>
            <BranchDashboard />
          </BranchProtectedRoute>
        } />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

