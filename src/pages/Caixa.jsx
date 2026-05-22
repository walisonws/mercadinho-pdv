import { useState } from 'react'
import { Vault, Plus, Minus, X, Clock, TrendingUp, TrendingDown, DollarSign, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

function fmt(v) { return `R$ ${Number(v || 0).toFixed(2)}` }
function fmtHora(iso) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function fmtData(iso) { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }

export default function Caixa() {
  const { caixaAtual, historicosCaixa, vendas, abrirCaixa, fecharCaixa, adicionarMovimentacaoCaixa } = useApp()

  const [valorAbertura, setValorAbertura] = useState('')
  const [modalMov, setModalMov] = useState(null) // 'sangria' | 'suprimento'
  const [valorMov, setValorMov] = useState('')
  const [motivoMov, setMotivoMov] = useState('')
  const [modalFechar, setModalFechar] = useState(false)
  const [valorContado, setValorContado] = useState('')
  const [historicoAberto, setHistoricoAberto] = useState(false)

  // vendas em dinheiro desde abertura do caixa
  const vendasCaixa = caixaAtual
    ? vendas.filter(v => v.pagamento === 'dinheiro' && v.data >= caixaAtual.abertura)
    : []
  const totalDinheiro = vendasCaixa.reduce((acc, v) => acc + v.total, 0)

  const totalSuprimentos = (caixaAtual?.movimentacoes || [])
    .filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0)
  const totalSangrias = (caixaAtual?.movimentacoes || [])
    .filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + m.valor, 0)

  const saldoEsperado = (caixaAtual?.valorInicial || 0) + totalDinheiro + totalSuprimentos - totalSangrias

  function handleAbrir() {
    if (!valorAbertura && valorAbertura !== '0') return
    abrirCaixa(valorAbertura)
    setValorAbertura('')
  }

  function handleMovimentacao() {
    const v = parseFloat(valorMov.replace(',', '.'))
    if (!v || v <= 0) return
    adicionarMovimentacaoCaixa(modalMov, v, motivoMov)
    setModalMov(null); setValorMov(''); setMotivoMov('')
  }

  function handleFechar() {
    const v = parseFloat(valorContado.replace(',', '.'))
    if (isNaN(v)) return
    fecharCaixa(v)
    setModalFechar(false); setValorContado('')
  }

  const diferenca = parseFloat(valorContado.replace(',', '.')) - saldoEsperado

  // ── Caixa fechado ──────────────────────────────────────────
  if (!caixaAtual) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Vault size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Caixa Fechado</h2>
          <p className="text-gray-400 text-sm mb-6">Informe o valor inicial para abrir o caixa</p>

          <label className="block text-sm font-medium text-gray-600 mb-2 text-left">Fundo de troco (valor inicial)</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorAbertura}
              onChange={e => setValorAbertura(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAbrir()}
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-green-500"
              autoFocus
            />
          </div>
          <button
            onClick={handleAbrir}
            disabled={valorAbertura === ''}
            className="w-full bg-green-600 text-white rounded-xl py-3 font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-40"
          >
            Abrir Caixa
          </button>
        </div>

        {historicosCaixa.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setHistoricoAberto(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>Histórico de caixas ({historicosCaixa.length})</span>
              {historicoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {historicoAberto && (
              <div className="divide-y">
                {historicosCaixa.slice(0, 10).map(c => {
                  const vendasC = vendas.filter(v => v.pagamento === 'dinheiro' && v.data >= c.abertura && v.data <= c.fechamento)
                  const totalD = vendasC.reduce((a, v) => a + v.total, 0)
                  const supC = c.movimentacoes.filter(m => m.tipo === 'suprimento').reduce((a, m) => a + m.valor, 0)
                  const sanC = c.movimentacoes.filter(m => m.tipo === 'sangria').reduce((a, m) => a + m.valor, 0)
                  const esperado = c.valorInicial + totalD + supC - sanC
                  const dif = c.valorContado - esperado
                  return (
                    <div key={c.id} className="px-5 py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{fmtData(c.abertura)}</p>
                          <p className="text-xs text-gray-400">Fechado às {fmtHora(c.fechamento)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{fmt(c.valorContado)}</p>
                          <p className={`text-xs font-semibold ${dif >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {dif >= 0 ? '+' : ''}{fmt(dif)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Caixa aberto ──────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      {/* Status */}
      <div className="bg-green-600 text-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
            <span className="font-bold text-lg">Caixa Aberto</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-200 text-sm">
            <Clock size={14} />
            <span>desde {fmtHora(caixaAtual.abertura)}</span>
          </div>
        </div>
        <p className="text-green-100 text-sm">Fundo inicial: {fmt(caixaAtual.valorInicial)}</p>
      </div>

      {/* Resumo financeiro */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resumo do caixa</p>
        </div>
        <div className="divide-y">
          <Row label="Fundo inicial" value={caixaAtual.valorInicial} icon={<DollarSign size={15} className="text-gray-400" />} />
          <Row label={`Vendas em dinheiro (${vendasCaixa.length})`} value={totalDinheiro} icon={<TrendingUp size={15} className="text-green-500" />} color="text-green-700" />
          {totalSuprimentos > 0 && <Row label="Suprimentos" value={totalSuprimentos} icon={<Plus size={15} className="text-blue-500" />} color="text-blue-700" />}
          {totalSangrias > 0 && <Row label="Sangrias" value={-totalSangrias} icon={<Minus size={15} className="text-orange-500" />} color="text-orange-700" />}
        </div>
        <div className="px-5 py-4 bg-green-50 flex items-center justify-between">
          <span className="font-bold text-gray-700">Saldo esperado</span>
          <span className="text-2xl font-bold text-green-700">{fmt(saldoEsperado)}</span>
        </div>
      </div>

      {/* Movimentações */}
      {caixaAtual.movimentacoes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b bg-gray-50">Movimentações</p>
          <div className="divide-y">
            {caixaAtual.movimentacoes.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.tipo === 'sangria' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    {m.tipo === 'sangria' ? <TrendingDown size={15} className="text-orange-500" /> : <TrendingUp size={15} className="text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize text-gray-700">{m.tipo}</p>
                    {m.motivo && <p className="text-xs text-gray-400">{m.motivo}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${m.tipo === 'sangria' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {m.tipo === 'sangria' ? '-' : '+'}{fmt(m.valor)}
                  </p>
                  <p className="text-xs text-gray-400">{fmtHora(m.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalMov('suprimento')}
          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl py-3 font-semibold hover:bg-blue-100 transition-colors"
        >
          <Plus size={18} /> Suprimento
        </button>
        <button
          onClick={() => setModalMov('sangria')}
          className="flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border-2 border-orange-200 rounded-xl py-3 font-semibold hover:bg-orange-100 transition-colors"
        >
          <Minus size={18} /> Sangria
        </button>
      </div>
      <button
        onClick={() => setModalFechar(true)}
        className="w-full bg-green-700 text-white rounded-xl py-3.5 font-bold text-lg hover:bg-green-800 transition-colors"
      >
        Fechar Caixa
      </button>

      {/* Modal sangria/suprimento */}
      {modalMov && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 capitalize">{modalMov}</h3>
              <button onClick={() => { setModalMov(null); setValorMov(''); setMotivoMov('') }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Valor</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
              <input
                type="number" min="0.01" step="0.01"
                value={valorMov} onChange={e => setValorMov(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-lg"
                autoFocus
              />
            </div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Motivo (opcional)</label>
            <input
              type="text" value={motivoMov} onChange={e => setMotivoMov(e.target.value)}
              placeholder={modalMov === 'sangria' ? 'Ex: pagar fornecedor' : 'Ex: reforço de troco'}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl mb-5 focus:outline-none focus:border-green-500 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleMovimentacao()}
            />
            <button
              onClick={handleMovimentacao}
              disabled={!valorMov}
              className={`w-full py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-40 ${modalMov === 'sangria' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              Confirmar {modalMov}
            </button>
          </div>
        </div>
      )}

      {/* Modal fechar caixa */}
      {modalFechar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Fechar Caixa</h3>
              <button onClick={() => { setModalFechar(false); setValorContado('') }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo esperado</span>
                <span className="font-semibold">{fmt(saldoEsperado)}</span>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-600 mb-1">Valor contado em caixa</label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
              <input
                type="number" min="0" step="0.01"
                value={valorContado} onChange={e => setValorContado(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-lg"
                autoFocus
              />
            </div>

            {valorContado !== '' && !isNaN(diferenca) && (
              <div className={`rounded-xl p-3 mb-4 text-center ${diferenca >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Diferença</p>
                <p className={`text-xl font-bold ${diferenca >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {diferenca >= 0 ? '+' : ''}{fmt(diferenca)}
                </p>
                <p className="text-xs text-gray-400">{diferenca >= 0 ? 'Sobra de caixa' : 'Falta de caixa'}</p>
              </div>
            )}

            <button
              onClick={handleFechar}
              disabled={valorContado === ''}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Confirmar Fechamento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, icon, color = 'text-gray-700' }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold ${color}`}>{`R$ ${Math.abs(value).toFixed(2)}`}</span>
    </div>
  )
}
