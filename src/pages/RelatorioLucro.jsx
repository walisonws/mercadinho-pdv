import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Package, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0'

function periodoLabel(p) {
  if (p === 'hoje') return 'Hoje'
  if (p === 'semana') return 'Últimos 7 dias'
  if (p === 'mes') return 'Este mês'
  return 'Total'
}

function vendasDoPeriodo(vendas, periodo) {
  const agora = new Date()
  return vendas.filter(v => {
    const d = new Date(v.data)
    if (periodo === 'hoje') return d.toDateString() === agora.toDateString()
    if (periodo === 'semana') {
      const limite = new Date(agora); limite.setDate(agora.getDate() - 7)
      return d >= limite
    }
    if (periodo === 'mes') return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
    return true
  })
}

export default function RelatorioLucro() {
  const { vendas, produtos } = useApp()
  const [periodo, setPeriodo] = useState('mes')
  const [expandido, setExpandido] = useState(null)

  const semCusto = useMemo(() => produtos.filter(p => p.ativo && (!p.custoCompra || p.custoCompra === 0)), [produtos])

  const stats = useMemo(() => {
    const vs = vendasDoPeriodo(vendas, periodo)
    let faturamento = 0, custo = 0, itensSemCusto = 0

    const porProduto = {}

    vs.forEach(venda => {
      faturamento += venda.total
      venda.itens.forEach(item => {
        const prod = produtos.find(p => p.id === item.produtoId)
        const custoUnit = prod?.custoCompra || 0
        const subtotal = item.subtotal || (item.preco * (item.quantidade || item.peso || 0))
        const custoItem = custoUnit * (item.quantidade || item.peso || 0)
        custo += custoItem
        if (!custoUnit) itensSemCusto++

        if (!porProduto[item.produtoId]) {
          porProduto[item.produtoId] = {
            id: item.produtoId,
            nome: item.nome,
            faturamento: 0, custo: 0, qtd: 0,
            temCusto: !!custoUnit,
          }
        }
        porProduto[item.produtoId].faturamento += subtotal
        porProduto[item.produtoId].custo += custoItem
        porProduto[item.produtoId].qtd += item.quantidade || item.peso || 0
      })
    })

    const lucro = faturamento - custo
    const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0
    const ranking = Object.values(porProduto).sort((a, b) => (b.faturamento - b.custo) - (a.faturamento - a.custo))

    return { faturamento, custo, lucro, margem, ranking, itensSemCusto, totalVendas: vs.length }
  }, [vendas, produtos, periodo])

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Relatório de Lucro</h1>
            <p className="text-sm text-gray-500">Faturamento × Custo de compra</p>
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['hoje', 'semana', 'mes', 'total'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${periodo === p ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {periodoLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Aviso sem custo */}
      {semCusto.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">{semCusto.length} produto{semCusto.length > 1 ? 's' : ''} sem custo de compra cadastrado</p>
            <p className="text-amber-700 mt-0.5">O lucro pode estar subestimado. Cadastre o custo em <strong>Produtos → Editar</strong>.</p>
          </div>
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Faturamento</p>
          <p className="text-xl font-bold text-gray-800">{fmt(stats.faturamento)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalVendas} venda{stats.totalVendas !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Custo de compra</p>
          <p className="text-xl font-bold text-red-600">{fmt(stats.custo)}</p>
          <p className="text-xs text-gray-400 mt-1">{pct(stats.custo, stats.faturamento)}% do faturamento</p>
        </div>
        <div className={`rounded-2xl shadow-sm border p-4 ${stats.lucro >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 mb-1">Lucro bruto</p>
          <p className={`text-xl font-bold ${stats.lucro >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(stats.lucro)}</p>
          <div className="flex items-center gap-1 mt-1">
            {stats.lucro >= 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
            <p className="text-xs text-gray-500">Margem {stats.margem.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Margem média</p>
          <p className={`text-xl font-bold ${stats.margem >= 20 ? 'text-emerald-600' : stats.margem >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {stats.margem.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{stats.margem >= 20 ? 'Saudável' : stats.margem >= 10 ? 'Atenção' : 'Baixa'}</p>
        </div>
      </div>

      {/* Ranking por produto */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-800">Lucro por produto — {periodoLabel(periodo)}</h2>
        </div>

        {stats.ranking.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma venda neste período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.ranking.map((p, i) => {
              const lucro = p.faturamento - p.custo
              const margem = p.faturamento > 0 ? (lucro / p.faturamento) * 100 : 0
              const isExp = expandido === p.id

              return (
                <div key={p.id}>
                  <button
                    onClick={() => setExpandido(isExp ? null : p.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xs text-gray-400 w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">Fat. {fmt(p.faturamento)}</span>
                        {p.temCusto ? (
                          <span className={`text-xs font-medium ${margem >= 20 ? 'text-emerald-600' : margem >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                            Margem {margem.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">sem custo</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(lucro)}</p>
                      <p className="text-xs text-gray-400">lucro</p>
                    </div>
                    {isExp ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </button>

                  {isExp && (
                    <div className="bg-gray-50 px-5 py-3 text-sm grid grid-cols-3 gap-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Faturamento</p>
                        <p className="font-semibold text-gray-800">{fmt(p.faturamento)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Custo total</p>
                        <p className="font-semibold text-red-600">{fmt(p.custo)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Qtd. vendida</p>
                        <p className="font-semibold text-gray-800">{p.qtd.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
