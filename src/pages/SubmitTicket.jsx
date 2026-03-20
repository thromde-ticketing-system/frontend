import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, AlertCircle, ArrowLeft, Paperclip, X, FileText, Image } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../services/api'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_MB = 10

export default function SubmitTicket() {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' })
  const [attachment, setAttachment] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors(prev => ({ ...prev, attachment: [`File must be under ${MAX_MB}MB.`] }))
      return
    }
    setErrors(prev => { const { attachment: _, ...rest } = prev; return rest })
    setAttachment(file)
  }

  const removeFile = () => {
    setAttachment(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const body = new FormData()
      body.append('title', form.title)
      body.append('description', form.description)
      body.append('priority', form.priority)
      if (attachment) body.append('attachment', attachment)

      const res = await api.post('/tickets', body)
      setSuccess(res.data.ticket)
      setForm({ title: '', description: '', priority: 'Medium' })
      setAttachment(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Failed to submit ticket.' })
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Ticket Submitted!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Your service request has been received.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Your Ticket Number</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono mt-1">{success.ticket_number}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Save this for tracking your request</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSuccess(null)} className="btn-primary">Submit Another</button>
              <Link to="/my-tickets" className="btn-secondary">View My Tickets</Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const isImage = attachment && IMAGE_TYPES.includes(attachment.type)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-start gap-3">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Submit Service Request</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Describe your issue and we'll look into it</p>
          </div>
        </div>

        <div className="card">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} />{errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Subject / Title *</label>
              <input type="text" className="input-field" placeholder="Brief description of your issue"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
            </div>
            <div>
              <label className="label">Priority Level *</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="Low">Low — General inquiry</option>
                <option value="Medium">Medium — Standard issue</option>
                <option value="High">High — Urgent matter</option>
                <option value="Urgent">Urgent — Critical emergency</option>
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="input-field min-h-[150px] resize-y" placeholder="Provide detailed information about your issue..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
            </div>

            {/* Attachment */}
            <div>
              <label className="label">Attachment <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFile}
              />
              {attachment ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    {isImage
                      ? <Image size={18} className="text-blue-600 dark:text-blue-400" />
                      : <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{attachment.name}</p>
                    <p className="text-xs text-slate-400">{(attachment.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={removeFile} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Paperclip size={16} />
                  Click to attach a file or image (max {MAX_MB}MB)
                </button>
              )}
              {errors.attachment && <p className="text-red-500 text-xs mt-1">{errors.attachment[0]}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary px-8 disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <Link to="/dashboard" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
