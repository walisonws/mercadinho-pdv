import { useState, useRef, useEffect } from 'react'
import { Search, Trash2, Plus, Minus, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ModalPeso from '../components/ModalPeso'
import ModalFinalizarVenda from '../components/ModalFinalizarVenda'

const CATEGORIAS_EMOJI = {
  mercearia: '🛒', bebidas: '🥤', frutas: '🍎', verduras: '🥦',
  carnes: '🥩', frios: '🧀', limpeza: '🧹', higiene: '🧴', outros: '📦',
}

export default function PDV() {
  const { buscarPorCodigo, buscarPorNome, registrarVenda, produtos } = useApp()
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [produtoPeso, setProdutoPeso] = useState(null)
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false)
  const [vendaConfirmada, setVendaConfirmada] = useState(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)

  const total = carrinho.reduce((acc, item) => acc + item.total, 0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleBusca(valor) {
    setBusca(valor)
    setErro('')
    if (valor.length >= 2) {
      setSugestoes(buscarPorNome(valor).slice(0, 6))
    } else {
      setSugestoes([])
    }
  }

  function handleScan(e) {
    if (e.key === 'Enter' && busca.trim()) {
      const codigo = busca.trim()
      setSugestoes([])

      const produto = buscarPorCodigo(codigo)
      if (produto) {
        adicionarAoCarrinho(produto)
        setBusca('')
      } else {
        const porNome = buscarPorNome(codigo)
        if (porNome.length === 1) {
          adicionarAoCarrinho(porNome[0])
          setBusca('')
        } else {
          setErro(`Produto "${codigo}" não encontrado. Cadastre-o na aba Produtos.`)
        }
      }
    }
  }

  function adicionarAoCarrinho(produto) {
    if (produto.tipo === 'peso') {
      setProdutoPeso(produto)
      setBusca('')
      setSugestoes([])
      return
    }
    setCarrinho(prev => {
      const idx = prev.findIndex(i => i.id === produto.id)
      if (idx >= 0) {
        const novo = [...prev]
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + 1, total: (novo[idx].quantidade + 1) * produto.preco }
        return novo
      }
      return [...prev, { ...produto, quantidade: 1, total: produto.preco, itemId: Date.now() }]
    })
    setErro('')
  }

  function confirmarPeso(gramas) {
    const kg = gramas / 1000
    const total = kg * produtoPeso.preco
    setCarrinho(prev => [...prev, {
      ...produtoPeso,
      quantidade: gramas,
      unidadeLabel: `${gramas}g`,
      total,
      itemId: Date.now(),
    }])
    setProdutoPeso(null)
    inputRef.current?.focus()
  }

  function alterarQuantidade(itemId, delta) {
    setCarrinho(prev => prev.map(item => {
      if (item.itemId !== itemId) return item
      if (item.tipo === 'peso') return item
      const nova = item.quantidade + delta
      if (nova <= 0) return null
      return { ...item, quantidade: nova, total: nova * item.preco }
    }).filter(Boolean))
  }

  function removerItem(itemId) {
    setCarrinho(prev => prev.filter(i => i.itemId !== itemId))
  }

  function limparCarrinho() {
    setCarrinho([])
    setBusca('')
    setErro('')
    inputRef.current?.focus()
  }

  function handleFinalizarVenda({ forma, valorRecebido, troco }) {
    const venda = registrarVenda({
      itens: carrinho.map(i => ({
        produtoId: i.id,
        nome: i.nome,
        tipo: i.tipo,
        quantidade: i.quantidade,
        unidadeLabel: i.unidadeLabel || null,
        preco: i.preco,
        total: i.total,
      })),
      total,
      pagamento: forma,
      valorRecebido,
      troco,
    })
    setVendaConfirmada({ ...venda, troco, forma })
    setMostrarFinalizar(false)
    setCarrinho([])
    setBusca('')
    setTimeout(() => {
      setVendaConfirmada(null)
      inputRef.current?.focus()
    }, 4000)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-gray-100">
      {/* Coluna esquerda — busca e sugestões */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Campo de busca/scan */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            onKeyDown={handleScan}
            placeholder="Escaneie o código ou busque por nome + Enter"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-3 text-sm">
            <AlertCircle size={16} />
            {erro}
          </div>
        )}

        {/* Sugestões */}
        {sugestoes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-3 overflow-hidden">
            {sugestoes.map(p => (
              <button
                key={p.id}
                onClick={() => { adicionarAoCarrinho(p); setBusca(''); setSugestoes([]) }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 transition-colors border-b last:border-0 text-left"
              >
                <div>
                  <span className="mr-2">{CATEGORIAS_EMOJI[p.categoria] || '📦'}</span>
                  <span className="font-medium text-gray-800">{p.nome}</span>
                  <span className="ml-2 text-xs text-gray-400">{p.tipo === 'peso' ? '/kg' : 'un'}</span>
                </div>
                <span className="font-bold text-green-700">R$ {p.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Atalhos — produtos mais vendidos */}
        {sugestoes.length === 0 && busca.length === 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Produtos cadastrados</p>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[calc(100vh-220px)]">
              {produtos.filter(p => p.ativo).slice(0, 18).map(p => (
                <button
                  key={p.id}
                  onClick={() => adicionarAoCarrinho(p)}
                  className="bg-white rounded-xl p-3 text-left shadow-sm border border-gray-100 hover:border-green-400 hover:shadow-md transition-all"
                >
                  <p className="text-xl mb-1">{CATEGORIAS_EMOJI[p.categoria] || '📦'}</p>
                  <p className="text-xs font-semibold text-gray-700 leading-tight line-clamp-2">{p.nome}</p>
                  <p className="text-sm font-bold text-green-700 mt-1">
                    R$ {p.preco.toFixed(2)}{p.tipo === 'peso' ? '/kg' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coluna direita — carrinho */}
      <div className="w-96 bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b bg-green-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-bold text-lg">Carrinho</span>
            </div>
            <span className="bg-green-600 rounded-full px-3 py-0.5 text-sm font-bold">
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {/* Itens do carrinho */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrinho.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={48} />
              <p className="mt-2 text-sm">Carrinho vazio</p>
              <p className="text-xs">Escaneie um produto para começar</p>
            </div>
          )}
          {carrinho.map(item => (
            <div key={item.itemId} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <span className="text-lg">{CATEGORIAS_EMOJI[item.categoria] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.nome}</p>
                <p className="text-xs text-gray-500">
                  {item.tipo === 'peso'
                    ? `${item.unidadeLabel} × R$ ${item.preco.toFixed(2)}/kg`
                    : `${item.quantidade}× R$ ${item.preco.toFixed(2)}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-1">
                {item.tipo !== 'peso' && (
                  <>
                    <button onClick={() => alterarQuantidade(item.itemId, -1)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                      <Minus size={12} />
                    </button>
                    <button onClick={() => alterarQuantidade(item.itemId, 1)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                      <Plus size={12} />
                    </button>
                  </>
                )}
                <button onClick={() => removerItem(item.itemId)} className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200 ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
              <span className="text-sm font-bold text-green-700 w-16 text-right">R$ {item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Rodapé do carrinho */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-3xl font-bold text-green-700">R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            {carrinho.length > 0 && (
              <button
                onClick={limparCarrinho}
                className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => setMostrarFinalizar(true)}
              disabled={carrinho.length === 0}
              className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Modal peso */}
      {produtoPeso && (
        <ModalPeso
          produto={produtoPeso}
          onConfirmar={confirmarPeso}
          onFechar={() => { setProdutoPeso(null); inputRef.current?.focus() }}
        />
      )}

      {/* Modal finalizar */}
      {mostrarFinalizar && (
        <ModalFinalizarVenda
          total={total}
          onConfirmar={handleFinalizarVenda}
          onFechar={() => setMostrarFinalizar(false)}
        />
      )}

      {/* Toast de confirmação */}
      {vendaConfirmada && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-3 z-50 min-w-72">
          <CheckCircle size={24} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-lg">Venda confirmada!</p>
            <p className="text-green-100 text-sm">
              {vendaConfirmada.forma === 'dinheiro'
                ? `Dinheiro — Troco: R$ ${vendaConfirmada.troco.toFixed(2)}`
                : vendaConfirmada.forma === 'cartao' ? 'Pago no cartão' : 'Pago via Pix'}
            </p>
            <p className="font-semibold mt-1">Total: R$ {vendaConfirmada.total.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
