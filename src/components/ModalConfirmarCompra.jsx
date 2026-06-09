import { useState } from 'react'
import { RefreshCw, PlusCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { precoVendaSugerido } from '../utils/precos'

const categorias = ['mercearia', 'bebidas', 'frutas', 'verduras', 'carnes', 'frios', 'limpeza', 'higiene', 'outros']

export default function ModalConfirmarCompra({ item, onConfirmar, onFechar }) {
  const { produtos, buscarPorNome, config, salvarConfig } = useApp()
  const margemPadrao = config?.margemPadrao ?? 30
  const [etapa, setEtapa] = useState('escolha') // 'escolha' | 'mesmo' | 'novo'
  const [form, setForm] = useState({
    resolucao: '',
    quantidadeComprada: '',
    precoComprado: '',
    margem: margemPadrao,
    precoVenda: 0,
    vendaEditada: false,
    produtoId: '',
    nomeProdutoNovo: item.nome,
    codigoNovo: '',
    tipoNovo: 'unidade',
    categoriaNova: 'mercearia',
  })

  const sugestoes = buscarPorNome(item.nome).slice(0, 5)

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  // Muda o preço pago (custo) → recalcula a venda sugerida (a menos que editada à mão).
  function setCusto(valor) {
    setForm(prev => {
      const custo = parseFloat(valor) || 0
      const precoVenda = prev.vendaEditada ? prev.precoVenda : precoVendaSugerido(custo, prev.margem)
      return { ...prev, precoComprado: valor, precoVenda }
    })
  }

  function setMargem(valor) {
    setForm(prev => {
      const margem = parseFloat(valor) || 0
      const custo = parseFloat(prev.precoComprado) || 0
      const precoVenda = prev.vendaEditada ? prev.precoVenda : precoVendaSugerido(custo, margem)
      return { ...prev, margem, precoVenda }
    })
  }

  function setVenda(valor) {
    setForm(prev => ({ ...prev, precoVenda: parseFloat(valor) || 0, vendaEditada: true }))
  }

  const custoNum = parseFloat(form.precoComprado) || 0
  const lucroUnit = (form.precoVenda || 0) - custoNum

  function handleConfirmar() {
    // Persiste a margem como padrão para as próximas reposições.
    if (form.margem !== margemPadrao) salvarConfig({ ...config, margemPadrao: form.margem })
    onConfirmar({
      ...form,
      quantidadeComprada: parseFloat(form.quantidadeComprada) || 0,
      precoComprado: parseFloat(form.precoComprado) || 0,
      precoVenda: form.precoVenda || 0,
    })
  }

  const podeSalvar = form.quantidadeComprada > 0 && form.precoComprado > 0 &&
    (etapa === 'mesmo' ? !!form.produtoId : !!form.nomeProdutoNovo.trim())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Confirmar Compra</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <p className="font-semibold text-gray-800">{item.nome}</p>
          <p className="text-sm text-gray-500">Qtd prevista: {item.quantidade} {item.unidade}</p>
        </div>

        {/* Etapa 1 — Escolha */}
        {etapa === 'escolha' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600 mb-3">O que você comprou?</p>

            <button
              onClick={() => { set('resolucao', 'mesmo_produto'); setEtapa('mesmo') }}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">O mesmo produto cadastrado</p>
                <p className="text-xs text-gray-500">Atualiza o estoque e o preço se mudou</p>
              </div>
            </button>

            <button
              onClick={() => { set('resolucao', 'produto_novo'); setEtapa('novo') }}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <PlusCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Uma marca / produto diferente</p>
                <p className="text-xs text-gray-500">Cadastra como novo produto no sistema</p>
              </div>
            </button>
          </div>
        )}

        {/* Etapa 2a — Mesmo produto */}
        {etapa === 'mesmo' && (
          <div className="space-y-4">
            <button onClick={() => setEtapa('escolha')} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              ← Voltar
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o produto cadastrado</label>
              {sugestoes.length > 0 ? (
                <div className="space-y-2">
                  {sugestoes.map(p => (
                    <button
                      key={p.id}
                      onClick={() => set('produtoId', p.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl transition-all text-left ${
                        form.produtoId === p.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.nome}</p>
                        <p className="text-xs text-gray-400">Estoque atual: {p.estoque} · R$ {p.preco.toFixed(2)}</p>
                      </div>
                      {form.produtoId === p.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {produtos.filter(p => p.ativo).slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => set('produtoId', p.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl transition-all text-left ${
                        form.produtoId === p.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-800 text-sm">{p.nome}</p>
                      <p className="text-xs text-gray-400">R$ {p.preco.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade comprada</label>
                <input
                  type="number"
                  value={form.quantidadeComprada}
                  onChange={e => set('quantidadeComprada', e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço pago / custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precoComprado}
                  onChange={e => setCusto(e.target.value)}
                  placeholder="0,00"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <PrecificacaoFields
              form={form} custoNum={custoNum} lucroUnit={lucroUnit}
              setMargem={setMargem} setVenda={setVenda}
            />

            {form.produtoId && form.precoComprado > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                ✓ Estoque aumenta em <strong>{form.quantidadeComprada || 0}</strong>, custo vira <strong>R$ {custoNum.toFixed(2)}</strong> e a venda passa a <strong>R$ {(form.precoVenda || 0).toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Etapa 2b — Produto novo */}
        {etapa === 'novo' && (
          <div className="space-y-4">
            <button onClick={() => setEtapa('escolha')} className="text-sm text-gray-400 hover:text-gray-600">
              ← Voltar
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do novo produto</label>
              <input
                type="text"
                value={form.nomeProdutoNovo}
                onChange={e => set('nomeProdutoNovo', e.target.value)}
                placeholder="Ex: Macarrão Renata 500g"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de venda</label>
              <div className="grid grid-cols-2 gap-2">
                {['unidade', 'peso'].map(t => (
                  <button
                    key={t}
                    onClick={() => set('tipoNovo', t)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.tipoNovo === t ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t === 'unidade' ? 'Por unidade' : 'Por peso (kg)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={form.categoriaNova}
                onChange={e => set('categoriaNova', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 bg-white capitalize"
              >
                {categorias.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade comprada</label>
                <input
                  type="number"
                  value={form.quantidadeComprada}
                  onChange={e => set('quantidadeComprada', e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.tipoNovo === 'peso' ? 'Custo/kg pago (R$)' : 'Custo unit. pago (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precoComprado}
                  onChange={e => setCusto(e.target.value)}
                  placeholder="0,00"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <PrecificacaoFields
              form={form} custoNum={custoNum} lucroUnit={lucroUnit}
              setMargem={setMargem} setVenda={setVenda} cor="green"
            />

            {form.nomeProdutoNovo && form.precoComprado > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✓ <strong>{form.nomeProdutoNovo}</strong> entra com custo <strong>R$ {custoNum.toFixed(2)}</strong> e venda <strong>R$ {(form.precoVenda || 0).toFixed(2)}</strong> (estoque {form.quantidadeComprada || 0})
              </div>
            )}
          </div>
        )}

        {etapa !== 'escolha' && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={onFechar}
              className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!podeSalvar}
              className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Campos de precificação: margem (%) + preço de venda editável + lucro por unidade.
function PrecificacaoFields({ form, custoNum, lucroUnit, setMargem, setVenda, cor = 'blue' }) {
  if (custoNum <= 0) return null
  const foco = cor === 'green' ? 'focus:border-green-500' : 'focus:border-blue-500'
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-violet-700 mb-1">Margem de lucro (%)</label>
          <input
            type="number"
            value={form.margem}
            onChange={e => setMargem(e.target.value)}
            placeholder="30"
            className={`w-full border-2 border-violet-200 rounded-xl px-3 py-2 focus:outline-none ${foco}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-violet-700 mb-1">Preço de venda (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.precoVenda || ''}
            onChange={e => setVenda(e.target.value)}
            placeholder="0,00"
            className={`w-full border-2 border-violet-200 rounded-xl px-3 py-2 focus:outline-none ${foco}`}
          />
        </div>
      </div>
      <p className="text-xs text-gray-600">
        Custo <strong>R$ {custoNum.toFixed(2)}</strong> · Venda <strong>R$ {(form.precoVenda || 0).toFixed(2)}</strong> ·{' '}
        Lucro <strong className={lucroUnit >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {lucroUnit.toFixed(2)}</strong>
        {form.vendaEditada && <span className="ml-1 text-violet-500">(venda manual)</span>}
      </p>
    </div>
  )
}
