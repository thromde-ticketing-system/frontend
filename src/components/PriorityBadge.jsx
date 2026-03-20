import React from 'react'

const priorityConfig = {
  'Low':    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'Medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'High':   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Urgent': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function PriorityBadge({ priority }) {
  const cls = priorityConfig[priority] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {priority}
    </span>
  )
}
