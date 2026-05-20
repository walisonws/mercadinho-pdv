import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import PDV from './pages/PDV'
import Produtos from './pages/Produtos'
import Historico from './pages/Historico'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Reposicao from './pages/Reposicao'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<PDV />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/reposicao" element={<Reposicao />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
