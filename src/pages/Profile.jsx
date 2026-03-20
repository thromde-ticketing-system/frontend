import React, { useState } from 'react'
import { User, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function Alert({ type, message }) {
  if (!message) return null
  const styles = type === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
  const Icon = type === 'success' ? CheckCircle : AlertCircle
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${styles}`}>
      <Icon size={16} className="flex-shrink-0" />
      {message}
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="input-field pr-10"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export default function Profile() {
  const { user, login } = useAuth()

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' })
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwStatus, setPwStatus] = useState({ type: '', message: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileStatus({ type: '', message: '' })
    setProfileLoading(true)
    try {
      const res = await api.put('/profile', profile)
      // Update stored user
      const updated = { ...user, ...res.data }
      localStorage.setItem('auth_user', JSON.stringify(updated))
      window.dispatchEvent(new Event('storage'))
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' })
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' })
    } finally { setProfileLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwErrors({})
    setPwStatus({ type: '', message: '' })
    setPwLoading(true)
    try {
      await api.put('/profile/password', passwords)
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      setPwStatus({ type: 'success', message: 'Password changed successfully.' })
    } catch (err) {
      if (err.response?.data?.errors) setPwErrors(err.response.data.errors)
      setPwStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password.' })
    } finally { setPwLoading(false) }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your account information and password</p>
        </div>

        {/* Avatar & Role */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-700 dark:bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-2xl font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize
              ${user?.role === 'admin'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="card mb-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-5">
            <User size={18} className="text-blue-700 dark:text-blue-400" />
            Personal Information
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input-field" placeholder="e.g. Tenzin Dorji"
                value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email} disabled />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" className="input-field" placeholder="e.g. +975-77123456"
                  value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Address</label>
                <input type="text" className="input-field" placeholder="e.g. Norzin Lam, Thimphu"
                  value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
              </div>
            </div>
            <Alert type={profileStatus.type} message={profileStatus.message} />
            <button type="submit" disabled={profileLoading} className="btn-primary disabled:opacity-60">
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-5">
            <Lock size={18} className="text-blue-700 dark:text-blue-400" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password *</label>
              <PasswordInput
                value={passwords.current_password}
                onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                placeholder="Enter your current password"
              />
              {pwErrors.current_password && <p className="text-red-500 text-xs mt-1">{pwErrors.current_password[0]}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">New Password *</label>
                <PasswordInput
                  value={passwords.password}
                  onChange={e => setPasswords({ ...passwords, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />
                {pwErrors.password && <p className="text-red-500 text-xs mt-1">{pwErrors.password[0]}</p>}
              </div>
              <div>
                <label className="label">Confirm New Password *</label>
                <PasswordInput
                  value={passwords.password_confirmation}
                  onChange={e => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <Alert type={pwStatus.type} message={pwStatus.message} />
            <button type="submit" disabled={pwLoading} className="btn-primary disabled:opacity-60">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
