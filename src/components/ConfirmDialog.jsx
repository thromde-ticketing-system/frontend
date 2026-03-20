import React, { useEffect } from 'react'

const VARIANTS = {
  danger:  { btn: 'bg-red-600 hover:bg-red-700 text-white',      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  warning: { btn: 'bg-amber-500 hover:bg-amber-600 text-white',  icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  success: { btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  primary: { btn: 'bg-blue-600 hover:bg-blue-700 text-white',    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
}

export default function ConfirmDialog({ open, icon, title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const v = VARIANTS[variant] || VARIANTS.danger

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          {icon && (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${v.icon}`}>
              {icon}
            </div>
          )}
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${v.btn}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
