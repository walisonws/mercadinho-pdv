import { Routes, Route, NavLink, Outlet } from 'react-router-dom'
import { TaxiProvider } from '../../context/TaxiContext'
import TaxiDashboard from './TaxiDashboard'
import TaxiNovoRecibo from './TaxiNovoRecibo'
import TaxiHistorico from './TaxiHistorico'
import TaxiConfiguracoes from './TaxiConfiguracoes'
import TaxiImprimir from './TaxiImprimir'
import { LayoutDashboard, FilePlus, ClipboardList, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/taxi', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/taxi/novo', icon: FilePlus, label: 'Novo' },
  { to: '/taxi/historico', icon: ClipboardList, label: 'Histórico' },
  { to: '/taxi/configuracoes', icon: Settings, label: 'Config' },
]

function TaxiNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-pb">
      <div className="flex max-w-md mx-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-yellow-500' : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function TaxiLayout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Outlet />
      <TaxiNav />
    </div>
  )
}

export default function TaxiApp() {
  return (
    <TaxiProvider>
      <Routes>
        <Route path="recibo/:id" element={<TaxiImprimir />} />
        <Route element={<TaxiLayout />}>
          <Route index element={<TaxiDashboard />} />
          <Route path="novo" element={<TaxiNovoRecibo />} />
          <Route path="historico" element={<TaxiHistorico />} />
          <Route path="configuracoes" element={<TaxiConfiguracoes />} />
        </Route>
      </Routes>
    </TaxiProvider>
  )
}
