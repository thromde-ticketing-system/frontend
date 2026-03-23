import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Lock, Clock, User, MessageSquare,
  Pencil, Trash2, Check, X, CheckCircle, RotateCcw, TrendingUp, AlertTriangle,
  Paperclip, FileText, Image as ImageIcon, Download, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getEcho } from '../services/echo'

// ── Confirm configs ────────────────────────────────────────────────────────
const CONFIRM = {
  delete_comment: {
    icon: <Trash2 size={22} />,
    title: 'Delete Message',
    message: 'This message will be permanently removed. The other party will see "Message removed" in its place.',
    confirmLabel: 'Yes, Delete',
    variant: 'danger',
  },
  resolve: {
    icon: <CheckCircle size={22} />,
    title: 'Resolve Ticket',
    message: 'Mark this ticket as Resolved? The submitter will be notified.',
    confirmLabel: 'Yes, Resolve',
    variant: 'success',
  },
  reopen: {
    icon: <RotateCcw size={22} />,
    title: 'Reopen Ticket',
    message: 'Set this ticket back to In Progress? The submitter will be notified.',
    confirmLabel: 'Yes, Reopen',
    variant: 'warning',
  },
  close: {
    icon: <CheckCircle size={22} />,
    title: 'Mark as Resolved',
    message: 'Are you sure you want to close this ticket and mark it as Resolved?',
    confirmLabel: 'Yes, Resolve',
    variant: 'success',
  },
  reopen_staff: {
    icon: <RotateCcw size={22} />,
    title: 'Reopen Ticket',
    message: 'Reopen this ticket? It will be set back to Pending and the admin will be notified.',
    confirmLabel: 'Yes, Reopen',
    variant: 'warning',
  },
  delete_ticket: {
    icon: <AlertTriangle size={22} />,
    title: 'Delete Ticket',
    message: 'This will permanently delete this ticket along with all comments and history. This action cannot be undone.',
    confirmLabel: 'Yes, Delete Permanently',
    variant: 'danger',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

function extBadge(ext) {
  if (ext === 'pdf')               return 'bg-red-100  text-red-600  dark:bg-red-900/40  dark:text-red-400'
  if (ext === 'doc' || ext === 'docx') return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
  return 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300'
}

function fileIconColor(ext, isMine) {
  if (isMine) return 'bg-white/20 text-white'
  return extBadge(ext)
}

// Shorten very long filenames for display: keep base name ≤ 18 chars + ext
function shortName(name) {
  if (!name) return ''
  const dot = name.lastIndexOf('.')
  const base = dot > -1 ? name.slice(0, dot) : name
  const ext  = dot > -1 ? name.slice(dot)   : ''
  return base.length > 20 ? base.slice(0, 18) + '…' + ext : name
}

// ── Chat bubble attachment ───────────────────────────────────────────────────
function AttachmentPreview({ url, name, isMine }) {
  const ext     = name?.split('.').pop()?.toLowerCase()
  const isImage = IMAGE_EXTS.includes(ext)

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block group rounded-xl overflow-hidden m-1.5 border border-black/10 dark:border-white/10">
        <img src={url} alt={name} className="block w-[240px] max-h-[180px] object-cover" />
        <div className={`flex items-center justify-between px-2.5 py-1.5 gap-2 ${
          isMine ? 'bg-blue-700/60' : 'bg-slate-100 dark:bg-slate-700'
        }`}>
          <span className={`text-[11px] truncate flex-1 ${isMine ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}
            title={name}>
            {shortName(name)}
          </span>
          <ExternalLink size={11} className={`flex-shrink-0 ${isMine ? 'text-blue-200' : 'text-slate-400'}`} />
        </div>
      </a>
    )
  }

  return (
    <a
      href={url}
      download={name}
      target="_blank"
      rel="noreferrer"
      title={name}
      className={`flex items-center gap-3 mx-1.5 my-2 px-3 py-2.5 rounded-xl w-[230px] transition-opacity hover:opacity-80 ${
        isMine
          ? 'bg-white/15 border border-white/20'
          : 'bg-slate-50 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${fileIconColor(ext, isMine)}`}>
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight truncate ${isMine ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
          {shortName(name)}
        </p>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block ${
          isMine ? 'bg-white/20 text-white' : extBadge(ext)
        }`}>
          {ext}
        </span>
      </div>
      <Download size={15} className={`flex-shrink-0 ${isMine ? 'text-white/60' : 'text-slate-400'}`} />
    </a>
  )
}

// ── Single message bubble ──────────────────────────────────────────────────
function MessageBubble({ c, isMine, isAdmin, onEdit, onDeleteRequest }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.comment || '')
  const editRef = useRef(null)

  const isDeleted = !!c.deleted_at
  const wasEdited = !isDeleted && c.updated_at && c.created_at && c.updated_at !== c.created_at
  const canEdit = isMine && !isDeleted
  const canDelete = (isMine || isAdmin) && !isDeleted

  const saveEdit = async () => {
    if (!editText.trim() || editText === c.comment) { setEditing(false); return }
    await onEdit(c.id, editText)
    setEditing(false)
  }
  const cancelEdit = () => { setEditText(c.comment); setEditing(false) }
  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
    if (e.key === 'Escape') cancelEdit()
  }
  useEffect(() => { if (editing) editRef.current?.focus() }, [editing])

  if (isDeleted) {
    return (
      <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && <div className="w-7 h-7 flex-shrink-0" />}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className="px-3.5 py-2 rounded-2xl text-xs italic text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 bg-transparent">
            🚫 Message removed
          </div>
          <span className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5 px-1">
            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mb-5 ${
          c.is_internal ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-slate-200 dark:bg-slate-600'
        }`}>
          <span className={`text-xs font-bold ${c.is_internal ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-200'}`}>
            {c.user?.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[72%]`}>
        {!isMine && (
          <div className="flex items-center gap-1 mb-1 px-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{c.user?.name}</span>
            {c.is_internal && (
              <span className="flex items-center gap-0.5 text-[10px] text-purple-500">
                <Lock size={9} />Internal
              </span>
            )}
          </div>
        )}

        {editing ? (
          <div className="w-full min-w-[220px]">
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKey}
              rows={2}
              className="w-full text-sm rounded-xl px-3 py-2 border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-1.5 mt-1.5 justify-end">
              <button onClick={saveEdit} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Check size={11} />Save
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg">
                <X size={11} />Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
            isMine
              ? 'bg-blue-600 text-white rounded-br-sm'
              : c.is_internal
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-700 rounded-bl-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'
          }`}>
            {c.comment && (
              <p className="px-3.5 py-2.5 whitespace-pre-wrap break-words">{c.comment}</p>
            )}
            {c.attachment_url && (
              <AttachmentPreview
                url={c.attachment_url}
                name={c.attachment_name}
                isMine={isMine}
              />
            )}
          </div>
        )}

        {!editing && (
          <div className={`flex items-center gap-2 mt-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {wasEdited && <span className="text-[10px] text-slate-400 dark:text-slate-500">· edited</span>}
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-0.5">
                {canEdit && (
                  <button onClick={() => setEditing(true)} title="Edit"
                    className="p-0.5 rounded text-slate-400 hover:text-blue-500 transition-colors">
                    <Pencil size={11} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDeleteRequest(c.id)} title="Delete"
                    className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasText, setHasText] = useState(false)
  const [inputKey, setInputKey] = useState(0)
  const [confirmModal, setConfirmModal] = useState(null) // { action, commentId? }
  const [actionLoading, setActionLoading] = useState(false)
  const [autoProgressBanner, setAutoProgressBanner] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [imgCollapsed, setImgCollapsed] = useState(false)

  const [attachFile, setAttachFile] = useState(null)
  const [chatError, setChatError] = useState('')

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const autoProgressRef = useRef(false)

  // Reset auto-progress flag when navigating to a different ticket
  useEffect(() => {
    autoProgressRef.current = false
    setAutoProgressBanner(false)
  }, [id])

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchTicket = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try { const res = await api.get(`/tickets/${id}`); setTicket(res.data) }
    catch {} finally { if (showLoading) setLoading(false) }
  }, [id])

  const fetchComments = useCallback(async () => {
    try { const res = await api.get(`/tickets/${id}/comments`); setComments(res.data) }
    catch {}
  }, [id])

  useEffect(() => { fetchTicket(true); fetchComments() }, [id])

  // Auto-set In Progress when admin views a Pending ticket
  useEffect(() => {
    if (!ticket || !isAdmin || autoProgressRef.current) return
    if (ticket.status === 'Pending') {
      autoProgressRef.current = true
      api.patch(`/admin/tickets/${ticket.id}/status`, { status: 'In Progress' })
        .then(() => {
          fetchTicket()
          setAutoProgressBanner(true)
          setTimeout(() => setAutoProgressBanner(false), 5000)
        })
        .catch(() => { autoProgressRef.current = false })
    }
  }, [ticket?.id, isAdmin, fetchTicket])

  // 4-second poll
  useEffect(() => {
    const t = setInterval(fetchComments, 4000)
    return () => clearInterval(t)
  }, [fetchComments])

  // Real-time via Echo
  useEffect(() => {
    if (!id) return
    const echo = getEcho()
    if (!echo) return
    const ch = echo.private(`ticket.${id}`)
    ch.listen('.comment.added', (e) => {
      if (e.comment) setComments(prev => prev.some(c => c.id === e.comment.id) ? prev : [...prev, e.comment])
    })
    return () => echo.leave(`ticket.${id}`)
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments.length])

  useEffect(() => {
    if (inputKey > 0) textareaRef.current?.focus()
  }, [inputKey])

  // ── Send ───────────────────────────────────────────────────────────────
  const submitComment = async () => {
    const text = textareaRef.current?.value?.trim()
    if ((!text && !attachFile) || submitting) return
    setChatError('')
    setSubmitting(true)
    setInputKey(k => k + 1)
    setHasText(false)
    const fileToSend = attachFile
    setAttachFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    try {
      let res
      if (fileToSend) {
        const body = new FormData()
        if (text) body.append('comment', text)
        body.append('attachment', fileToSend)
        body.append('is_internal', isInternal ? '1' : '0')
        res = await api.post(`/tickets/${id}/comments`, body)
      } else {
        res = await api.post(`/tickets/${id}/comments`, { comment: text, is_internal: isInternal })
      }
      setComments(prev => prev.some(c => c.id === res.data.id) ? prev : [...prev, res.data])
      setIsInternal(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send message. Please try again.'
      setChatError(msg)
    }
    finally { setSubmitting(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB.'); return }
    setAttachFile(file)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() }
  }

  // ── Edit / Delete ──────────────────────────────────────────────────────
  const handleEdit = async (commentId, newText) => {
    try {
      const res = await api.patch(`/tickets/${id}/comments/${commentId}`, { comment: newText })
      setComments(prev => prev.map(c => c.id === commentId ? res.data : c))
    } catch {}
  }

  // Opens the confirm dialog instead of window.confirm
  const handleDeleteRequest = (commentId) => {
    setConfirmModal({ action: 'delete_comment', commentId })
  }

  // ── Ticket actions ─────────────────────────────────────────────────────
  const onConfirmed = async () => {
    if (!confirmModal) return
    const { action, commentId } = confirmModal
    setConfirmModal(null)
    setActionLoading(true)
    try {
      if (action === 'delete_comment') {
        await api.delete(`/tickets/${id}/comments/${commentId}`)
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, deleted_at: new Date().toISOString() } : c
        ))
      } else if (action === 'resolve') {
        setTicket(prev => ({ ...prev, status: 'Resolved' }))
        await api.patch(`/admin/tickets/${id}/status`, { status: 'Resolved' })
        fetchTicket()
      } else if (action === 'reopen') {
        setTicket(prev => ({ ...prev, status: 'In Progress' }))
        await api.patch(`/admin/tickets/${id}/status`, { status: 'In Progress' })
        fetchTicket()
      } else if (action === 'close') {
        setTicket(prev => ({ ...prev, status: 'Resolved' }))
        await api.patch(`/tickets/${id}/close`)
        fetchTicket()
      } else if (action === 'reopen_staff') {
        setTicket(prev => ({ ...prev, status: 'Pending' }))
        await api.patch(`/tickets/${id}/reopen`)
        fetchTicket()
      } else if (action === 'delete_ticket') {
        await api.delete(`/admin/tickets/${id}`)
        navigate('/admin/tickets')
      }
    } catch {}
    finally { setActionLoading(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return <Layout><div className="text-center py-16 text-slate-400">Loading...</div></Layout>
  if (!ticket)  return <Layout><div className="text-center py-16 text-slate-500">Ticket not found.</div></Layout>

  const backPath   = isAdmin ? '/admin/tickets' : '/my-tickets'
  const isOwner    = ticket.user_id === user?.id
  const isAssigned = ticket.assigned_to?.id === user?.id

  // Only admin and the assigned person can resolve
  const canResolve = isAdmin || isAssigned
  // Admin, ticket owner, and assigned person can reopen
  const canReopen  = isAdmin || isOwner || isAssigned

  const isResolved = ticket.status === 'Resolved'

  const showResolveBtn = canResolve && ['Pending', 'In Progress'].includes(ticket.status)
  const showReopenBtn  = canReopen  && ['Resolved', 'Rejected'].includes(ticket.status)

  const grouped = comments.reduce((acc, c, i) => {
    const prev = comments[i - 1]
    const sameUser = prev && prev.user_id === c.user_id &&
      new Date(c.created_at) - new Date(prev.created_at) < 5 * 60 * 1000
    acc.push({ ...c, groupFirst: !sameUser })
    return acc
  }, [])

  const cfg = confirmModal ? CONFIRM[confirmModal.action] : null

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Auto In-Progress banner */}
        {autoProgressBanner && (
          <div className="mb-4 flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
            <TrendingUp size={15} className="flex-shrink-0" />
            <span>Ticket automatically set to <strong>In Progress</strong> as you opened it.</span>
            <button onClick={() => setAutoProgressBanner(false)} className="ml-auto text-indigo-400 hover:text-indigo-600 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Ticket header */}
        <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link to={backPath} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1 flex-shrink-0">
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-mono font-semibold mb-1">{ticket.ticket_number}</p>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setConfirmModal({ action: 'delete_ticket' })}
              disabled={actionLoading}
              title="Delete ticket"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold transition-colors disabled:opacity-60 flex-shrink-0 mt-0.5"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Description</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Attachment card — separate from description */}
            {ticket.attachment_url && (() => {
              const ext   = ticket.attachment_name?.split('.').pop()?.toLowerCase()
              const isImg = IMAGE_EXTS.includes(ext)
              return (
                <div className="card p-0 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <Paperclip size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">Attachment</span>
                    {isImg && (
                      <button
                        onClick={() => setImgCollapsed(c => !c)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={imgCollapsed ? 'Expand image' : 'Minimize image'}
                      >
                        {imgCollapsed
                          ? <><ChevronDown size={14} /> Show</>
                          : <><ChevronUp size={14} /> Minimize</>
                        }
                      </button>
                    )}
                  </div>

                  {isImg ? (
                    <>
                      {/* Image viewer — collapsible */}
                      {!imgCollapsed && (
                        <a href={ticket.attachment_url} target="_blank" rel="noreferrer" className="block bg-slate-50 dark:bg-slate-900/30">
                          <img
                            src={ticket.attachment_url}
                            alt={ticket.attachment_name}
                            className="block w-full max-h-[400px] object-contain"
                          />
                        </a>
                      )}
                      {/* Caption bar — always visible */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate" title={ticket.attachment_name}>
                            {shortName(ticket.attachment_name)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <a href={ticket.attachment_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
                            <ExternalLink size={13} /> Open
                          </a>
                          <a href={ticket.attachment_url} download={ticket.attachment_name} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            <Download size={13} /> Download
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* File row */
                    <div className="flex items-center gap-4 px-4 py-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${fileIconColor(ext, false)}`}>
                        <FileText size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={ticket.attachment_name}>
                          {shortName(ticket.attachment_name)}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block ${extBadge(ext)}`}>
                          {ext}
                        </span>
                      </div>
                      <a
                        href={ticket.attachment_url}
                        download={ticket.attachment_name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
                      >
                        <Download size={13} /> Download
                      </a>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Messenger */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col" style={{ height: '520px' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Messages <span className="text-slate-400 font-normal">({comments.filter(c => !c.deleted_at).length})</span>
                  </span>
                </div>
                {isAdmin && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded w-3.5 h-3.5" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Lock size={11} />Internal note
                    </span>
                  </label>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                {comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <MessageSquare size={34} className="mb-2 opacity-25" />
                    <p className="text-sm">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {grouped.map(c => (
                      <div key={c.id} className={c.groupFirst ? 'pt-3 first:pt-0' : 'pt-0.5'}>
                        <MessageBubble
                          c={c}
                          isMine={c.user_id === user?.id}
                          isAdmin={isAdmin}
                          onEdit={handleEdit}
                          onDeleteRequest={handleDeleteRequest}
                        />
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {isResolved ? (
                /* Locked state — ticket is resolved */
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/10">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle size={16} />
                      <span>This ticket is resolved — messaging is locked.</span>
                    </div>
                    {canReopen && (
                      <button
                        onClick={() => setConfirmModal({ action: isAdmin ? 'reopen' : 'reopen_staff' })}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 mt-0.5"
                      >
                        <RotateCcw size={11} /> Reopen ticket to continue
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Normal input bar */
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                  {/* Selected file preview */}
                  {attachFile && (() => {
                    const ext   = attachFile.name?.split('.').pop()?.toLowerCase()
                    const isImg = IMAGE_EXTS.includes(ext)
                    return (
                      <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${fileIconColor(ext, false)}`}>
                          {isImg ? <ImageIcon size={15} /> : <FileText size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={attachFile.name}>
                            {shortName(attachFile.name)}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                            {ext} · {(attachFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => { setAttachFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })()}
                  <div className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file or image"
                      className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0 mb-0.5"
                    >
                      <Paperclip size={16} />
                    </button>
                    <textarea
                      key={inputKey}
                      ref={textareaRef}
                      rows={1}
                      className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 border-0 leading-relaxed overflow-hidden"
                      style={{ height: '40px', maxHeight: '120px' }}
                      placeholder={isInternal ? 'Write an internal note...' : 'Type a message...'}
                      onChange={e => {
                        setHasText(e.target.value.trim().length > 0)
                        e.target.style.height = '40px'
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      onClick={submitComment}
                      disabled={submitting || (!hasText && !attachFile)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 mb-0.5"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                  {chatError && (
                    <p className="text-[11px] text-red-500 mt-1 pl-1">{chatError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">Enter to send · Shift+Enter for new line</p>
                </div>
              )}
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-5">
            {/* ── Quick Actions ── */}
            {(showResolveBtn || showReopenBtn) && (
              <div className="card space-y-2.5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h2>

                {showResolveBtn && (
                  <button
                    onClick={() => setConfirmModal({ action: isAdmin ? 'resolve' : 'close' })}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    <CheckCircle size={16} /> Mark as Resolved
                  </button>
                )}

                {showReopenBtn && (
                  <button
                    onClick={() => setConfirmModal({ action: isAdmin ? 'reopen' : 'reopen_staff' })}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    <RotateCcw size={16} /> Reopen Ticket
                  </button>
                )}
              </div>
            )}

            {/* ── Details ── */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Submitted by', value: <span className="flex items-center gap-1"><User size={13}/>{ticket.user?.name}</span> },
                  { label: 'Assigned to', value: ticket.assigned_to?.name || 'Unassigned' },
                  { label: 'Created', value: new Date(ticket.created_at).toLocaleString() },
                  { label: 'Last updated', value: new Date(ticket.updated_at).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mb-0.5">{label}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Status History ── */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Clock size={15} />Status History
                {ticket.history?.length > 0 && (
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({ticket.history.length})</span>
                )}
              </h2>
              {ticket.history?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(historyExpanded ? ticket.history : ticket.history.slice(0, 3)).map((h, i, arr) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0 mt-0.5" />
                          {i < arr.length - 1 && <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {h.old_status ? `${h.old_status} → ${h.new_status}` : `Created as ${h.new_status}`}
                          </p>
                          {h.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{h.note}</p>}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {h.changed_by?.name} · {new Date(h.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {ticket.history.length > 3 && (
                    <button
                      onClick={() => setHistoryExpanded(e => !e)}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {historyExpanded ? 'Show less' : `Show all ${ticket.history.length} entries`}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">No history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional confirm dialog */}
      {cfg && (
        <ConfirmDialog
          open={!!confirmModal}
          icon={cfg.icon}
          title={cfg.title}
          message={cfg.message}
          confirmLabel={cfg.confirmLabel}
          variant={cfg.variant}
          onConfirm={onConfirmed}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </Layout>
  )
}
