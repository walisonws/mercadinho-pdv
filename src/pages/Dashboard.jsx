import { useState } from 'react'
import { TrendingUp, ShoppingBag, Banknote, CreditCard, QrCode, Package, BarChart2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'

const FORMA_COR = {
  dinheiro: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Banknote },
  cartao: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CreditCard },
  cartao_debito: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CreditCard },
  cartao_credito: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: CreditCard },
  pix: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: QrCode },
}

const FORMA_LABEL = {
  dinheiro: 'Dinheiro', cartao: 'Cartão', cartao_debito: 'Cartão Débito', cartao_credito: 'Cartão Crédito', pix: 'Pix',
}

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Dashboard() {
  const { vendasHoje, totalHoje, vendas, produtos } = useApp()
  const [expandirVendidos, setExpandirVendidos] = useState(false)

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const totaisPorForma = vendasHoje.reduce((acc, v) => {
    acc[v.pagamento] = (acc[v.pagamento] || 0) + v.total
    return acc
  }, {})

  // Produtos mais vendidos hoje
  const contagem = {}
  vendasHoje.forEach(v => {
    v.itens.forEach(item => {
      if (!contagem[item.nome]) contagem[item.nome] = { nome: item.nome, total: 0, qtd: 0, produtoId: item.produtoId }
      contagem[item.nome].total += item.subtotal || (item.preco * (item.quantidade || 1))
      contagem[item.nome].qtd += item.tipo === 'peso' ? (item.peso || 0) : (item.quantidade || 1)
    })
  })
  const maisVendidos = Object.values(contagem).sort((a, b) => b.total - a.total)
  const maisVendidosVisiveis = expandirVendidos ? maisVendidos : maisVendidos.slice(0, 5)

  // Por operador hoje
  const porOperador = {}
  vendasHoje.forEach(v => {
    const nome = v.operadorNome || 'Sem operador'
    if (!porOperador[nome]) porOperador[nome] = { nome, total: 0, qtd: 0 }
    porOperador[nome].total += v.total
    porOperador[nome].qtd++
  })
  const rankOperadores = Object.values(porOperador).sort((a, b) => b.total - a.total)

  // Vendas dos últimos 7 dias
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
    const total = vendas
      .filter(v => new Date(v.data).toDateString() === d.toDateString())
      .reduce((acc, v) => acc + v.total, 0)
    return { label, total }
  })

  const maxUlt7 = Math.max(...ultimos7.map(d => d.total), 1)
  const ticketMedio = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 capitalize">{hoje}</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Faturamento hoje</p>
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{fmt(totalHoje)}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Vendas hoje</p>
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={15} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700">{vendasHoje.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Ticket médio</p>
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700">{fmt(ticketMedio)}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Produtos</p>
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package size={15} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-700">{produtos.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Formas de pagamento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Pagamentos hoje</h3>
          {Object.keys(totaisPorForma).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda hoje</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(totaisPorForma).map(([forma, valor]) => {
                const { bg, text, border, icon: Icon } = FORMA_COR[forma] || FORMA_COR.dinheiro
                const pct = totalHoje > 0 ? (valor / totalHoje) * 100 : 0
                return (
                  <div key={forma}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${bg} ${text} border ${border}`}>
                        <Icon size={12} />
                        {FORMA_LABEL[forma] || forma}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{fmt(valor)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mais vendidos hoje */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Mais vendidos hoje</h3>
            <span className="text-xs text-gray-400">{maisVendidos.length} produtos</span>
          </div>
          {maisVendidos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda hoje</p>
          ) : (
            <>
              <div className="space-y-2">
                {maisVendidosVisiveis.map((item, i) => (
                  <div key={item.nome} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.nome}</p>
                      <p className="text-xs text-gray-400">{item.qtd % 1 === 0 ? item.qtd : item.qtd.toFixed(2)} vendido(s)</p>
                    </div>
                    <span className="text-sm font-bold text-green-700 shrink-0">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
              {maisVendidos.length > 5 && (
                <button
                  onClick={() => setExpandirVendidos(v => !v)}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  {expandirVendidos ? <><ChevronUp size={13} /> Menos</> : <><ChevronDown size={13} /> Ver todos ({maisVendidos.length})</>}
                </button>
              )}
            </>
          )}
        </div>

        {/* Gráfico últimos 7 dias */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Últimos 7 dias</h3>
          <div className="flex items-end gap-1.5 h-28">
            {ultimos7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500 rounded-t-sm transition-all"
                  style={{ height: `${(d.total / maxUlt7) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                  title={fmt(d.total)}
                />
                <p className="text-[9px] text-gray-400 text-center leading-tight">{d.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-gray-400 text-right">
              Total 7d: <span className="font-bold text-gray-700">{fmt(ultimos7.reduce((a, d) => a + d.total, 0))}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Por operador hoje */}
      {rankOperadores.length > 0 && rankOperadores.some(o => o.nome !== 'Sem operador') && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-700 text-sm">Por operador — hoje</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rankOperadores.map(op => (
              <div key={op.nome} className="bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-sm mb-2">
                  {op.nome.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-gray-800 text-sm truncate">{op.nome}</p>
                <p className="text-xs text-gray-500">{op.qtd} venda{op.qtd !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold text-green-600 mt-1">{fmt(op.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
