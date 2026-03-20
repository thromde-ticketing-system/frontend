import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Shield, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import api from '../services/api'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

export default function PublicTracker() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!ticketNumber.trim()) return
    setError(''); setTicket(null); setLoading(true)
    try {
      const res = await api.get(`/tickets/track/${ticketNumber.trim().toUpperCase()}`)
      setTicket(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket not found. Please check the ticket number.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e2e] to-[#1a3050]">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e8b44b] rounded-lg flex items-center justify-center shadow">
              <Shield size={18} className="text-[#0f1e2e]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Thromde Ticketing System</h1>
              <p className="text-slate-400 text-xs">Thimphu Municipal Office</p>
            </div>
          </div>
          <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
            Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Track Your Ticket</h2>
          <p className="text-slate-400">Enter your ticket number to check the status of your service request</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 mb-6 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input type="text" className="input-field flex-1 text-base font-mono" placeholder="e.g. THR-2024-00001"
              value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} />
            <button type="submit" disabled={loading} className="btn-primary px-6 disabled:opacity-60 flex items-center gap-2">
              <Search size={18} />{loading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}
        </div>

        {ticket && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
              <div>
                <p className="text-blue-700 dark:text-blue-400 font-mono font-bold text-lg">{ticket.ticket_number}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{ticket.title}</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Submitted</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Last Updated</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(ticket.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {ticket.history?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Clock size={16} />Status History</h4>
                <div className="space-y-3">
                  {ticket.history.map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0 mt-0.5"></div>
                        {i < ticket.history.length - 1 && <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1"></div>}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {h.old_status ? `${h.old_status} → ${h.new_status}` : `Created as ${h.new_status}`}
                        </p>
                        {h.note && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{h.note}</p>}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
