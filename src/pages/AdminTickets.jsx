import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ChevronUp, ChevronDown, ArrowUpDown, Download, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Rejected', label: 'Rejected' },
]

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function UpdateStatusModal({ ticket, onClose, onUpdated }) {
  const [status, setStatus] = useState(ticket.status)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await api.patch(`/admin/tickets/${ticket.id}/status`, { status, note }); onUpdated(); onClose() }
    catch {} finally { setLoading(false) }
  }
  return (
    <Modal title="Update Ticket Status" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Ticket: <span className="font-mono text-blue-700 dark:text-blue-400">{ticket.ticket_number}</span></p>
        <div>
          <label className="label">New Status</label>
          <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
            <option>Pending</option><option>In Progress</option><option>Resolved</option><option>Rejected</option>
          </select>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <textarea className="input-field" rows={3} placeholder="e.g. We are looking into this..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">{loading ? 'Updating...' : 'Update Status'}</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

function AssignModal({ ticket, staff, onClose, onUpdated }) {
  const [assignTo, setAssignTo] = useState(ticket.assigned_to?.id || ticket.assigned_to || '')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await api.patch(`/admin/tickets/${ticket.id}/assign`, { assigned_to: assignTo }); onUpdated(); onClose() }
    catch {} finally { setLoading(false) }
  }
  return (
    <Modal title="Assign Ticket" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Ticket: <span className="font-mono text-blue-700 dark:text-blue-400">{ticket.ticket_number}</span></p>
        <div>
          <label className="label">Assign to</label>
          <select className="input-field" value={assignTo} onChange={e => setAssignTo(e.target.value)} required>
            <option value="">Select staff member</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !assignTo} className="btn-primary flex-1 disabled:opacity-60">{loading ? 'Assigning...' : 'Assign'}</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Pending')
  const [priority, setPriority] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [statusModal, setStatusModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [staff, setStaff] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [bulkAction, setBulkAction] = useState('status')
  const [bulkValue, setBulkValue] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // ticket object

  const fetchTickets = useCallback(async (
    s = search, st = status, pr = priority, df = dateFrom, dt = dateTo,
    p = page, sb = sortBy, sd = sortDir, at = assignedTo
  ) => {
    const cacheKey = `admin_tickets_${st}_${p}`
    // Show cached data instantly so page never looks empty
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { data, pagination: pg } = JSON.parse(cached)
        setTickets(data)
        setPagination(pg)
        setLoading(false)
      } catch {}
    } else {
      setLoading(true)
    }
    try {
      const params = { page: p, sort_by: sb, sort_dir: sd }
      if (s) params.search = s
      if (st) params.status = st
      if (pr) params.priority = pr
      if (df) params.date_from = df
      if (dt) params.date_to = dt
      if (at) params.assigned_to = at
      const res = await api.get('/admin/tickets', { params })
      const data = res.data.data || []
      const pg = { total: res.data.total, current: res.data.current_page, last: res.data.last_page }
      setTickets(data)
      setPagination(pg)
      // Only cache simple queries (no search/date filters) for reuse
      if (!s && !df && !dt && !at) {
        localStorage.setItem(cacheKey, JSON.stringify({ data, pagination: pg }))
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    api.get('/admin/staff').then(res => setStaff(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSelected(new Set())
      fetchTickets(search, status, priority, dateFrom, dateTo, 1, sortBy, sortDir, assignedTo)
    }, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [search, status, priority, dateFrom, dateTo, sortBy, sortDir, assignedTo])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === tickets.length) setSelected(new Set())
    else setSelected(new Set(tickets.map(t => t.id)))
  }

  const handleBulkAction = async () => {
    if (!bulkValue || selected.size === 0) return
    setBulkLoading(true)
    try {
      await api.post('/admin/tickets/bulk-action', {
        ids: [...selected],
        action: bulkAction,
        value: bulkValue,
      })
      setSelected(new Set())
      setBulkValue('')
      fetchTickets()
    } catch {} finally { setBulkLoading(false) }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleteConfirm(false)
    setBulkLoading(true)
    try {
      await Promise.all([...selected].map(id => api.delete(`/admin/tickets/${id}`)))
      setSelected(new Set())
      fetchTickets()
    } catch {} finally { setBulkLoading(false) }
  }

  const exportCSV = async () => {
    setExporting(true)
    try {
      const params = { per_page: 500, sort_by: sortBy, sort_dir: sortDir }
      if (search) params.search = search
      if (status) params.status = status
      if (priority) params.priority = priority
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (assignedTo) params.assigned_to = assignedTo
      const res = await api.get('/admin/tickets', { params })
      const rows = res.data.data || []
      const headers = ['Ticket #', 'Title', 'Submitted By', 'Priority', 'Status', 'Assigned To', 'Date']
      const lines = rows.map(t => [
        t.ticket_number,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.user?.name || '',
        t.priority,
        t.status,
        t.assigned_to?.name || 'Unassigned',
        new Date(t.created_at).toLocaleDateString(),
      ].join(','))
      const csv = [headers.join(','), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExporting(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const ticket = deleteConfirm
    setDeleteConfirm(null)
    try {
      await api.delete(`/admin/tickets/${ticket.id}`)
      fetchTickets()
    } catch {}
  }

  const clearFilters = () => {
    setSearch(''); setPriority(''); setDateFrom(''); setDateTo(''); setAssignedTo(''); setPage(1)
  }

  const SortTh = ({ col, label }) => (
    <th
      className="text-left pb-3 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === col
          ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          : <ArrowUpDown size={11} className="opacity-30" />}
      </span>
    </th>
  )

  const allSelected = tickets.length > 0 && selected.size === tickets.length

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Tickets</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage all staff service requests</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="label">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="input-field pl-9" placeholder="Type ticket #, title..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">All</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Assigned To</label>
              <select className="input-field" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">Anyone</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(search || priority || dateFrom || dateTo || assignedTo) && (
              <button onClick={clearFilters} className="btn-secondary self-end">Clear</button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-3 px-4 py-2.5 rounded-xl flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {selected.size} selected
            </span>
            <select
              value={bulkAction}
              onChange={e => { setBulkAction(e.target.value); setBulkValue('') }}
              className="input-field text-sm py-1.5 w-auto"
            >
              <option value="status">Change Status</option>
              <option value="priority">Change Priority</option>
              <option value="assigned_to">Assign To</option>
            </select>
            {bulkAction === 'status' && (
              <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="input-field text-sm py-1.5 w-auto">
                <option value="">Select status...</option>
                <option>Pending</option><option>In Progress</option><option>Resolved</option><option>Rejected</option>
              </select>
            )}
            {bulkAction === 'priority' && (
              <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="input-field text-sm py-1.5 w-auto">
                <option value="">Select priority...</option>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            )}
            {bulkAction === 'assigned_to' && (
              <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="input-field text-sm py-1.5 w-auto">
                <option value="">Select staff...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            )}
            <button
              onClick={handleBulkAction}
              disabled={!bulkValue || bulkLoading}
              className="btn-primary text-sm py-1.5 disabled:opacity-50"
            >
              {bulkLoading ? 'Applying...' : 'Apply'}
            </button>

            {/* Separator */}
            <span className="text-slate-300 dark:text-slate-600 select-none">|</span>

            {/* Bulk delete — separate from other actions */}
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete selected
            </button>

            <button onClick={() => setSelected(new Set())} className="btn-secondary text-sm py-1.5 ml-auto">
              Deselect all
            </button>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-3 w-8">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                      </th>
                      <th className="text-left pb-3">Ticket #</th>
                      <SortTh col="title" label="Title" />
                      <th className="text-left pb-3">Submitted By</th>
                      <SortTh col="priority" label="Priority" />
                      <SortTh col="status" label="Status" />
                      <th className="text-left pb-3">Assigned</th>
                      <SortTh col="created_at" label="Date" />
                      <th className="pb-3 text-center">Actions</th>
                      <th className="pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr
                        key={ticket.id}
                        className={`group border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          selected.has(ticket.id) ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(ticket.id)}
                            onChange={() => toggleSelect(ticket.id)}
                            className="rounded border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 text-sm font-mono text-blue-700 dark:text-blue-400 font-semibold">{ticket.ticket_number}</td>
                        <td className="py-3 text-sm text-slate-800 dark:text-slate-200 max-w-[160px] truncate">{ticket.title}</td>
                        <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{ticket.user?.name}</td>
                        <td className="py-3"><PriorityBadge priority={ticket.priority} /></td>
                        <td className="py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{ticket.assigned_to?.name || '—'}</td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Link to={`/tickets/${ticket.id}`} className="text-xs accent-link">View</Link>
                            {['Resolved', 'Rejected'].includes(ticket.status) ? (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button onClick={() => setDeleteConfirm(ticket)} className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Delete</button>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button onClick={() => setStatusModal(ticket)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Status</button>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button onClick={() => setAssignModal(ticket)} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">Assign</button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {!['Resolved', 'Rejected'].includes(ticket.status) && (
                            <button
                              onClick={() => setDeleteConfirm(ticket)}
                              title="Delete ticket"
                              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400 text-sm">No tickets found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {pagination.last > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.current} of {pagination.last} ({pagination.total} total)</p>
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.current <= 1}
                      onClick={() => { const p = page - 1; setPage(p); fetchTickets(search, status, priority, dateFrom, dateTo, p, sortBy, sortDir, assignedTo) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40"
                    >Prev</button>
                    <button
                      disabled={pagination.current >= pagination.last}
                      onClick={() => { const p = page + 1; setPage(p); fetchTickets(search, status, priority, dateFrom, dateTo, p, sortBy, sortDir, assignedTo) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40"
                    >Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {statusModal && <UpdateStatusModal ticket={statusModal} onClose={() => setStatusModal(null)} onUpdated={fetchTickets} />}
      {assignModal && <AssignModal ticket={assignModal} staff={staff} onClose={() => setAssignModal(null)} onUpdated={fetchTickets} />}

      <ConfirmDialog
        open={!!deleteConfirm}
        icon={<Trash2 size={22} />}
        title="Delete Ticket"
        message={deleteConfirm ? `Are you sure you want to permanently delete ticket ${deleteConfirm.ticket_number}? All comments and history will be lost. This action cannot be undone.` : ''}
        confirmLabel="Yes, Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        icon={<Trash2 size={22} />}
        title={`Delete ${selected.size} Ticket${selected.size > 1 ? 's' : ''}`}
        message={`This will permanently delete ${selected.size} selected ticket${selected.size > 1 ? 's' : ''} along with all their comments and history. This action cannot be undone.`}
        confirmLabel={`Yes, Delete ${selected.size}`}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
    </Layout>
  )
}
