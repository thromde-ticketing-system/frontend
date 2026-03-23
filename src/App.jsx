import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import api from './services/api'

import Login from './pages/Login'
import PublicTracker from './pages/PublicTracker'
import CitizenDashboard from './pages/CitizenDashboard'
import SubmitTicket from './pages/SubmitTicket'
import MyTickets from './pages/MyTickets'
import TicketDetail from './pages/TicketDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminTickets from './pages/AdminTickets'
import AdminUsers from './pages/AdminUsers'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/track" element={<PublicTracker />} />

      <Route path="/dashboard" element={<PrivateRoute><CitizenDashboard /></PrivateRoute>} />
      <Route path="/submit-ticket" element={<PrivateRoute><SubmitTicket /></PrivateRoute>} />
      <Route path="/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />
      <Route path="/tickets/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />

      <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/tickets" element={<PrivateRoute adminOnly><AdminTickets /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // Pre-warm the Render backend the instant the app loads.
  // This starts waking the server from sleep before the user even clicks anything.
  useEffect(() => {
    api.get('/health-check').catch(() => {})
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
