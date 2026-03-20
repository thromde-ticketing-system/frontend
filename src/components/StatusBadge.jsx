import React from 'react'

const statusConfig = {
  'Pending':     { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',  dot: 'bg-amber-500' },
  'In Progress': { cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',     dot: 'bg-blue-500' },
  'Resolved':    { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'Rejected':    { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',         dot: 'bg-red-500' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status}
    </span>
  )
}
