import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, Handshake, Star, LogOut, Instagram, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/dashboard', label: 'Дашборд',  icon: LayoutDashboard },
  { to: '/clients',   label: 'Клиенты',  icon: Users },
  { to: '/properties',label: 'Объекты',  icon: Building2 },
  { to: '/deals',     label: 'Сделки',   icon: Handshake },
  { to: '/selections',label: 'Подборки', icon: Star },
  { to: '/instagram', label: 'Instagram', icon: Instagram },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-900 leading-tight">HomeMatch</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">CRM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-lg">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-[11px] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-slate-900 truncate leading-tight">{user?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
