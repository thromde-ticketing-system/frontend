import React, { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, Trash2, X, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
import Layout from '../components/Layout'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function PwInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className="input-field pr-10"
        placeholder={placeholder} value={value} onChange={onChange} required />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function AddUserModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '', address: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors({}); setLoading(true)
    try { await api.post('/admin/users', form); onAdded(); onClose() }
    catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Failed to create user.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} />{errors.general}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input type="text" className="input-field" placeholder="e.g. Tenzin Dorji"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input-field" placeholder="e.g. tenzin@thromde.bt"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Password *</label>
            <PwInput value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 8 characters" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input-field" placeholder="e.g. +975-77123456"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input type="text" className="input-field" placeholder="e.g. Norzin Lam, Thimphu"
            value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
            {loading ? 'Creating...' : 'Create User'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

function ChangePasswordModal({ user: target, onClose }) {
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors({}); setSuccess(''); setLoading(true)
    try {
      await api.patch(`/admin/users/${target.id}/password`, form)
      setSuccess('Password updated successfully.')
      setForm({ password: '', password_confirmation: '' })
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Failed to update password.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal title={`Change Password — ${target.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} />{errors.general}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
            {success}
          </div>
        )}
        <div>
          <label className="label">New Password *</label>
          <PwInput value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 8 characters" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
        </div>
        <div>
          <label className="label">Confirm New Password *</label>
          <PwInput value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} placeholder="Repeat new password" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [changePwUser, setChangePwUser] = useState(null)

  const fetchUsers = useCallback(async (s = search, r = roleFilter, p = page) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (s) params.search = s
      if (r) params.role = r
      const res = await api.get('/admin/users', { params })
      setUsers(res.data.data || [])
      setPagination({ total: res.data.total, current: res.data.current_page, last: res.data.last_page })
    } catch {}
    finally { setLoading(false) }
  }, [])

  // Live search — debounce 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers(search, roleFilter, 1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search, roleFilter])

  const handleDelete = async () => {
    try { await api.delete(`/admin/users/${deleteId}`); setDeleteId(null); fetchUsers(search, roleFilter, 1) }
    catch {}
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Users</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage all system users</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={18} />Add User
          </button>
        </div>

        {/* Live filters — no Search button */}
        <div className="card mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="label">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="input-field pl-9" placeholder="Type name or email..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {(search || roleFilter) && (
              <button onClick={() => { setSearch(''); setRoleFilter('') }} className="btn-secondary self-end">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No users found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left pb-3">Name</th>
                      <th className="text-left pb-3">Email</th>
                      <th className="text-left pb-3">Phone</th>
                      <th className="text-left pb-3">Role</th>
                      <th className="text-left pb-3">Joined</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-700 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{u.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{u.phone || '—'}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            u.role === 'admin'
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Change password — available for all users */}
                            <button
                              onClick={() => setChangePwUser(u)}
                              title="Change password"
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-lg transition-colors"
                            >
                              <KeyRound size={15} />
                            </button>
                            {/* Delete — only for non-admin users */}
                            {u.role !== 'admin' ? (
                              <button
                                onClick={() => setDeleteId(u.id)}
                                title="Delete user"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <span className="p-1.5 w-[30px] inline-block" title="Admin accounts cannot be deleted" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.last > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.current} of {pagination.last} ({pagination.total} total)</p>
                  <div className="flex gap-2">
                    <button disabled={pagination.current <= 1}
                      onClick={() => { const p = page - 1; setPage(p); fetchUsers(search, roleFilter, p) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40">Prev</button>
                    <button disabled={pagination.current >= pagination.last}
                      onClick={() => { const p = page + 1; setPage(p); fetchUsers(search, roleFilter, p) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        icon={<Trash2 size={22} />}
        title="Delete User"
        message="Are you sure you want to delete this user account? This action cannot be undone and all associated data will be removed."
        confirmLabel="Yes, Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onAdded={() => fetchUsers(search, roleFilter, 1)} />}
      {changePwUser && <ChangePasswordModal user={changePwUser} onClose={() => setChangePwUser(null)} />}
    </Layout>
  )
}
