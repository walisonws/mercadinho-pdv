import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function PrivateRoute({ children }) {
  const { user, loading, lojaId } = useAuth()

  if (loading || (user && !lojaId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={36} className="animate-spin text-green-500" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  // Sem Supabase configurado: libera acesso direto (modo local)
  if (!window.__SUPABASE_CONFIGURED__ && !user) {
    return children
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}
