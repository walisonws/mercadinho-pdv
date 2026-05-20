import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const AppContext = createContext()

const STORAGE_KEYS = {
  produtos: 'pdv_produtos',
  vendas: 'pdv_vendas',
  config: 'pdv_config',
  listas: 'pdv_listas',
}

const produtosPadrao = [
  { id: uuidv4(), nome: 'Arroz 5kg', codigo: '7896006714055', tipo: 'unidade', preco: 28.90, categoria: 'mercearia', ativo: true, estoque: 10, estoqueMinimo: 3 },
  { id: uuidv4(), nome: 'Feijão 1kg', codigo: '7896006714062', tipo: 'unidade', preco: 8.50, categoria: 'mercearia', ativo: true, estoque: 8, estoqueMinimo: 3 },
  { id: uuidv4(), nome: 'Óleo de Soja 900ml', codigo: '7896036090046', tipo: 'unidade', preco: 7.90, categoria: 'mercearia', ativo: true, estoque: 12, estoqueMinimo: 4 },
  { id: uuidv4(), nome: 'Banana (kg)', codigo: '2000000000001', tipo: 'peso', preco: 4.50, categoria: 'frutas', ativo: true, estoque: 15, estoqueMinimo: 5 },
  { id: uuidv4(), nome: 'Carne Moída (kg)', codigo: '2000000000002', tipo: 'peso', preco: 35.00, categoria: 'carnes', ativo: true, estoque: 8, estoqueMinimo: 3 },
  { id: uuidv4(), nome: 'Refrigerante 2L', codigo: '7891234100013', tipo: 'unidade', preco: 9.00, categoria: 'bebidas', ativo: true, estoque: 20, estoqueMinimo: 6 },
  { id: uuidv4(), nome: 'Macarrão 500g', codigo: '7896005800089', tipo: 'unidade', preco: 4.20, categoria: 'mercearia', ativo: true, estoque: 2, estoqueMinimo: 5 },
  { id: uuidv4(), nome: 'Presunto (kg)', codigo: '2000000000003', tipo: 'peso', preco: 28.00, categoria: 'frios', ativo: true, estoque: 4, estoqueMinimo: 2 },
]

