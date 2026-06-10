import { useState } from 'react'
import { Vault, Plus, Minus, X, Clock, TrendingUp, TrendingDown, DollarSign, CheckCircle, ChevronDown, ChevronUp, Banknote, CreditCard, QrCode, ShoppingBag, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'

function fmt(v) { return `R$ ${Number(v || 0).toFixed(2)}` }
function fmtHora(iso) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function fmtData(iso) { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
function duracao(abertura, fechamento) {
  const ms = new Date(fechamento || Date.now()) - new Date(abertura)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export default function Caixa() {
  const { caixaAtual, historicosCaixa, vendas, abrirCaixa, fecharCaixa, adicionarMovimentacaoCaixa } = useApp()

  const [valorAbertura, setValorAbertura] = useState('0')
  const [modalMov, setModalMov] = useState(null)
  const [valorMov, setValorMov] = useState('')
  const [motivoMov, setMotivoMov] = useState('')
  const [modalFechar, setModalFechar] = useState(false)
  const [valorContado, setValorContado] = useState('')
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)

  // Vendas desde abertura do caixa
  const vendasCaixa = caixaAtual
    ? vendas.filter(v => v.data >= caixaAtual.abertura)
    : []

  const vendasPorForma = vendasCaixa.reduce((acc, v) => {
    acc[v.pagamento] = (acc[v.pagamento] || 0) + v.total
    return acc
  }, {})

  const totalGeralCaixa = vendasCaixa.reduce((acc, v) => acc + v.total, 0)
  const totalDinheiro = vendasPorForma['dinheiro'] || 0

  const totalSuprimentos = (caixaAtual?.movimentacoes || [])
    .filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0)
  const totalSangrias = (caixaAtual?.movimentacoes || [])
    .filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + m.valor, 0)

  const saldoDinheiro = (caixaAtual?.valorInicial || 0) + totalDinheiro + totalSuprimentos - totalSangrias

  function handleAbrir() {
    abrirCaixa(valorAbertura)
    setValorAbertura('0')
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

  const diferenca = parseFloat(valorContado.replace(',', '.')) - saldoDinheiro

  const FORMA = {
    dinheiro: { label: 'Dinheiro', icon: Banknote, cor: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    cartao: { label: 'Cartão', icon: CreditCard, cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    cartao_debito: { label: 'Cartão Débito', icon: CreditCard, cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    cartao_credito: { label: 'Cartão Crédito', icon: CreditCard, cor: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    pix: { label: 'Pix', icon: QrCode, cor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  }

  // ── Caixa FECHADO ─────────────────────────────────────────
  if (!caixaAtual) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        {/* O que é o caixa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                <Vault size={24} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Controle de Caixa</h1>
                <p className="text-sm text-gray-500">Caixa fechado no momento</p>
              </div>
            </div>
            <button onClick={() => setMostrarInfo(v => !v)} className="text-gray-400 hover:text-gray-600 p-1">
              <Info size={18} />
            </button>
          </div>

          {mostrarInfo && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">Para que serve o Caixa?</p>
              <ul className="space-y-1.5 text-blue-700">
                <li>💵 <strong>Abrir caixa:</strong> informe o dinheiro que está na gaveta no início do turno (fundo de troco)</li>
                <li>📈 <strong>Suprimento:</strong> registre quando você <em>coloca</em> dinheiro extra na gaveta</li>
                <li>📉 <strong>Sangria:</strong> registre quando você <em>retira</em> dinheiro da gaveta (ex: pagar fornecedor)</li>
                <li>🔒 <strong>Fechar caixa:</strong> conte o dinheiro físico e compare com o esperado pelo sistema</li>
              </ul>
              <p className="text-xs text-blue-500 mt-1">Cartão e Pix são rastreados automaticamente — o controle de gaveta é só para dinheiro em espécie.</p>
            </div>
          )}

          {/* Cards explicativos */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Fundo</p>
              <p className="text-xs text-gray-400 mt-0.5">Valor inicial na gaveta</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                <Plus size={16} className="text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Suprimento</p>
              <p className="text-xs text-gray-400 mt-0.5">Entra dinheiro extra</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                <Minus size={16} className="text-orange-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Sangria</p>
              <p className="text-xs text-gray-400 mt-0.5">Retira dinheiro</p>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Quanto tem na gaveta agora? <span className="font-normal text-gray-400">(fundo de troco)</span>
          </label>
          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorAbertura}
              onChange={e => setValorAbertura(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAbrir()}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-green-500"
              autoFocus
            />
          </div>
          <button
            onClick={handleAbrir}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Vault size={20} />
            Abrir Caixa
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Pode colocar 0 se não tem troco inicial</p>
        </div>

        {/* Histórico de caixas */}
        {historicosCaixa.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setHistoricoAberto(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                Caixas anteriores ({historicosCaixa.length})
              </span>
              {historicoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {historicoAberto && (
              <div className="divide-y">
                {historicosCaixa.slice(0, 10).map(c => {
                  const vendasC = vendas.filter(v => v.data >= c.abertura && v.data <= c.fechamento)
                  const faturamentoC = vendasC.reduce((a, v) => a + v.total, 0)
                  const dinheiroC = vendasC.filter(v => v.pagamento === 'dinheiro').reduce((a, v) => a + v.total, 0)
                  const supC = c.movimentacoes.filter(m => m.tipo === 'suprimento').reduce((a, m) => a + m.valor, 0)
                  const sanC = c.movimentacoes.filter(m => m.tipo === 'sangria').reduce((a, m) => a + m.valor, 0)
                  const esperado = c.valorInicial + dinheiroC + supC - sanC
                  const dif = c.valorContado - esperado
                  return (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{fmtData(c.abertura)}</p>
                          <p className="text-xs text-gray-400">Fechado {fmtHora(c.fechamento)} · duração {duracao(c.abertura, c.fechamento)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{fmt(c.valorContado)}</p>
                          <p className={`text-xs font-semibold ${Math.abs(dif) < 0.01 ? 'text-gray-400' : dif >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {Math.abs(dif) < 0.01 ? 'Sem diferença' : `${dif >= 0 ? '+' : ''}${fmt(dif)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><ShoppingBag size={11} /> {vendasC.length} vendas</span>
                        <span className="flex items-center gap-1"><TrendingUp size={11} className="text-green-500" /> {fmt(faturamentoC)}</span>
                        {c.movimentacoes.length > 0 && <span>{c.movimentacoes.length} movimentação(ões)</span>}
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

  // ── Caixa ABERTO ──────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-20">
      {/* Cabeçalho status */}
      <div className="bg-green-600 text-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
            <span className="font-bold text-lg">Caixa Aberto</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-200 text-sm">
            <Clock size={14} />
            <span>aberto às {fmtHora(caixaAtual.abertura)} · {duracao(caixaAtual.abertura)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-green-100 text-xs mb-0.5">Fundo inicial</p>
            <p className="font-bold text-white">{fmt(caixaAtual.valorInicial)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-green-100 text-xs mb-0.5">Vendas</p>
            <p className="font-bold text-white">{vendasCaixa.length}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-green-100 text-xs mb-0.5">Faturamento total</p>
            <p className="font-bold text-white text-lg">{fmt(totalGeralCaixa)}</p>
          </div>
        </div>
      </div>

      {/* Faturamento por forma de pagamento */}
      {Object.keys(vendasPorForma).length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Faturamento por forma de pagamento</p>
          <div className="space-y-2.5">
            {Object.entries(vendasPorForma).map(([forma, valor]) => {
              const { label, icon: Icon, cor, bg, border } = FORMA[forma] || FORMA.dinheiro
              const pct = totalGeralCaixa > 0 ? (valor / totalGeralCaixa) * 100 : 0
              return (
                <div key={forma}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${bg} ${cor} border ${border}`}>
                      <Icon size={13} />
                      {label}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-800">{fmt(valor)}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-400">
          <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma venda registrada neste caixa ainda</p>
          <p className="text-xs mt-1">As vendas feitas no PDV aparecem aqui automaticamente</p>
        </div>
      )}

      {/* Controle do dinheiro na gaveta */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Gaveta de dinheiro</p>
          <p className="text-xs text-gray-400">Controle do dinheiro físico em espécie</p>
        </div>
        <div className="divide-y">
          <Row label="Fundo inicial" value={caixaAtual.valorInicial} icon={<DollarSign size={15} className="text-gray-400" />} />
          <Row label={`Vendas em dinheiro (${vendasCaixa.filter(v => v.pagamento === 'dinheiro').length})`} value={totalDinheiro} icon={<TrendingUp size={15} className="text-green-500" />} color="text-green-700" />
          {totalSuprimentos > 0 && <Row label="+ Suprimentos" value={totalSuprimentos} icon={<Plus size={15} className="text-blue-500" />} color="text-blue-700" />}
          {totalSangrias > 0 && <Row label="− Sangrias" value={totalSangrias} icon={<Minus size={15} className="text-orange-500" />} color="text-orange-700" negative />}
        </div>
        <div className="mx-4 mb-4 mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-semibold">Saldo esperado na gaveta</p>
            <p className="text-xs text-green-500">Dinheiro que deve estar fisicamente na gaveta</p>
          </div>
          <span className="text-2xl font-bold text-green-700">{fmt(saldoDinheiro)}</span>
        </div>
      </div>

      {/* Movimentações manuais */}
      {caixaAtual.movimentacoes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b bg-gray-50">
            Movimentações manuais ({caixaAtual.movimentacoes.length})
          </p>
          <div className="divide-y">
            {caixaAtual.movimentacoes.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.tipo === 'sangria' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    {m.tipo === 'sangria'
                      ? <TrendingDown size={16} className="text-orange-500" />
                      : <TrendingUp size={16} className="text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {m.tipo === 'sangria' ? 'Sangria' : 'Suprimento'}
                    </p>
                    <p className="text-xs text-gray-400">{m.motivo || 'Sem motivo'} · {fmtHora(m.data)}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${m.tipo === 'sangria' ? 'text-orange-600' : 'text-blue-600'}`}>
                  {m.tipo === 'sangria' ? '−' : '+'}{fmt(m.valor)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalMov('suprimento')}
          className="flex flex-col items-center gap-1.5 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-2xl py-4 font-semibold hover:bg-blue-100 transition-colors"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Plus size={20} className="text-blue-600" />
          </div>
          <span className="text-sm">Suprimento</span>
          <span className="text-xs text-blue-400 font-normal">Colocar dinheiro</span>
        </button>
        <button
          onClick={() => setModalMov('sangria')}
          className="flex flex-col items-center gap-1.5 bg-orange-50 text-orange-700 border-2 border-orange-200 rounded-2xl py-4 font-semibold hover:bg-orange-100 transition-colors"
        >
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Minus size={20} className="text-orange-600" />
          </div>
          <span className="text-sm">Sangria</span>
          <span className="text-xs text-orange-400 font-normal">Retirar dinheiro</span>
        </button>
      </div>

      <button
        onClick={() => setModalFechar(true)}
        className="w-full bg-gray-800 text-white rounded-2xl py-4 font-bold text-base hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle size={20} />
        Fechar Caixa
      </button>

      {/* Modal suprimento/sangria */}
      {modalMov && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modalMov === 'sangria' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                  {modalMov === 'sangria' ? <Minus size={18} className="text-orange-600" /> : <Plus size={18} className="text-blue-600" />}
                </div>
                <h3 className="text-lg font-bold text-gray-800 capitalize">{modalMov}</h3>
              </div>
              <button onClick={() => { setModalMov(null); setValorMov(''); setMotivoMov('') }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-11">
              {modalMov === 'sangria' ? 'Registre uma retirada de dinheiro da gaveta' : 'Registre uma adição de dinheiro à gaveta'}
            </p>
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
              placeholder={modalMov === 'sangria' ? 'Ex: pagar fornecedor, troco para fora' : 'Ex: reforço de troco'}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Fechar Caixa</h3>
              <button onClick={() => { setModalFechar(false); setValorContado('') }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Resumo do caixa */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-700 mb-2">Resumo do turno</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Faturamento total</span>
                <span className="font-bold text-green-700">{fmt(totalGeralCaixa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendas em dinheiro</span>
                <span className="font-semibold">{fmt(totalDinheiro)}</span>
              </div>
              {totalSuprimentos > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">+ Suprimentos</span>
                  <span className="font-semibold text-blue-600">{fmt(totalSuprimentos)}</span>
                </div>
              )}
              {totalSangrias > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">− Sangrias</span>
                  <span className="font-semibold text-orange-600">{fmt(totalSangrias)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-700">Saldo esperado (gaveta)</span>
                <span className="font-bold text-green-700">{fmt(saldoDinheiro)}</span>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Quanto você contou na gaveta?
            </label>
            <p className="text-xs text-gray-400 mb-2">Conte o dinheiro físico e informe aqui</p>
            <div className="relative mb-3">
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
              <div className={`rounded-xl p-3 mb-4 text-center ${Math.abs(diferenca) < 0.01 ? 'bg-green-50' : diferenca > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Diferença</p>
                <p className={`text-2xl font-bold ${Math.abs(diferenca) < 0.01 ? 'text-green-700' : diferenca > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  {Math.abs(diferenca) < 0.01 ? 'Certo!' : `${diferenca > 0 ? '+' : ''}${fmt(diferenca)}`}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.abs(diferenca) < 0.01 ? 'Caixa fechado sem diferença' : diferenca > 0 ? 'Sobra de caixa' : 'Falta de caixa'}
                </p>
              </div>
            )}

            <button
              onClick={handleFechar}
              disabled={valorContado === ''}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Confirmar Fechamento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, icon, color = 'text-gray-700', negative }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold ${color}`}>
        {negative ? '−' : ''}{`R$ ${Math.abs(value).toFixed(2)}`}
      </span>
    </div>
  )
}
