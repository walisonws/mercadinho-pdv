import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import PrivateRoute from './components/PrivateRoute'
import ModalOnboarding from './components/ModalOnboarding'
import Navbar from './components/Navbar'
import PDV from './pages/PDV'
import Produtos from './pages/Produtos'
import Historico from './pages/Historico'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Reposicao from './pages/Reposicao'
import EntradaEstoque from './pages/EntradaEstoque'
import Caixa from './pages/Caixa'
import RelatorioLucro from './pages/RelatorioLucro'
import Operadores from './pages/Operadores'
import Assinatura from './pages/Assinatura'
import Admin from './pages/Admin'

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
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
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
        <Routes>
          {/* Admin não usa PrivateRoute — tem autenticação própria com senha */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/*" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
