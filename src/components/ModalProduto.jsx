import { useState } from 'react'
import { X, Package } from 'lucide-react'

const categorias = ['mercearia', 'bebidas', 'frutas', 'verduras', 'carnes', 'frios', 'limpeza', 'higiene', 'outros']

const vazio = { nome: '', codigo: '', tipo: 'unidade', preco: '', categoria: 'mercearia', estoque: '0', estoqueMinimo: '0' }

export default function ModalProduto({ produto, onSalvar, onFechar }) {
  const [form, setForm] = useState(produto ? {
    nome: produto.nome,
    codigo: produto.codigo,
    tipo: produto.tipo,
    preco: String(produto.preco),
    categoria: produto.categoria,
    estoque: String(produto.estoque ?? 0),
    estoqueMinimo: String(produto.estoqueMinimo ?? 0),
  } : vazio)

  const [erros, setErros] = useState({})

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setErros(prev => ({ ...prev, [campo]: '' }))
  }

  function validar() {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Nome obrigatório'
    if (!form.codigo.trim()) e.codigo = 'Código obrigatório'
    if (!form.preco || parseFloat(form.preco) <= 0) e.preco = 'Preço inválido'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    if (!validar()) return
    onSalvar({
      ...form,
      preco: parseFloat(form.preco),
      estoque: parseInt(form.estoque) || 0,
      estoqueMinimo: parseInt(form.estoqueMinimo) || 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-green-700">
            <Package size={22} />
            <h2 className="text-xl font-bold">{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto *</label>
            <input
              type="text"
              autoFocus
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Arroz 5kg"
              className={`w-full border-2 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 ${erros.nome ? 'border-red-400' : 'border-gray-200'}`}
            />
            {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras *</label>
            <input
              type="text"
              value={form.codigo}
              onChange={e => set('codigo', e.target.value)}
              placeholder="Escaneie ou digite o código"
              className={`w-full border-2 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 ${erros.codigo ? 'border-red-400' : 'border-gray-200'}`}
            />
            {erros.codigo && <p className="text-red-500 text-xs mt-1">{erros.codigo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de venda *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => set('tipo', 'unidade')}
                className={`py-3 rounded-xl border-2 font-semibold transition-all ${form.tipo === 'unidade' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}
              >
                Por unidade
              </button>
              <button
                onClick={() => set('tipo', 'peso')}
                className={`py-3 rounded-xl border-2 font-semibold transition-all ${form.tipo === 'peso' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}
              >
                Por peso (kg)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.tipo === 'peso' ? 'Preço por kg (R$) *' : 'Preço unitário (R$) *'}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.preco}
              onChange={e => set('preco', e.target.value)}
              placeholder="0,00"
              className={`w-full border-2 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 ${erros.preco ? 'border-red-400' : 'border-gray-200'}`}
            />
            {erros.preco && <p className="text-red-500 text-xs mt-1">{erros.preco}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque atual</label>
              <input
                type="number"
                value={form.estoque}
                onChange={e => set('estoque', e.target.value)}
                placeholder="0"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de estoque mínimo</label>
              <input
                type="number"
                value={form.estoqueMinimo}
                onChange={e => set('estoqueMinimo', e.target.value)}
                placeholder="0"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 bg-white capitalize"
            >
              {categorias.map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onFechar}
            className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold hover:bg-green-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
