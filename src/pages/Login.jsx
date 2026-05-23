import { useState } from 'react'
import { Store, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, registrar, redefinirSenha } = useAuth()
  const [aba, setAba] = useState('login') // 'login' | 'registrar' | 'recuperar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeLoja, setNomeLoja] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function traduzirErro(msg) {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.'
    if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
    if (msg.includes('Unable to validate email')) return 'E-mail inválido.'
    return msg
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
    } catch (err) {
      setErro(traduzirErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  async function handleRegistrar(e) {
    e.preventDefault()
    setErro('')
    if (!nomeLoja.trim()) { setErro('Informe o nome do seu mercadinho.'); return }
    setCarregando(true)
    try {
      const data = await registrar(email, senha, nomeLoja)
      if (data?.session) {
        // Email confirmation desabilitado → sessão criada imediatamente, PrivateRoute redireciona
      } else {
        setSucesso('Conta criada! Verifique seu e-mail para confirmar antes de entrar.')
        setAba('login')
      }
    } catch (err) {
      setErro(traduzirErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await redefinirSenha(email)
      setSucesso('Enviamos um link de redefinição para seu e-mail.')
    } catch (err) {
      setErro(traduzirErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">PDV Mercadinho</h1>
          <p className="text-gray-500 mt-1">Sistema de ponto de venda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Abas */}
          {aba !== 'recuperar' && (
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setAba('login'); setErro(''); setSucesso('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAba('registrar'); setErro(''); setSucesso('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'registrar' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* Mensagens */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0" />
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              <CheckCircle size={16} className="shrink-0" />
              {sucesso}
            </div>
          )}

          {/* Form Login */}
          {aba === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-green-500"
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {carregando ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                Entrar
              </button>
              <button type="button" onClick={() => { setAba('recuperar'); setErro(''); setSucesso('') }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
                Esqueci minha senha
              </button>
            </form>
          )}

          {/* Form Registro */}
          {aba === 'registrar' && (
            <form onSubmit={handleRegistrar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do mercadinho</label>
                <input
                  type="text"
                  value={nomeLoja}
                  onChange={e => setNomeLoja(e.target.value)}
                  placeholder="Ex: Mercadinho do João"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-green-500"
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {carregando ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                Criar conta
              </button>
            </form>
          )}

          {/* Form Recuperar senha */}
          {aba === 'recuperar' && (
            <form onSubmit={handleRecuperar} className="space-y-4">
              <div className="text-center">
                <h2 className="font-semibold text-gray-800 text-lg">Recuperar senha</h2>
                <p className="text-sm text-gray-500 mt-1">Enviaremos um link para redefinir sua senha.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {carregando ? <Loader2 size={18} className="animate-spin" /> : null}
                Enviar link
              </button>
              <button type="button" onClick={() => { setAba('login'); setErro(''); setSucesso('') }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
                ← Voltar para o login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">PDV Mercadinho · Sistema offline-first</p>
      </div>
    </div>
  )
}
