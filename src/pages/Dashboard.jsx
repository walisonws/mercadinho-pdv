import { TrendingUp, ShoppingBag, Banknote, CreditCard, QrCode, Package, BarChart2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const FORMA_COR = {
  dinheiro: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Banknote },
  cartao: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CreditCard },
  pix: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: QrCode },
}

export default function Dashboard() {
  const { vendasHoje, totalHoje, vendas, produtos } = useApp()

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const totaisPorForma = vendasHoje.reduce((acc, v) => {
    acc[v.pagamento] = (acc[v.pagamento] || 0) + v.total
    return acc
  }, {})

  // Produtos mais vendidos hoje
  const contagem = {}
  vendasHoje.forEach(v => {
    v.itens.forEach(item => {
      if (!contagem[item.nome]) contagem[item.nome] = { nome: item.nome, total: 0, qtd: 0 }
      contagem[item.nome].total += item.total
      contagem[item.nome].qtd += item.tipo === 'peso' ? 1 : item.quantidade
    })
  })
  const maisVendidos = Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 5)

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 capitalize">{hoje}</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Faturamento hoje</p>
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700">R$ {totalHoje.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Vendas hoje</p>
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700">{vendasHoje.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Ticket médio</p>
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart2 size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-700">R$ {ticketMedio.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Produtos</p>
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package size={18} className="text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-700">{produtos.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Formas de pagamento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Pagamentos hoje</h3>
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
                        {forma.charAt(0).toUpperCase() + forma.slice(1)}
                      </div>
                      <span className="text-sm font-bold text-gray-700">R$ {valor.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mais vendidos hoje */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Mais vendidos hoje</h3>
          {maisVendidos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda hoje</p>
          ) : (
            <div className="space-y-2">
              {maisVendidos.map((item, i) => (
                <div key={item.nome} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">{item.qtd} vendido(s)</p>
                  </div>
                  <span className="text-sm font-bold text-green-700">R$ {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico últimos 7 dias */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Últimos 7 dias</h3>
          <div className="flex items-end gap-2 h-28">
            {ultimos7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500 rounded-t-md transition-all"
                  style={{ height: `${(d.total / maxUlt7) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                />
                <p className="text-xs text-gray-400 text-center leading-tight">{d.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-gray-400 text-right">
              Total 7d: <span className="font-bold text-gray-700">R$ {ultimos7.reduce((a, d) => a + d.total, 0).toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
