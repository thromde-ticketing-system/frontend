import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, PlusCircle, Users, LogOut, Menu, X, ChevronRight, Shield, UserCog, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { disconnectEcho } from '../services/echo'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    disconnectEcho()
    await logout()
    navigate('/login')
  }

  const staffLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submit-ticket', icon: PlusCircle, label: 'Submit Ticket' },
    { to: '/my-tickets', icon: Ticket, label: 'My Tickets' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ]
  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tickets', icon: Ticket, label: 'All Tickets' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ]
  const links = user?.role === 'admin' ? adminLinks : staffLinks

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e8b44b] rounded-lg flex items-center justify-center shadow-md">
            <Shield size={20} className="text-[#0f1e2e]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight tracking-wide">Thromde</h1>
            <p className="text-slate-400 text-xs">Ticketing System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={17} />
              {label}
            </span>
            <ChevronRight size={13} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Mobile-only: Profile + Logout at bottom */}
      <div className="md:hidden px-3 py-4 border-t border-white/10 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <UserCog size={17} />
          Profile Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0f1e2e] text-white p-2 rounded-lg shadow-lg border border-white/10"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#0f1e2e] shadow-xl z-40">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-[#0f1e2e] shadow-xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
