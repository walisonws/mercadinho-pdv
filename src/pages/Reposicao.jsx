import { useState } from 'react'
import { Plus, Trash2, CheckCircle, Circle, ClipboardList, ChevronDown, ChevronUp, AlertTriangle, PackageCheck, Search, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ModalConfirmarCompra from '../components/ModalConfirmarCompra'

const CATEGORIAS_EMOJI = {
  mercearia: '🛒', bebidas: '🥤', frutas: '🍎', verduras: '🥦',
  carnes: '🥩', frios: '🧀', limpeza: '🧹', higiene: '🧴', outros: '📦',
}

const unidades = ['unidades', 'kg', 'caixas', 'fardos', 'litros', 'pacotes']

export default function Reposicao() {
  const { listas, produtos, produtosBaixoEstoque, criarLista, adicionarItemLista, removerItemLista, marcarItemComprado, desmarcarItemComprado, concluirLista, excluirLista } = useApp()

  const [expandida, setExpandida] = useState(null)
  const [novaLista, setNovaLista] = useState('')
  const [itemConfirmando, setItemConfirmando] = useState(null)
  const [aba, setAba] = useState('abertas')

  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtoSelecionando, setProdutoSelecionando] = useState(null)
  const [qtdSelecionando, setQtdSelecionando] = useState('')
  const [modoCustom, setModoCustom] = useState(false)
  const [novoItemCustom, setNovoItemCustom] = useState({ nome: '', quantidade: '', unidade: 'unidades', observacao: '' })

  const listasFiltradas = listas.filter(l => l.status === (aba === 'abertas' ? 'aberta' : 'concluida'))

  const produtosFiltrados = produtos
    .filter(p => p.ativo)
    .filter(p => !buscaProduto || p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  async function handleCriarLista() {
    if (!novaLista.trim()) return
    const nova = await criarLista(novaLista.trim())
    setNovaLista('')
    setExpandida(nova.id)
    resetAdicionarEstados()
  }

  function handleExpandir(listaId) {
    setExpandida(expandida === listaId ? null : listaId)
    resetAdicionarEstados()
  }

  function resetAdicionarEstados() {
    setBuscaProduto('')
    setProdutoSelecionando(null)
    setQtdSelecionando('')
    setModoCustom(false)
    setNovoItemCustom({ nome: '', quantidade: '', unidade: 'unidades', observacao: '' })
  }

  function handleSelecionarProduto(listaId, produto) {
    setProdutoSelecionando({ listaId, produto })
    setQtdSelecionando(produto.estoqueMinimo > 0 ? String(produto.estoqueMinimo * 2) : '1')
    setModoCustom(false)
  }

  function handleConfirmarAdicao() {
    if (!produtoSelecionando) return
    const { listaId, produto } = produtoSelecionando
    adicionarItemLista(listaId, {
      nome: produto.nome,
      quantidade: qtdSelecionando || '1',
      unidade: produto.tipo === 'peso' ? 'kg' : 'unidades',
      observacao: '',
    })
    setProdutoSelecionando(null)
    setQtdSelecionando('')
  }

  function handleAdicionarCustom(listaId) {
    if (!novoItemCustom.nome.trim()) return
    adicionarItemLista(listaId, { ...novoItemCustom, quantidade: novoItemCustom.quantidade || '1' })
    setNovoItemCustom({ nome: '', quantidade: '', unidade: 'unidades', observacao: '' })
    setModoCustom(false)
  }

  function handleConfirmarCompra(dados) {
    marcarItemComprado(itemConfirmando.listaId, itemConfirmando.item.id, dados)
    setItemConfirmando(null)
  }

  function handleConcluir(lista) {
    const naoComprados = lista.itens.filter(i => !i.comprado).length
    if (naoComprados > 0) {
      if (!window.confirm(`Ainda há ${naoComprados} item(ns) não marcado(s). Deseja concluir mesmo assim?`)) return
    }
    concluirLista(lista.id)
    setExpandida(null)
  }

  function progressoLista(lista) {
    if (!lista.itens.length) return 0
    return Math.round((lista.itens.filter(i => i.comprado).length / lista.itens.length) * 100)
  }

  function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Reposição</h1>
          <p className="text-sm text-gray-500">Controle o que precisa repor no estoque</p>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      {produtosBaixoEstoque.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <p className="font-semibold text-red-700">{produtosBaixoEstoque.length} produto(s) com estoque baixo</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {produtosBaixoEstoque.map(p => (
              <span key={p.id} className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                {p.nome} — {p.estoque} restante(s)
              </span>
            ))}
          </div>
          <button
            onClick={async () => {
              const nome = `Reposição ${new Date().toLocaleDateString('pt-BR')}`
              const itensIniciais = produtosBaixoEstoque.map(p => ({
                nome: p.nome,
                quantidade: String(p.estoqueMinimo > 0 ? p.estoqueMinimo * 2 : 1),
                unidade: p.tipo === 'peso' ? 'kg' : 'unidades',
                observacao: '',
              }))
              const nova = await criarLista(nome, itensIniciais)
              setAba('abertas')
              setExpandida(nova.id)
            }}
            className="mt-3 flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            <Plus size={14} />
            Criar lista automática com esses produtos
          </button>
        </div>
      )}

      {/* Nova lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <p className="text-sm font-semibold text-gray-600 mb-3">Criar nova lista</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={novaLista}
            onChange={e => setNovaLista(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCriarLista()}
            placeholder='Ex: "Compras do atacado — seg 20/05"'
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 text-sm"
          />
          <button
            onClick={handleCriarLista}
            disabled={!novaLista.trim()}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40"
          >
            <Plus size={16} />
            Criar
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {['abertas', 'concluidas'].map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              aba === a ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {a === 'abertas' ? '📋 Em aberto' : '✅ Concluídas'} ({listas.filter(l => l.status === (a === 'abertas' ? 'aberta' : 'concluida')).length})
          </button>
        ))}
      </div>

      {/* Lista de listas */}
      {listasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
          <ClipboardList size={40} className="mx-auto mb-3" />
          <p className="font-medium">
            {aba === 'abertas' ? 'Nenhuma lista em aberto' : 'Nenhuma lista concluída'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listasFiltradas.map(lista => {
            const progresso = progressoLista(lista)
            const aberta = expandida === lista.id

            return (
              <div key={lista.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cabeçalho */}
                <button
                  onClick={() => handleExpandir(lista.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lista.status === 'concluida' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {lista.status === 'concluida'
                        ? <PackageCheck size={18} className="text-green-600" />
                        : <ClipboardList size={18} className="text-orange-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{lista.nome}</p>
                      <p className="text-xs text-gray-400">{formatarData(lista.dataCriacao)} · {lista.itens.length} item(ns)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {lista.status === 'aberta' && lista.itens.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${progresso}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{progresso}%</span>
                      </div>
                    )}
                    {aberta ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {/* Conteúdo expandido */}
                {aberta && (
                  <div className="border-t">
                    {/* Itens */}
                    <div className="p-4 space-y-2">
                      {lista.itens.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-3">Nenhum item. Selecione produtos abaixo.</p>
                      )}
                      {lista.itens.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            item.comprado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (item.comprado) {
                                desmarcarItemComprado(lista.id, item.id)
                              } else {
                                setItemConfirmando({ listaId: lista.id, item })
                              }
                            }}
                            disabled={lista.status === 'concluida'}
                            className="shrink-0"
                          >
                            {item.comprado
                              ? <CheckCircle size={22} className="text-green-500" />
                              : <Circle size={22} className="text-gray-300 hover:text-orange-400 transition-colors" />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${item.comprado ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.nome}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.quantidade} {item.unidade}
                              {item.observacao ? ` · ${item.observacao}` : ''}
                            </p>
                            {item.comprado && item.resolucao === 'mesmo_produto' && (
                              <p className="text-xs text-green-600 mt-0.5">✓ Estoque atualizado · R$ {parseFloat(item.precoComprado).toFixed(2)}</p>
                            )}
                            {item.comprado && item.resolucao === 'produto_novo' && (
                              <p className="text-xs text-blue-600 mt-0.5">✓ Novo produto cadastrado: {item.nomeProdutoNovo}</p>
                            )}
                          </div>

                          {lista.status === 'aberta' && (
                            <button
                              onClick={() => removerItemLista(lista.id, item.id)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Adicionar produtos */}
                    {lista.status === 'aberta' && (
                      <div className="border-t bg-gray-50 p-4">

                        {/* Card de quantidade ao selecionar produto */}
                        {produtoSelecionando && produtoSelecionando.listaId === lista.id && (
                          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-gray-800">{produtoSelecionando.produto.nome}</p>
                                <p className="text-xs text-gray-500">Estoque atual: {produtoSelecionando.produto.estoque}</p>
                              </div>
                              <button onClick={() => setProdutoSelecionando(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                autoFocus
                                value={qtdSelecionando}
                                onChange={e => setQtdSelecionando(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleConfirmarAdicao()}
                                placeholder="Qtd"
                                className="flex-1 border-2 border-orange-200 rounded-xl px-3 py-2 text-lg font-bold text-center focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-sm text-gray-500 shrink-0">
                                {produtoSelecionando.produto.tipo === 'peso' ? 'kg' : 'unidades'}
                              </span>
                              <button
                                onClick={handleConfirmarAdicao}
                                className="bg-orange-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário de item não cadastrado */}
                        {modoCustom ? (
                          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-gray-700">Item não cadastrado</p>
                              <button onClick={() => setModoCustom(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <input
                                type="text"
                                autoFocus
                                value={novoItemCustom.nome}
                                onChange={e => setNovoItemCustom(p => ({ ...p, nome: e.target.value }))}
                                placeholder="Nome do produto"
                                className="col-span-2 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                              />
                              <input
                                type="number"
                                value={novoItemCustom.quantidade}
                                onChange={e => setNovoItemCustom(p => ({ ...p, quantidade: e.target.value }))}
                                placeholder="Qtd"
                                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={novoItemCustom.unidade}
                                onChange={e => setNovoItemCustom(p => ({ ...p, unidade: e.target.value }))}
                                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white"
                              >
                                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <input
                                type="text"
                                value={novoItemCustom.observacao}
                                onChange={e => setNovoItemCustom(p => ({ ...p, observacao: e.target.value }))}
                                placeholder="Observação (opcional)"
                                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                              />
                              <button
                                onClick={() => handleAdicionarCustom(lista.id)}
                                disabled={!novoItemCustom.nome.trim()}
                                className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Busca no catálogo */}
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Selecionar do catálogo</p>
                            <div className="relative mb-2">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={buscaProduto}
                                onChange={e => setBuscaProduto(e.target.value)}
                                placeholder="Buscar produto..."
                                className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>

                            {produtos.filter(p => p.ativo).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">Nenhum produto cadastrado ainda</p>
                            ) : produtosFiltrados.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">Nenhum produto encontrado</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto mb-3 pr-1">
                                {produtosFiltrados.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleSelecionarProduto(lista.id, p)}
                                    className={`flex items-center gap-2 p-2.5 bg-white rounded-xl border-2 text-left transition-all hover:border-orange-400 hover:shadow-sm ${
                                      produtoSelecionando?.produto.id === p.id && produtoSelecionando?.listaId === lista.id
                                        ? 'border-orange-400 bg-orange-50'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <span className="text-xl shrink-0">{CATEGORIAS_EMOJI[p.categoria] || '📦'}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-gray-800 truncate">{p.nome}</p>
                                      <p className={`text-xs ${p.estoque <= p.estoqueMinimo ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                        Estoque: {p.estoque}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Botão item não cadastrado */}
                            <button
                              onClick={() => { setModoCustom(true); setProdutoSelecionando(null) }}
                              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl py-2.5 text-sm hover:border-orange-400 hover:text-orange-500 transition-colors"
                            >
                              <Plus size={14} />
                              Adicionar item não cadastrado
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Ações da lista */}
                    <div className="border-t p-4 flex gap-2 justify-between">
                      <button
                        onClick={() => excluirLista(lista.id)}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                        Excluir lista
                      </button>

                      {lista.status === 'aberta' && (
                        <button
                          onClick={() => handleConcluir(lista)}
                          disabled={lista.itens.length === 0}
                          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40"
                        >
                          <PackageCheck size={16} />
                          Concluir compras
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmar compra */}
      {itemConfirmando && (
        <ModalConfirmarCompra
          item={itemConfirmando.item}
          onConfirmar={handleConfirmarCompra}
          onFechar={() => setItemConfirmando(null)}
        />
      )}
    </div>
  )
}
