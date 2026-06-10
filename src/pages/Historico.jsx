import { useState } from 'react'
import { Calendar, Banknote, CreditCard, QrCode, ChevronDown, ChevronUp, Receipt } from 'lucide-react'
import { useApp } from '../context/AppContext'

const FORMA_ICON = { dinheiro: Banknote, cartao: CreditCard, cartao_debito: CreditCard, cartao_credito: CreditCard, pix: QrCode }
const FORMA_COR = { dinheiro: 'text-yellow-600 bg-yellow-50', cartao: 'text-blue-600 bg-blue-50', cartao_debito: 'text-blue-600 bg-blue-50', cartao_credito: 'text-indigo-600 bg-indigo-50', pix: 'text-green-600 bg-green-50' }
const FORMA_LABEL = { dinheiro: 'Dinheiro', cartao: 'Cartão', cartao_debito: 'Cartão Débito', cartao_credito: 'Cartão Crédito', pix: 'Pix' }

export default function Historico() {
  const { vendas } = useApp()
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().split('T')[0])
  const [expandida, setExpandida] = useState(null)

  const vendasFiltradas = vendas.filter(v => {
    const data = new Date(v.data).toISOString().split('T')[0]
    return data === dataFiltro
  })

  const totalDia = vendasFiltradas.reduce((acc, v) => acc + v.total, 0)

  const totaisPorForma = vendasFiltradas.reduce((acc, v) => {
    acc[v.pagamento] = (acc[v.pagamento] || 0) + v.total
    return acc
  }, {})

  function formatarHora(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Vendas</h1>
          <p className="text-sm text-gray-500">{vendasFiltradas.length} venda(s) no dia selecionado</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="date"
            value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-1">
          <p className="text-xs text-gray-500 mb-1">Total do dia</p>
          <p className="text-2xl font-bold text-green-700">R$ {totalDia.toFixed(2)}</p>
        </div>
        {Object.entries(totaisPorForma).map(([forma, valor]) => {
          const Icon = FORMA_ICON[forma] || Banknote
          return (
            <div key={forma} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mb-2 ${FORMA_COR[forma]}`}>
                <Icon size={12} />
                {FORMA_LABEL[forma]}
              </div>
              <p className="text-xl font-bold text-gray-800">R$ {valor.toFixed(2)}</p>
            </div>
          )
        })}
      </div>

      {/* Lista de vendas */}
      {vendasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm border border-gray-100">
          <Receipt size={48} className="mx-auto mb-3" />
          <p className="font-medium">Nenhuma venda neste dia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendasFiltradas.map((venda, idx) => {
            const Icon = FORMA_ICON[venda.pagamento] || Banknote
            const aberta = expandida === venda.id
            return (
              <div key={venda.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandida(aberta ? null : venda.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold text-sm">
                      #{vendasFiltradas.length - idx}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{formatarHora(venda.data)}</p>
                      <p className="text-xs text-gray-500">{venda.itens.length} item(ns)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${FORMA_COR[venda.pagamento]}`}>
                      <Icon size={12} />
                      {FORMA_LABEL[venda.pagamento]}
                    </div>
                    <span className="font-bold text-green-700 text-lg">R$ {venda.total.toFixed(2)}</span>
                    {aberta ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {aberta && (
                  <div className="border-t bg-gray-50 px-4 py-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b pb-1">
                          <th className="text-left py-1 font-medium">Produto</th>
                          <th className="text-right py-1 font-medium">Qtd</th>
                          <th className="text-right py-1 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venda.itens.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5 text-gray-700">{item.nome}</td>
                            <td className="py-1.5 text-right text-gray-500">
                              {item.tipo === 'peso' ? item.unidadeLabel : `${item.quantidade}×`}
                            </td>
                            <td className="py-1.5 text-right font-semibold text-gray-800">R$ {item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {venda.pagamento === 'dinheiro' && venda.troco > 0 && (
                      <p className="text-right text-sm text-yellow-600 mt-2 font-medium">
                        Troco: R$ {venda.troco.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
