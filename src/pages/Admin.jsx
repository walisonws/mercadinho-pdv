/**
 * Painel Admin — acesso restrito ao desenvolvedor/dono do sistema
 * Senha configurada em VITE_ADMIN_PASSWORD (default: admin123 em dev)
 */
import { useState, useEffect } from 'react'
import { Shield, Store, ShoppingBag, Package, Users, TrendingUp, LogOut, Eye, EyeOff, RefreshCw, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

const fmt = v => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Admin() {
  const [autenticado, setAutenticado] = useState(() => sessionStorage.getItem('pdv_admin_auth') === '1')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  const [lojas, setLojas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [ultimaAtt, setUltimaAtt] = useState(null)

  useEffect(() => {
    if (autenticado) carregarDados()
  }, [autenticado])

  function handleLogin(e) {
    e.preventDefault()
    if (senha === ADMIN_PASSWORD) {
      sessionStorage.setItem('pdv_admin_auth', '1')
      setAutenticado(true)
    } else {
      setErroSenha(true)
      setSenha('')
      setTimeout(() => setErroSenha(false), 2000)
    }
  }

  function handleSair() {
    sessionStorage.removeItem('pdv_admin_auth')
    setAutenticado(false)
    setLojas([])
  }

  async function carregarDados() {
    if (!supabase) return
    setCarregando(true)
    try {
      const [configRes, vendasRes, produtosRes, operadoresRes] = await Promise.all([
        supabase.from('pdv_config').select('*'),
        supabase.from('pdv_vendas').select('loja_id, total, data'),
        supabase.from('pdv_produtos').select('loja_id, id'),
        supabase.from('pdv_operadores').select('loja_id, id'),
      ])

      const configs = configRes.data || []
      const vendas = vendasRes.data || []
      const produtos = produtosRes.data || []
      const operadores = operadoresRes.data || []

      const lojaMap = {}
      configs.forEach(c => {
        lojaMap[c.loja_id] = {
          lojaId: c.loja_id,
          nome: c.nome_mercadinho || 'Sem nome',
          endereco: c.endereco || '',
          telefone: c.telefone || '',
          totalVendas: 0,
          faturamentoTotal: 0,
          qtdProdutos: 0,
          qtdOperadores: 0,
          ultimaVenda: null,
        }
      })

      vendas.forEach(v => {
        if (!lojaMap[v.loja_id]) lojaMap[v.loja_id] = { lojaId: v.loja_id, nome: v.loja_id.slice(0, 8) + '…', totalVendas: 0, faturamentoTotal: 0, qtdProdutos: 0, qtdOperadores: 0, ultimaVenda: null }
        lojaMap[v.loja_id].totalVendas++
        lojaMap[v.loja_id].faturamentoTotal += v.total || 0
        if (!lojaMap[v.loja_id].ultimaVenda || v.data > lojaMap[v.loja_id].ultimaVenda)
          lojaMap[v.loja_id].ultimaVenda = v.data
      })

      produtos.forEach(p => {
        if (lojaMap[p.loja_id]) lojaMap[p.loja_id].qtdProdutos++
      })

      operadores.forEach(o => {
        if (lojaMap[o.loja_id]) lojaMap[o.loja_id].qtdOperadores++
      })

      setLojas(Object.values(lojaMap).sort((a, b) => b.faturamentoTotal - a.faturamentoTotal))
      setUltimaAtt(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-gray-400 mt-1 text-sm">Acesso restrito</p>
          </div>
          <form onSubmit={handleLogin} className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoFocus
                  className={`w-full bg-gray-700 border-2 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none transition-colors ${erroSenha ? 'border-red-500' : 'border-gray-600 focus:border-red-500'}`}
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {erroSenha && <p className="text-red-400 text-sm mt-1">Senha incorreta</p>}
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              Entrar
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-4">PDV Mercadinho · Admin</p>
        </div>
      </div>
    )
  }

  const totalFaturamento = lojas.reduce((a, l) => a + l.faturamentoTotal, 0)
  const totalVendas = lojas.reduce((a, l) => a + l.totalVendas, 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Admin</h1>
              {ultimaAtt && <p className="text-xs text-gray-400">Atualizado às {ultimaAtt.toLocaleTimeString('pt-BR')}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={carregarDados} disabled={carregando}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button onClick={handleSair}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>

        {!supabase && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-2xl p-5 text-yellow-300 text-sm">
            ⚠️ Supabase não configurado. O painel admin precisa de acesso ao banco de dados.
          </div>
        )}

        {/* Cards resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">Lojas ativas</p>
            <p className="text-2xl font-bold text-white">{lojas.length}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">Vendas totais</p>
            <p className="text-2xl font-bold text-blue-400">{totalVendas}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">Faturamento total</p>
            <p className="text-2xl font-bold text-green-400">{fmt(totalFaturamento)}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">Ticket médio/loja</p>
            <p className="text-2xl font-bold text-purple-400">
              {fmt(lojas.length > 0 ? totalFaturamento / Math.max(totalVendas, 1) : 0)}
            </p>
          </div>
        </div>

        {/* Lista de lojas */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
            <Store size={16} className="text-gray-400" />
            <h2 className="font-semibold">Lojas cadastradas ({lojas.length})</h2>
          </div>

          {carregando ? (
            <div className="p-10 text-center text-gray-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Carregando dados...</p>
            </div>
          ) : lojas.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">Nenhuma loja encontrada</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {lojas.map((loja, i) => (
                <div key={loja.lojaId} className="px-5 py-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-500 w-5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{loja.nome}</p>
                        {loja.endereco && <p className="text-xs text-gray-400 truncate">{loja.endereco}</p>}
                        <p className="text-xs text-gray-600 font-mono mt-0.5">{loja.lojaId.slice(0, 16)}…</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <ShoppingBag size={13} />
                        <span>{loja.totalVendas} vendas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Package size={13} />
                        <span>{loja.qtdProdutos} produtos</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Users size={13} />
                        <span>{loja.qtdOperadores} operadores</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">{fmt(loja.faturamentoTotal)}</p>
                        {loja.ultimaVenda && (
                          <p className="text-xs text-gray-500">
                            última venda {new Date(loja.ultimaVenda).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {import.meta.env.DEV && (
          <p className="text-xs text-gray-600 text-center">
            Senha admin definida em <code className="bg-gray-800 px-1 rounded">VITE_ADMIN_PASSWORD</code> · Atual: <code className="bg-gray-800 px-1 rounded">{ADMIN_PASSWORD}</code>
          </p>
        )}
      </div>
    </div>
  )
}
