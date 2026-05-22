import { NavLink } from 'react-router-dom'
import { ShoppingCart, Package, History, LayoutDashboard, Settings, ClipboardList, Sparkles, Wifi, WifiOff, Loader2, Vault, TrendingUp, Users, Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'

const links = [
  { to: '/', icon: ShoppingCart, label: 'PDV' },
  { to: '/caixa', icon: Vault, label: 'Caixa' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/reposicao', icon: ClipboardList, label: 'Reposição' },
  { to: '/entrada-estoque', icon: Sparkles, label: 'Nota IA' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/relatorio-lucro', icon: TrendingUp, label: 'Lucro' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/operadores', icon: Users, label: 'Operadores' },
  { to: '/assinatura', icon: Crown, label: 'Plano' },
  { to: '/configuracoes', icon: Settings, label: 'Config' },
]

export default function Navbar() {
  const { config, produtosBaixoEstoque, sincStatus, caixaAtual, operadorAtivo } = useApp()

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-lg tracking-tight truncate max-w-[140px]">
            🛒 {config.nomeMercadinho}
          </span>
          {sincStatus === 'sincronizando' && (
            <Loader2 size={13} className="animate-spin text-green-300 shrink-0" title="Sincronizando..." />
          )}
          {sincStatus === 'ok' && (
            <Wifi size={13} className="text-green-300 shrink-0" title="Sincronizado" />
          )}
          {sincStatus === 'erro' && (
            <WifiOff size={13} className="text-yellow-300 shrink-0" title="Sem sync — usando dados locais" />
          )}
          {operadorAtivo && (
            <span className="hidden sm:flex items-center gap-1 bg-green-600 text-green-100 text-xs px-2 py-0.5 rounded-full">
              👤 {operadorAtivo.nome}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center px-2 py-1 rounded-lg text-xs font-medium transition-colors gap-0.5 whitespace-nowrap ${
                  isActive ? 'bg-green-900 text-white' : 'text-green-100 hover:bg-green-600'
                }`
              }
            >
              <Icon size={16} />
              <span className="text-[10px]">{label}</span>
              {to === '/reposicao' && produtosBaixoEstoque.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {produtosBaixoEstoque.length}
                </span>
              )}
              {to === '/caixa' && (
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-green-700 ${caixaAtual ? 'bg-green-300' : 'bg-gray-400'}`} />
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
