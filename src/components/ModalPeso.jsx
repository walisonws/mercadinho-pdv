import { useState } from 'react'
import { Scale, X } from 'lucide-react'

export default function ModalPeso({ produto, onConfirmar, onFechar }) {
  const [gramas, setGramas] = useState('')

  const gramasNum = parseFloat(gramas) || 0
  const total = (gramasNum / 1000) * produto.preco

  function handleConfirmar() {
    if (gramasNum <= 0) return
    onConfirmar(gramasNum)
  }

  function handleTecla(e) {
    if (e.key === 'Enter') handleConfirmar()
    if (e.key === 'Escape') onFechar()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-green-700">
            <Scale size={22} />
            <h2 className="text-lg font-bold">Produto por Peso</h2>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-green-50 rounded-xl p-3 mb-4">
          <p className="font-semibold text-gray-800 text-base">{produto.nome}</p>
          <p className="text-sm text-green-700">R$ {produto.preco.toFixed(2)}/kg</p>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade em gramas (g)
        </label>
        <input
          type="number"
          autoFocus
          value={gramas}
          onChange={e => setGramas(e.target.value)}
          onKeyDown={handleTecla}
          placeholder="Ex: 500"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-green-500 mb-4"
        />

        {gramasNum > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-gray-500">{gramasNum}g → {(gramasNum / 1000).toFixed(3)}kg</p>
            <p className="text-2xl font-bold text-green-700">R$ {total.toFixed(2)}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={gramasNum <= 0}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
