import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const AppContext = createContext()

const STORAGE_KEYS = {
  produtos: 'pdv_produtos',
  vendas: 'pdv_vendas',
  config: 'pdv_config',
}

const produtosPadrao = [
  { id: uuidv4(), nome: 'Arroz 5kg', codigo: '7896006714055', tipo: 'unidade', preco: 28.90, categoria: 'mercearia', ativo: true },
  { id: uuidv4(), nome: 'Feijão 1kg', codigo: '7896006714062', tipo: 'unidade', preco: 8.50, categoria: 'mercearia', ativo: true },
  { id: uuidv4(), nome: 'Óleo de Soja 900ml', codigo: '7896036090046', tipo: 'unidade', preco: 7.90, categoria: 'mercearia', ativo: true },
  { id: uuidv4(), nome: 'Banana (kg)', codigo: '2000000000001', tipo: 'peso', preco: 4.50, categoria: 'frutas', ativo: true },
  { id: uuidv4(), nome: 'Carne Moída (kg)', codigo: '2000000000002', tipo: 'peso', preco: 35.00, categoria: 'carnes', ativo: true },
  { id: uuidv4(), nome: 'Refrigerante 2L', codigo: '7891234100013', tipo: 'unidade', preco: 9.00, categoria: 'bebidas', ativo: true },
  { id: uuidv4(), nome: 'Macarrão 500g', codigo: '7896005800089', tipo: 'unidade', preco: 4.20, categoria: 'mercearia', ativo: true },
  { id: uuidv4(), nome: 'Presunto (kg)', codigo: '2000000000003', tipo: 'peso', preco: 28.00, categoria: 'frios', ativo: true },
]

export function AppProvider({ children }) {
  const [produtos, setProdutos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.produtos)
    return saved ? JSON.parse(saved) : produtosPadrao
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.produtos, JSON.stringify(produtos))
  }, [produtos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.vendas, JSON.stringify(vendas))
  }, [vendas])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config))
  }, [config])

  function adicionarProduto(produto) {
    setProdutos(prev => [...prev, { ...produto, id: uuidv4(), ativo: true }])
  }

  function editarProduto(id, dados) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p))
  }

  function excluirProduto(id) {
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  function buscarPorCodigo(codigo) {
    return produtos.find(p => p.codigo === codigo && p.ativo)
  }

  function buscarPorNome(termo) {
    const t = termo.toLowerCase()
    return produtos.filter(p => p.ativo && p.nome.toLowerCase().includes(t))
  }

  function registrarVenda(venda) {
    const novaVenda = {
      ...venda,
      id: uuidv4(),
      data: new Date().toISOString(),
    }
    setVendas(prev => [novaVenda, ...prev])
    return novaVenda
  }

  function salvarConfig(dados) {
    setConfig(prev => ({ ...prev, ...dados }))
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
      adicionarProduto,
      editarProduto,
      excluirProduto,
      buscarPorCodigo,
      buscarPorNome,
      registrarVenda,
      salvarConfig,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
