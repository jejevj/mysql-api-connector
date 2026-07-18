import { NavLink } from 'react-router-dom'
import { Database, Link2, LayoutGrid, Activity } from 'lucide-react'

const navItems = [
  { to: '/connectors', label: 'Connectors', icon: Link2 },
  { to: '/models',     label: 'Models',     icon: LayoutGrid },
  { to: '/jobs',       label: 'Sync Jobs',  icon: Activity },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Database size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">MySQL API</p>
              <p className="text-xs text-gray-400 mt-0.5">Connector</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
