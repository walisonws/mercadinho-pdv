/**
 * Painel Admin — acesso restrito ao desenvolvedor/dono do sistema
 * Senha configurada em VITE_ADMIN_PASSWORD (default: admin123 em dev)
 */
import { useState, useEffect } from 'react'
import { Shield, Store, ShoppingBag, Package, Users, TrendingUp, LogOut, Eye, EyeOff, RefreshCw, Crown, Clock, Ban, CheckCircle, ChevronDown, X, Calendar, MessageSquare, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const fmt = v => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

const STATUS_CONFIG = {
  ativo:     { label: 'Ativo',     cor: 'bg-green-500/20 text-green-400 border-green-500/30',  icon: CheckCircle },
  vitalicio: { label: 'Vitalício', cor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Crown },
  trial:     { label: 'Trial',     cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  suspenso:  { label: 'Suspenso',  cor: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: Ban },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cor}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function ModalCliente({ loja, onSalvar, onFechar }) {
  const [status, setStatus] = useState(loja.status || 'ativo')
  const [vencimento, setVencimento] = useState(loja.dataVencimento || '')
  const [observacao, setObservacao] = useState(loja.observacao || '')
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(loja.lojaId, { status, dataVencimento: vencimento, observacao })
    setSalvando(false)
    onFechar()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="font-bold text-white">{loja.nome}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{loja.lojaId.slice(0, 20)}…</p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Status do cliente</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      status === key ? cfg.cor + ' ring-2 ring-offset-1 ring-offset-gray-800' : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Data de vencimento (oculta para vitalício) */}
          {status !== 'vitalicio' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                <Calendar size={11} className="inline mr-1" />
                {status === 'trial' ? 'Fim do trial' : 'Vencimento do plano'}
              </label>
              <input
                type="date"
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-400"
              />
              {!vencimento && status === 'ativo' && (
                <p className="text-xs text-gray-500 mt-1">Sem data = sem aviso de vencimento</p>
              )}
            </div>
          )}

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              <MessageSquare size={11} className="inline mr-1" />
              Observação interna
            </label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Cliente indicado pelo João, pagamento combinado..."
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-400 resize-none placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onFechar} className="flex-1 border border-gray-600 text-gray-400 py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors text-sm disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(() => sessionStorage.getItem('pdv_admin_auth') === '1')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  const [lojas, setLojas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [ultimaAtt, setUltimaAtt] = useState(null)
  const [lojaEditando, setLojaEditando] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')

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
      const [configRes, vendasRes, produtosRes, operadoresRes, clientesRes] = await Promise.all([
        supabase.from('pdv_config').select('*'),
        supabase.from('pdv_vendas').select('loja_id, total, data'),
        supabase.from('pdv_produtos').select('loja_id, id'),
        supabase.from('pdv_operadores').select('loja_id, id'),
        supabase.from('pdv_clientes').select('*'),
      ])

      const configs = configRes.data || []
      const vendas = vendasRes.data || []
      const produtos = produtosRes.data || []
      const operadores = operadoresRes.data || []
      const clientes = clientesRes.data || []

      const clienteMap = {}
      clientes.forEach(c => { clienteMap[c.loja_id] = c })

      const lojaMap = {}
      configs.forEach(c => {
        const cli = clienteMap[c.loja_id] || {}
        lojaMap[c.loja_id] = {
          lojaId: c.loja_id,
          nome: c.nome_mercadinho || 'Sem nome',
          endereco: c.endereco || '',
          telefone: c.telefone || '',
          status: cli.status || 'ativo',
          dataVencimento: cli.data_vencimento || '',
          observacao: cli.observacao || '',
          totalVendas: 0,
          faturamentoTotal: 0,
          qtdProdutos: 0,
          qtdOperadores: 0,
          ultimaVenda: null,
        }
      })

      vendas.forEach(v => {
        if (!lojaMap[v.loja_id]) {
          const cli = clienteMap[v.loja_id] || {}
          lojaMap[v.loja_id] = {
            lojaId: v.loja_id,
            nome: v.loja_id.slice(0, 8) + '…',
            status: cli.status || 'ativo',
            dataVencimento: cli.data_vencimento || '',
            observacao: cli.observacao || '',
            totalVendas: 0, faturamentoTotal: 0, qtdProdutos: 0, qtdOperadores: 0, ultimaVenda: null
          }
        }
        lojaMap[v.loja_id].totalVendas++
        lojaMap[v.loja_id].faturamentoTotal += v.total || 0
        if (!lojaMap[v.loja_id].ultimaVenda || v.data > lojaMap[v.loja_id].ultimaVenda)
          lojaMap[v.loja_id].ultimaVenda = v.data
      })

      produtos.forEach(p => { if (lojaMap[p.loja_id]) lojaMap[p.loja_id].qtdProdutos++ })
      operadores.forEach(o => { if (lojaMap[o.loja_id]) lojaMap[o.loja_id].qtdOperadores++ })

      setLojas(Object.values(lojaMap).sort((a, b) => b.faturamentoTotal - a.faturamentoTotal))
      setUltimaAtt(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  async function salvarCliente(lojaId, dados) {
    if (!supabase) return
    await supabase.from('pdv_clientes').upsert({
      loja_id: lojaId,
      status: dados.status,
      data_vencimento: dados.dataVencimento || null,
      observacao: dados.observacao || '',
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'loja_id' })

    setLojas(prev => prev.map(l => l.lojaId === lojaId
      ? { ...l, status: dados.status, dataVencimento: dados.dataVencimento, observacao: dados.observacao }
      : l
    ))
  }

  function diasParaVencer(dataVencimento) {
    if (!dataVencimento) return null
    const diff = new Date(dataVencimento) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
  const contagemStatus = lojas.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {})

  const lojasFiltradas = filtroStatus === 'todos' ? lojas : lojas.filter(l => l.status === filtroStatus)

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
            <p className="text-xs text-gray-400 mb-1">Total de lojas</p>
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
            <p className="text-xs text-gray-400 mb-1">Ticket médio</p>
            <p className="text-2xl font-bold text-purple-400">
              {fmt(lojas.length > 0 ? totalFaturamento / Math.max(totalVendas, 1) : 0)}
            </p>
          </div>
        </div>

        {/* Cards de status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button
                key={key}
                onClick={() => setFiltroStatus(filtroStatus === key ? 'todos' : key)}
                className={`bg-gray-800 rounded-2xl p-4 text-left transition-all border-2 ${
                  filtroStatus === key ? 'border-gray-500' : 'border-transparent hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={cfg.cor.split(' ')[1]} />
                  <p className="text-xs text-gray-400">{cfg.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">{contagemStatus[key] || 0}</p>
              </button>
            )
          })}
        </div>

        {/* Lista de lojas */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-gray-400" />
              <h2 className="font-semibold">
                {filtroStatus === 'todos' ? `Todas as lojas (${lojas.length})` : `${STATUS_CONFIG[filtroStatus]?.label} (${lojasFiltradas.length})`}
              </h2>
            </div>
            {filtroStatus !== 'todos' && (
              <button onClick={() => setFiltroStatus('todos')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                <X size={12} /> Limpar filtro
              </button>
            )}
          </div>

          {carregando ? (
            <div className="p-10 text-center text-gray-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Carregando dados...</p>
            </div>
          ) : lojasFiltradas.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">Nenhuma loja encontrada</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {lojasFiltradas.map((loja, i) => {
                const dias = diasParaVencer(loja.dataVencimento)
                const vencendoEmBreve = dias !== null && dias <= 7 && dias >= 0 && loja.status === 'ativo'
                const vencido = dias !== null && dias < 0 && loja.status === 'ativo'

                return (
                  <div key={loja.lojaId} className={`px-5 py-4 transition-colors hover:bg-gray-750 ${loja.status === 'suspenso' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xs text-gray-500 w-5 shrink-0 mt-1">#{i + 1}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-semibold text-white truncate">{loja.nome}</p>
                            <StatusBadge status={loja.status} />
                            {vencendoEmBreve && (
                              <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                                <AlertTriangle size={10} /> vence em {dias}d
                              </span>
                            )}
                            {vencido && (
                              <span className="text-xs text-red-400 flex items-center gap-0.5">
                                <AlertTriangle size={10} /> vencido há {Math.abs(dias)}d
                              </span>
                            )}
                          </div>
                          {loja.endereco && <p className="text-xs text-gray-400 truncate">{loja.endereco}</p>}
                          {loja.observacao && <p className="text-xs text-gray-500 italic truncate mt-0.5">"{loja.observacao}"</p>}
                          {loja.dataVencimento && loja.status !== 'suspenso' && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {loja.status === 'trial' ? 'Trial até' : 'Vence em'}: {new Date(loja.dataVencimento).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          <p className="text-xs text-gray-700 font-mono mt-0.5">{loja.lojaId.slice(0, 16)}…</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><ShoppingBag size={12} />{loja.totalVendas}</span>
                          <span className="flex items-center gap-1"><Package size={12} />{loja.qtdProdutos}</span>
                          <span className="flex items-center gap-1"><Users size={12} />{loja.qtdOperadores}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400 text-sm">{fmt(loja.faturamentoTotal)}</p>
                          {loja.ultimaVenda && (
                            <p className="text-xs text-gray-500">
                              {new Date(loja.ultimaVenda).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setLojaEditando(loja)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {import.meta.env.DEV && (
          <p className="text-xs text-gray-600 text-center">
            Senha admin: <code className="bg-gray-800 px-1 rounded">VITE_ADMIN_PASSWORD</code> · Atual: <code className="bg-gray-800 px-1 rounded">{ADMIN_PASSWORD}</code>
          </p>
        )}
      </div>

      {lojaEditando && (
        <ModalCliente
          loja={lojaEditando}
          onSalvar={salvarCliente}
          onFechar={() => setLojaEditando(null)}
        />
      )}
    </div>
  )
}
