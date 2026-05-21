import { useState } from 'react'
import { X, Search, Link2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

const CATEGORIAS_EMOJI = {
  mercearia: '🛒', bebidas: '🥤', frutas: '🍎', verduras: '🥦',
  carnes: '🥩', frios: '🧀', limpeza: '🧹', higiene: '🧴', outros: '📦',
}

export default function ModalVincularCodigo({ codigo, onVincular, onCadastrarNovo, onFechar }) {
  const { produtos, buscarPorNome } = useApp()
  const [busca, setBusca] = useState('')

  const lista = busca.length >= 2
    ? buscarPorNome(busca)
    : produtos.filter(p => p.ativo).slice(0, 10)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Código não encontrado</h2>
            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-0.5 inline-block">{codigo}</code>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Produto não cadastrado. Vincule a um produto existente — o código ficará salvo para próximas leituras.
        </p>

        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Vincular a produto existente</p>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            autoFocus
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1 mb-4">
          {lista.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Nenhum produto encontrado</p>
          ) : lista.map(p => (
            <button
              key={p.id}
              onClick={() => onVincular(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-400 hover:bg-green-50 text-left transition-all"
            >
              <span className="text-xl shrink-0">{CATEGORIAS_EMOJI[p.categoria] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{p.nome}</p>
                <p className="text-xs text-gray-400">R$ {p.preco.toFixed(2)} · Estoque: {p.estoque}</p>
              </div>
              <Link2 size={14} className="text-green-500 shrink-0" />
            </button>
          ))}
        </div>

        <div className="border-t pt-3">
          <button
            onClick={onCadastrarNovo}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl py-3 font-semibold hover:border-green-500 hover:text-green-600 transition-colors text-sm"
          >
            <Plus size={16} />
            Cadastrar como novo produto
          </button>
        </div>
      </div>
    </div>
  )
}
