import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const AuthContext = createContext()

// Chaves de dados locais — limpas ao resetar/desvincular o dispositivo
const CHAVES_DADOS = [
  'pdv_loja_id',
  'pdv_produtos',
  'pdv_vendas',
  'pdv_config',
  'pdv_listas',
  'pdv_operadores',
  'pdv_operador_ativo',
  'pdv_caixa_atual',
  'pdv_historico_caixas',
  'pdv_onboarding_done',
]

export function AuthProvider({ children }) {
  const [lojaId, setLojaId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Identidade = código da loja (loja_id). Gerado uma vez por dispositivo.
  // Para juntar dois dispositivos na mesma loja, basta colar o código em Configurações.
  useEffect(() => {
    let id = localStorage.getItem('pdv_loja_id')
    if (!id) {
      id = uuidv4()
      localStorage.setItem('pdv_loja_id', id)
    }
    setLojaId(id)
    setLoading(false)
  }, [])

  // "Desvincular / começar uma loja nova": apaga os dados locais e gera
  // um novo código. Não apaga a loja na nuvem — só desconecta este aparelho.
  function resetarLoja() {
    CHAVES_DADOS.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ lojaId, loading, user: null, sair: resetarLoja }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
