import { NavLink } from 'react-router-dom'
import { ShoppingCart, Package, History, LayoutDashboard, Settings, ClipboardList } from 'lucide-react'
import { useApp } from '../context/AppContext'

const links = [
  { to: '/', icon: ShoppingCart, label: 'PDV' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/reposicao', icon: ClipboardList, label: 'Reposição' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/configuracoes', icon: Settings, label: 'Config' },
]

export default function Navbar() {
  const { config, produtosBaixoEstoque } = useApp()

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg tracking-tight truncate max-w-xs">
          🛒 {config.nomeMercadinho}
        </span>
        <div className="flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors gap-0.5 ${
                  isActive ? 'bg-green-900 text-white' : 'text-green-100 hover:bg-green-600'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === '/reposicao' && produtosBaixoEstoque.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {produtosBaixoEstoque.length}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
