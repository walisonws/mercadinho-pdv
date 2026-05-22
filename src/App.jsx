import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import PDV from './pages/PDV'
import Produtos from './pages/Produtos'
import Historico from './pages/Historico'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Reposicao from './pages/Reposicao'
import EntradaEstoque from './pages/EntradaEstoque'
import Caixa from './pages/Caixa'
import Login from './pages/Login'
import RelatorioLucro from './pages/RelatorioLucro'
import Operadores from './pages/Operadores'
import Assinatura from './pages/Assinatura'

function AppLayout() {
  return (
    <AppProvider>
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
    </AppProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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
