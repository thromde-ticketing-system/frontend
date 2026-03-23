import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Ticket, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import api from '../services/api'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Rejected', label: 'Rejected' },
]

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const fetchTickets = useCallback(async (s = search, st = status, pr = priority, p = page, sb = sortBy, sd = sortDir) => {
    const cacheKey = `my_tickets_${st}_${p}`
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
      const params = { page: p }
      if (s) params.search = s
      if (st) params.status = st
      if (pr) params.priority = pr
      if (sb) { params.sort_by = sb; params.sort_dir = sd }
      const res = await api.get('/tickets/my', { params })
      const data = res.data.data || []
      const pg = { total: res.data.total, current: res.data.current_page, last: res.data.last_page }
      setTickets(data)
      setPagination(pg)
      if (!s) localStorage.setItem(cacheKey, JSON.stringify({ data, pagination: pg }))
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchTickets(search, status, priority, 1, sortBy, sortDir)
    }, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [search, status, priority, sortBy, sortDir])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const clearAll = () => { setSearch(''); setPriority(''); setPage(1) }

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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Tickets</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Track all your service requests</p>
          </div>
          <Link to="/submit-ticket" className="btn-primary text-sm">+ New Ticket</Link>
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

        <div className="card mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="label">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="input-field pl-9" placeholder="Type to search tickets..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">All Priority</option>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            {(search || priority) && (
              <button onClick={clearAll} className="btn-secondary self-end">Clear</button>
            )}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No tickets found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left pb-3">Ticket #</th>
                      <SortTh col="title" label="Title" />
                      <SortTh col="priority" label="Priority" />
                      <SortTh col="status" label="Status" />
                      <th className="text-left pb-3">Assigned To</th>
                      <SortTh col="created_at" label="Date" />
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 text-sm font-mono text-blue-700 dark:text-blue-400 font-semibold">{ticket.ticket_number}</td>
                        <td className="py-3 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">{ticket.title}</td>
                        <td className="py-3"><PriorityBadge priority={ticket.priority} /></td>
                        <td className="py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{ticket.assigned_to?.name || <span className="italic text-slate-400">Unassigned</span>}</td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <Link to={`/tickets/${ticket.id}`} className="accent-link text-xs">View →</Link>
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
                      onClick={() => { const p = page - 1; setPage(p); fetchTickets(search, status, priority, p, sortBy, sortDir) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40">Prev</button>
                    <button disabled={pagination.current >= pagination.last}
                      onClick={() => { const p = page + 1; setPage(p); fetchTickets(search, status, priority, p, sortBy, sortDir) }}
                      className="btn-secondary text-sm py-1 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
