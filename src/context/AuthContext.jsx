import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [lojaId, setLojaId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // Sem Supabase: usa loja_id local como antes
      const id = localStorage.getItem('pdv_loja_id') || uuidv4()
      localStorage.setItem('pdv_loja_id', id)
      setLojaId(id)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        resolverLojaId(session.user)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        resolverLojaId(session.user)
      } else {
        setUser(null)
        setLojaId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function resolverLojaId(u) {
    // loja_id fica no user_metadata do Supabase Auth
    let id = u.user_metadata?.loja_id
    if (!id) {
      id = uuidv4()
      await supabase.auth.updateUser({ data: { loja_id: id } })
    }
    setLojaId(id)
    localStorage.setItem('pdv_loja_id', id)
  }

  async function login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    return data
  }

  async function registrar(email, senha, nomeLoja) {
    const novoLojaId = uuidv4()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { loja_id: novoLojaId, nome_loja: nomeLoja } },
    })
    if (error) throw error

    // Se o Supabase não retornou sessão imediata (edge case mesmo com email confirmation OFF),
    // faz login automático para garantir que o usuário entra direto
    if (!data.session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      if (!loginError && loginData?.session) return loginData
    }

    return data
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  async function redefinirSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, lojaId, loading, login, registrar, sair, redefinirSenha }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
