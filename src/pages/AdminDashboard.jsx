import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Users, Clock, CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import api from '../services/api'

export default function AdminDashboard() {
  const [data, setData] = useState({ stats: {}, recent_tickets: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Tickets', value: data.stats.total_tickets, icon: Ticket, iconBg: 'bg-blue-600' },
    { label: 'Pending', value: data.stats.pending, icon: Clock, iconBg: 'bg-amber-500' },
    { label: 'In Progress', value: data.stats.in_progress, icon: TrendingUp, iconBg: 'bg-indigo-500' },
    { label: 'Resolved', value: data.stats.resolved, icon: CheckCircle, iconBg: 'bg-emerald-500' },
    { label: 'Rejected', value: data.stats.rejected, icon: XCircle, iconBg: 'bg-red-500' },
    { label: 'Urgent', value: data.stats.urgent, icon: AlertTriangle, iconBg: 'bg-orange-500' },
    { label: 'Total Staff', value: data.stats.total_users, icon: Users, iconBg: 'bg-violet-500' },
  ]

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Overview of all service requests and users</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, iconBg }) => (
            <div key={label} className="card">
              <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{loading ? '—' : (value ?? 0)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Tickets</h2>
            <Link to="/admin/tickets" className="accent-link text-sm">View all →</Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left pb-3">Ticket #</th>
                    <th className="text-left pb-3">Title</th>
                    <th className="text-left pb-3">Staff</th>
                    <th className="text-left pb-3">Priority</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Date</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_tickets.map(ticket => (
                    <tr key={ticket.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 text-sm font-mono text-blue-700 dark:text-blue-400 font-semibold">{ticket.ticket_number}</td>
                      <td className="py-3 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">{ticket.title}</td>
                      <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{ticket.user?.name}</td>
                      <td className="py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td className="py-3"><Link to={`/tickets/${ticket.id}`} className="accent-link text-xs">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
