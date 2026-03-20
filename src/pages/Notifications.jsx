import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BellOff, Trash2, CheckCheck, ExternalLink,
  MessageSquare, AlertCircle, UserCheck, RefreshCw
} from 'lucide-react'
import Layout from '../components/Layout'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
]

function notifIcon(title = '') {
  const t = title.toLowerCase()
  if (t.includes('comment') || t.includes('reply') || t.includes('message')) return <MessageSquare size={16} className="text-blue-500" />
  if (t.includes('assign')) return <UserCheck size={16} className="text-emerald-500" />
  if (t.includes('status')) return <AlertCircle size={16} className="text-amber-500" />
  if (t.includes('ticket')) return <Bell size={16} className="text-purple-500" />
  return <Bell size={16} className="text-slate-400" />
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications', { params: { filter } })
      setNotifications(res.data.notifications.data || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch {}
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markRead = async (n) => {
    if (n.is_read) return
    setActionLoading(`read-${n.id}`)
    try {
      await api.patch(`/notifications/${n.id}/read`)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
    finally { setActionLoading(null) }
  }

  const toggleRead = async (n) => {
    setActionLoading(`toggle-${n.id}`)
    try {
      if (n.is_read) {
        await api.patch(`/notifications/${n.id}/unread`)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: false } : x))
        setUnreadCount(c => c + 1)
      } else {
        await api.patch(`/notifications/${n.id}/read`)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
        setUnreadCount(c => Math.max(0, c - 1))
      }
    } catch {}
    finally { setActionLoading(null) }
  }

  const deleteOne = async (id) => {
    setActionLoading(`del-${id}`)
    try {
      await api.delete(`/notifications/${id}`)
      const deleted = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.is_read) setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
    finally { setActionLoading(null) }
  }

  const markAllRead = async () => {
    setActionLoading('mark-all')
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
    finally { setActionLoading(null) }
  }

  const clearRead = async () => {
    setActionLoading('clear-read')
    try {
      await api.delete('/notifications/clear-read')
      setNotifications(prev => prev.filter(n => !n.is_read))
    } catch {}
    finally { setActionLoading(null) }
  }

  const handleClick = async (n) => {
    await markRead(n)
    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`)
  }

  const readCount = notifications.filter(n => n.is_read).length

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell size={22} />
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage all your alerts and updates</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchNotifications}
              className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={actionLoading === 'mark-all'}
                className="btn-secondary text-sm py-1.5 flex items-center gap-1.5 disabled:opacity-60"
              >
                <CheckCheck size={14} />Mark all read
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={actionLoading === 'clear-read'}
                className="text-sm py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold flex items-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                <Trash2 size={14} />Clear read ({readCount})
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw size={24} className="mx-auto mb-2 animate-spin opacity-50" />
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <BellOff size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {filter === 'unread' ? 'All caught up!' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                {filter === 'unread' ? 'You have no unread notifications.' : 'Notifications will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    !n.is_read ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    !n.is_read
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {notifIcon(n.title)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(n)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                        {!n.is_read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full align-middle" />}
                      </p>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    {n.ticket && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                        <ExternalLink size={10} />
                        {n.ticket.ticket_number} — {n.ticket.title}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => toggleRead(n)}
                      disabled={actionLoading === `toggle-${n.id}`}
                      title={n.is_read ? 'Mark unread' : 'Mark read'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                    >
                      {n.is_read ? <BellOff size={14} /> : <CheckCheck size={14} />}
                    </button>
                    <button
                      onClick={() => deleteOne(n.id)}
                      disabled={actionLoading === `del-${n.id}`}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmClear}
        icon={<Trash2 size={22} />}
        title="Clear Read Notifications"
        message={`Remove all ${readCount} read notification${readCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Yes, Clear All"
        variant="danger"
        onConfirm={() => { setConfirmClear(false); clearRead() }}
        onCancel={() => setConfirmClear(false)}
      />
    </Layout>
  )
}
