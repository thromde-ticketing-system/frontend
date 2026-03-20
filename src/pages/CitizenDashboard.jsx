import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 })
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/tickets/my?per_page=5')
        setRecentTickets(res.data.data || [])
        const allRes = await api.get('/tickets/my?per_page=1000')
        const all = allRes.data.data || []
        setStats({
          total: allRes.data.total || all.length,
          pending: all.filter(t => t.status === 'Pending').length,
          inProgress: all.filter(t => t.status === 'In Progress').length,
          resolved: all.filter(t => t.status === 'Resolved').length,
        })
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: Ticket, iconBg: 'bg-blue-600 dark:bg-blue-700', cardBg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending', value: stats.pending, icon: Clock, iconBg: 'bg-amber-500', cardBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'In Progress', value: stats.inProgress, icon: ArrowRight, iconBg: 'bg-indigo-500', cardBg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, iconBg: 'bg-emerald-500', cardBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ]

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Here's an overview of your service requests</p>
          </div>
          <Link to="/submit-ticket" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> Submit New Ticket
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, iconBg, cardBg }) => (
            <div key={label} className={`rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{loading ? '—' : value}</p>
                </div>
                <div className={`${iconBg} p-3 rounded-xl shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Tickets</h2>
            <Link to="/my-tickets" className="accent-link text-sm">View all →</Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No tickets yet</p>
              <Link to="/submit-ticket" className="accent-link text-sm mt-2 inline-block">Submit your first ticket</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left pb-3">Ticket #</th>
                    <th className="text-left pb-3">Title</th>
                    <th className="text-left pb-3">Priority</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Date</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(ticket => (
                    <tr key={ticket.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 text-sm font-mono text-blue-700 dark:text-blue-400 font-semibold">{ticket.ticket_number}</td>
                      <td className="py-3 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">{ticket.title}</td>
                      <td className="py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Link to={`/tickets/${ticket.id}`} className="accent-link text-xs">View</Link>
                      </td>
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
