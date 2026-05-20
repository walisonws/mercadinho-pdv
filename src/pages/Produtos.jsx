import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Scale, Tag, Filter, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ModalProduto from '../components/ModalProduto'

const CATEGORIAS_EMOJI = {
  mercearia: '🛒', bebidas: '🥤', frutas: '🍎', verduras: '🥦',
  carnes: '🥩', frios: '🧀', limpeza: '🧹', higiene: '🧴', outros: '📦',
}

const CATEGORIAS = ['todas', 'mercearia', 'bebidas', 'frutas', 'verduras', 'carnes', 'frios', 'limpeza', 'higiene', 'outros']

export default function Produtos() {
  const { produtos, adicionarProduto, editarProduto, excluirProduto } = useApp()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState(null)

  const filtrados = produtos.filter(p => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.includes(busca)
    const categoriaOk = categoria === 'todas' || p.categoria === categoria
    return buscaOk && categoriaOk
  })

  function handleSalvar(dados) {
    if (produtoEditando) {
      editarProduto(produtoEditando.id, dados)
    } else {
      adicionarProduto(dados)
    }
    setModalAberto(false)
    setProdutoEditando(null)
  }

  function handleEditar(produto) {
    setProdutoEditando(produto)
    setModalAberto(true)
  }

  function handleExcluir(id) {
    excluirProduto(id)
    setConfirmarExclusao(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-sm text-gray-500">{produtos.length} produto(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => { setProdutoEditando(null); setModalAberto(true) }}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou código..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  categoria === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c === 'todas' ? 'Todas' : `${CATEGORIAS_EMOJI[c]} ${c}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de produtos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Tag size={48} className="mx-auto mb-3" />
            <p className="font-medium">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Tente outro filtro ou cadastre um novo produto</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CATEGORIAS_EMOJI[p.categoria] || '📦'}</span>
                      <span className="font-medium text-gray-800">{p.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{p.codigo}</code>
                  </td>
                  <td className="px-4 py-3">
                    {p.tipo === 'peso' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 w-fit px-2 py-1 rounded-full">
                        <Scale size={12} /> Por peso
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                        Por unidade
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-700">
                      R$ {p.preco.toFixed(2)}{p.tipo === 'peso' ? '/kg' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit">
                        <AlertTriangle size={11} /> {p.estoque} — baixo
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700 font-medium">{p.estoque ?? 0}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-sm text-gray-600">{p.categoria}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditar(p)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmarExclusao(p.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal cadastro/edição */}
      {modalAberto && (
        <ModalProduto
          produto={produtoEditando}
          onSalvar={handleSalvar}
          onFechar={() => { setModalAberto(false); setProdutoEditando(null) }}
        />
      )}

      {/* Confirmar exclusão */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir produto?</h3>
            <p className="text-gray-600 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarExclusao(null)}
                className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExcluir(confirmarExclusao)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-bold hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