export function AppProvider({ children }) {
  const [produtos, setProdutos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.produtos)
    if (saved) {
      const parsed = JSON.parse(saved)
      // migrar produtos antigos sem campo estoque
      return parsed.map(p => ({
        estoque: p.estoque ?? 0,
        estoqueMinimo: p.estoqueMinimo ?? 0,
        ...p,
      }))
    }
    return produtosPadrao
  })

  const [vendas, setVendas] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.vendas)
    return saved ? JSON.parse(saved) : []
  })

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.config)
    return saved ? JSON.parse(saved) : {
      nomeMercadinho: 'Meu Mercadinho',
      endereco: '',
      telefone: '',
    }
  })

  const [listas, setListas] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.listas)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.produtos, JSON.stringify(produtos)) }, [produtos])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.vendas, JSON.stringify(vendas)) }, [vendas])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config)) }, [config])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.listas, JSON.stringify(listas)) }, [listas])

  // ── Produtos ──────────────────────────────────────────────
  function adicionarProduto(produto) {
    setProdutos(prev => [...prev, {
      estoque: 0,
      estoqueMinimo: 0,
      ...produto,
      id: uuidv4(),
      ativo: true,
    }])
  }

  function editarProduto(id, dados) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p))
  }

  function excluirProduto(id) {
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  function atualizarEstoque(id, quantidade) {
    setProdutos(prev => prev.map(p =>
      p.id === id ? { ...p, estoque: Math.max(0, (p.estoque || 0) + quantidade) } : p
    ))
  }

  function buscarPorCodigo(codigo) {
    return produtos.find(p => p.codigo === codigo && p.ativo)
  }

  function buscarPorNome(termo) {
    const t = termo.toLowerCase()
    return produtos.filter(p => p.ativo && p.nome.toLowerCase().includes(t))
  }

  const produtosBaixoEstoque = produtos.filter(p =>
    p.ativo && p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo
  )

  // ── Vendas ────────────────────────────────────────────────
  function registrarVenda(venda) {
    const novaVenda = { ...venda, id: uuidv4(), data: new Date().toISOString() }
    setVendas(prev => [novaVenda, ...prev])
    // debita estoque dos produtos por unidade
    venda.itens.forEach(item => {
      if (item.tipo === 'unidade') {
        atualizarEstoque(item.produtoId, -item.quantidade)
      }
    })
    return novaVenda
  }

  function salvarConfig(dados) {
    setConfig(prev => ({ ...prev, ...dados }))
  }

  // ── Listas de Reposição ───────────────────────────────────
  function criarLista(nome) {
    const nova = {
      id: uuidv4(),
      nome,
      dataCriacao: new Date().toISOString(),
      status: 'aberta',
      itens: [],
    }
    setListas(prev => [nova, ...prev])
    return nova
  }

  function adicionarItemLista(listaId, item) {
    setListas(prev => prev.map(l => l.id === listaId ? {
      ...l,
      itens: [...l.itens, { ...item, id: uuidv4(), comprado: false }],
    } : l))
  }

  function removerItemLista(listaId, itemId) {
    setListas(prev => prev.map(l => l.id === listaId ? {
      ...l,
      itens: l.itens.filter(i => i.id !== itemId),
    } : l))
  }

  function marcarItemComprado(listaId, itemId, dados) {
    // dados: { resolucao, quantidadeComprada, precoComprado, produtoId?, nomeProdutoNovo?, categoria? }
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      return {
        ...l,
        itens: l.itens.map(i => i.id === itemId ? {
          ...i,
          comprado: true,
          ...dados,
        } : i),
      }
    }))

    if (dados.resolucao === 'mesmo_produto' && dados.produtoId) {
      // Atualiza estoque e preço
      setProdutos(prev => prev.map(p => p.id === dados.produtoId ? {
        ...p,
        estoque: (p.estoque || 0) + (dados.quantidadeComprada || 0),
        preco: dados.precoComprado || p.preco,
      } : p))
    }

    if (dados.resolucao === 'produto_novo') {
      // Cadastra novo produto
      adicionarProduto({
        nome: dados.nomeProdutoNovo,
        codigo: dados.codigoNovo || `2${Date.now()}`.slice(0, 13),
        tipo: dados.tipoNovo || 'unidade',
        preco: dados.precoComprado || 0,
        categoria: dados.categoriaNova || 'mercearia',
        estoque: dados.quantidadeComprada || 0,
        estoqueMinimo: 0,
      })
    }
  }

  function desmarcarItemComprado(listaId, itemId) {
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      return {
        ...l,
        itens: l.itens.map(i => i.id === itemId ? {
          ...i,
          comprado: false,
          resolucao: undefined,
          quantidadeComprada: undefined,
          precoComprado: undefined,
          produtoId: undefined,
        } : i),
      }
    }))
  }

  function concluirLista(listaId) {
    setListas(prev => prev.map(l => l.id === listaId ? {
      ...l,
      status: 'concluida',
      dataConclusao: new Date().toISOString(),
    } : l))
  }

  function excluirLista(listaId) {
    setListas(prev => prev.filter(l => l.id !== listaId))
  }

  const vendasHoje = vendas.filter(v => {
    const hoje = new Date().toDateString()
    return new Date(v.data).toDateString() === hoje
  })

  const totalHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0)

  return (
    <AppContext.Provider value={{
      produtos,
      vendas,
      vendasHoje,
      totalHoje,
      config,
      listas,
      produtosBaixoEstoque,
      adicionarProduto,
      editarProduto,
      excluirProduto,
      atualizarEstoque,
      buscarPorCodigo,
      buscarPorNome,
      registrarVenda,
      salvarConfig,
      criarLista,
      adicionarItemLista,
      removerItemLista,
      marcarItemComprado,
      desmarcarItemComprado,
      concluirLista,
      excluirLista,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
