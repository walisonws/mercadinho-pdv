import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import PrivateRoute from './components/PrivateRoute'
import ModalOnboarding from './components/ModalOnboarding'
import Navbar from './components/Navbar'

// PDV é a tela inicial → carrega junto. As demais sob demanda (carga inicial mais leve).
import PDV from './pages/PDV'
const Produtos = lazy(() => import('./pages/Produtos'))
const Historico = lazy(() => import('./pages/Historico'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const Reposicao = lazy(() => import('./pages/Reposicao'))
const EntradaEstoque = lazy(() => import('./pages/EntradaEstoque'))
const Caixa = lazy(() => import('./pages/Caixa'))
const RelatorioLucro = lazy(() => import('./pages/RelatorioLucro'))
const Operadores = lazy(() => import('./pages/Operadores'))
const Admin = lazy(() => import('./pages/Admin'))

function Carregando() {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      Carregando…
    </div>
  )
}

function OnboardingGuard({ children }) {
  const { config, sincStatus } = useApp()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Só exibe após sync inicial (para não sobrepor dados existentes)
    if (sincStatus === 'ok' || sincStatus === 'erro' || sincStatus === 'idle') {
      const jaConcluiu = localStorage.getItem('pdv_onboarding_done')
      if (!jaConcluiu && config.nomeMercadinho === 'Meu Mercadinho') {
        setShowOnboarding(true)
      }
    }
  }, [sincStatus])

  function handleConcluir() {
    localStorage.setItem('pdv_onboarding_done', '1')
    setShowOnboarding(false)
  }

  return (
    <>
      {children}
      {showOnboarding && <ModalOnboarding onConcluir={handleConcluir} />}
    </>
  )
}

function AppLayout() {
  return (
    <AppProvider>
      <OnboardingGuard>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<Carregando />}>
            <Routes>
              <Route path="/" element={<PDV />} />
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/reposicao" element={<Reposicao />} />
              <Route path="/entrada-estoque" element={<EntradaEstoque />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/relatorio-lucro" element={<RelatorioLucro />} />
              <Route path="/operadores" element={<Operadores />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
            </Suspense>
          </main>
        </div>
      </OnboardingGuard>
    </AppProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Carregando />}>
          <Routes>
            {/* Admin não usa PrivateRoute — tem autenticação própria com senha */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
