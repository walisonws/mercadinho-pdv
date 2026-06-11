import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaxi } from '../../context/TaxiContext'
import { formatarMoeda } from '../../utils/extenso'
import { Search, Printer, Trash2, ClipboardList, X } from 'lucide-react'

export default function TaxiHistorico() {
  const navigate = useNavigate()
  const { recibos, excluirRecibo, stats } = useTaxi()
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtrados = useMemo(() => {
    if (!busca.trim()) return recibos
    const q = busca.toLowerCase()
    return recibos.filter(
      r =>
        r.cliente?.toLowerCase().includes(q) ||
        String(r.numero).includes(q) ||
        r.referente?.toLowerCase().includes(q) ||
        r.data?.includes(q)
    )
  }, [recibos, busca])

  function handleDelete(id) {
    if (confirmDelete === id) {
      excluirRecibo(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="font-bold text-gray-900 text-xl mb-3">Histórico</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por cliente, número, data..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Resumo */}
        {!busca && recibos.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-violet-600">Total de recibos</p>
              <p className="text-xl font-bold text-violet-900">{stats.totalRecibos}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-violet-600">Total ganho</p>
              <p className="text-xl font-bold text-violet-900">{formatarMoeda(stats.totalGanhos)}</p>
            </div>
          </div>
        )}

        {busca && (
          <p className="text-xs text-gray-500 px-1">
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para "{busca}"
          </p>
        )}

        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={52} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {busca ? 'Nenhum resultado.' : 'Nenhum recibo ainda.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filtrados.map(r => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  confirmDelete === r.id ? 'border-red-300' : 'border-gray-100'
                }`}
              >
                <button
                  onClick={() => navigate(`/taxi/recibo/${r.id}`)}
                  className="w-full px-4 py-4 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">{r.cliente}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Recibo Nº {r.numero}&nbsp;·&nbsp;
                        {r.data?.split('-').reverse().join('/')}
                      </p>
                      {r.referente !== 'Serviço de táxi' && (
                        <p className="text-xs text-gray-400 truncate">{r.referente}</p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 shrink-0 text-sm">
                      {formatarMoeda(r.valor)}
                    </span>
                  </div>
                </button>

                <div className="border-t border-gray-100 flex">
                  <button
                    onClick={() => navigate(`/taxi/recibo/${r.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-yellow-600 font-semibold active:bg-yellow-50 transition-colors"
                  >
                    <Printer size={14} />
                    Imprimir
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => handleDelete(r.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                      confirmDelete === r.id
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-400 active:bg-red-50 active:text-red-500'
                    }`}
                  >
                    <Trash2 size={14} />
                    {confirmDelete === r.id ? 'Confirmar exclusão' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
