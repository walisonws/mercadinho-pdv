import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function PrivateRoute({ children }) {
  const { loading, lojaId } = useAuth()

  if (loading || !lojaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={36} className="animate-spin text-green-500" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  return children
}
