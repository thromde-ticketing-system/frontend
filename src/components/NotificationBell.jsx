import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, ExternalLink, ArrowRight } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getEcho } from '../services/echo'

// ── Toast popup ────────────────────────────────────────────────────────────
function NotificationToast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{toast.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-blue-100 dark:bg-blue-900/30">
        <div className="h-full bg-blue-600 dark:bg-blue-400 animate-shrink-bar" />
      </div>
    </div>
  )
}

// ── Bell component ─────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const dropdownRef = useRef(null)
  const prevUnreadRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async (showToast = false) => {
    try {
      setLoading(true)
      const res = await api.get('/notifications')
      const notifs = res.data.notifications.data || []
      const count = res.data.unread_count || 0

      // If unread count increased while dropdown is closed → show toast
      if (
        showToast &&
        prevUnreadRef.current !== null &&
        count > prevUnreadRef.current &&
        !open
      ) {
        const newest = notifs[0]
        if (newest && !newest.is_read) {
          setToast({ title: newest.title, message: newest.message, ticket_id: newest.ticket_id })
        }
      }
      prevUnreadRef.current = count
      setNotifications(notifs)
      setUnreadCount(count)
    } catch {}
    finally { setLoading(false) }
  }

  // Initial fetch (no toast on first load)
  useEffect(() => {
    fetchNotifications(false)
  }, [])

  // Poll every 2s — shows toast when new notification detected
  useEffect(() => {
    const interval = setInterval(() => fetchNotifications(true), 2000)
    return () => clearInterval(interval)
  }, [open])

  // Real-time via Echo
  useEffect(() => {
    if (!user?.id) return
    const echo = getEcho()
    if (!echo) return
    const channel = echo.private(`user.${user.id}`)
    channel.listen('.notification.pushed', (e) => {
      if (e.notification) {
        setNotifications(prev => [e.notification, ...prev])
        setUnreadCount(prev => prev + 1)
        if (!open) {
          setToast({ title: e.notification.title, message: e.notification.message, ticket_id: e.notification.ticket_id })
        }
      }
    })
    return () => { echo.leave(`user.${user.id}`) }
  }, [user?.id, open])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    fetchNotifications(false)
  }

  const markRead = async (id, ticketId) => {
    await api.patch(`/notifications/${id}/read`)
    fetchNotifications(false)
    if (ticketId) { navigate(`/tickets/${ticketId}`); setOpen(false) }
  }

  const formatTime = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <NotificationToast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => { setOpen(!open); if (!open) fetchNotifications(false) }}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-700 dark:text-blue-400 hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={28} className="mx-auto text-slate-200 dark:text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id, n.ticket_id)}
                    className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                      )}
                      <div className={!n.is_read ? '' : 'ml-4'}>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatTime(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* See all link */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                See all notifications <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
