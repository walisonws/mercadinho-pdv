import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AppContext = createContext()

const STORAGE_KEYS = {
  produtos: 'pdv_produtos',
  vendas: 'pdv_vendas',
  config: 'pdv_config',
  listas: 'pdv_listas',
  operadores: 'pdv_operadores',
  operadorAtivo: 'pdv_operador_ativo',
  caixaAtual: 'pdv_caixa_atual',
  historicosCaixa: 'pdv_historico_caixas',
}

const produtosPadrao = [
  { id: uuidv4(), nome: 'Arroz 5kg', codigo: '7896006714055', tipo: 'unidade', preco: 28.90, custoCompra: 0, categoria: 'mercearia', ativo: true, estoque: 10, estoqueMinimo: 3, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Feijão 1kg', codigo: '7896006714062', tipo: 'unidade', preco: 8.50, custoCompra: 0, categoria: 'mercearia', ativo: true, estoque: 8, estoqueMinimo: 3, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Óleo de Soja 900ml', codigo: '7896036090046', tipo: 'unidade', preco: 7.90, custoCompra: 0, categoria: 'mercearia', ativo: true, estoque: 12, estoqueMinimo: 4, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Banana (kg)', codigo: '2000000000001', tipo: 'peso', preco: 4.50, custoCompra: 0, categoria: 'frutas', ativo: true, estoque: 15, estoqueMinimo: 5, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Carne Moída (kg)', codigo: '2000000000002', tipo: 'peso', preco: 35.00, custoCompra: 0, categoria: 'carnes', ativo: true, estoque: 8, estoqueMinimo: 3, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Refrigerante 2L', codigo: '7891234100013', tipo: 'unidade', preco: 9.00, custoCompra: 0, categoria: 'bebidas', ativo: true, estoque: 20, estoqueMinimo: 6, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Macarrão 500g', codigo: '7896005800089', tipo: 'unidade', preco: 4.20, custoCompra: 0, categoria: 'mercearia', ativo: true, estoque: 2, estoqueMinimo: 5, codigosAlternativos: [] },
  { id: uuidv4(), nome: 'Presunto (kg)', codigo: '2000000000003', tipo: 'peso', preco: 28.00, custoCompra: 0, categoria: 'frios', ativo: true, estoque: 4, estoqueMinimo: 2, codigosAlternativos: [] },
]

// ── Mappers Supabase ↔ App ────────────────────────────────
const fromDbProduto = p => ({
  id: p.id, nome: p.nome, codigo: p.codigo, tipo: p.tipo,
  preco: p.preco, custoCompra: p.custo_compra || 0, categoria: p.categoria, ativo: p.ativo,
  estoque: p.estoque, estoqueMinimo: p.estoque_minimo,
  codigosAlternativos: p.codigos_alternativos || [],
})

const toDbProduto = (p, lojaId) => ({
  id: p.id, loja_id: lojaId, nome: p.nome, codigo: p.codigo,
  tipo: p.tipo, preco: p.preco, custo_compra: p.custoCompra || 0, categoria: p.categoria,
  ativo: p.ativo ?? true, estoque: p.estoque ?? 0,
  estoque_minimo: p.estoqueMinimo ?? 0,
  codigos_alternativos: p.codigosAlternativos || [],
})

const fromDbVenda = v => ({
  id: v.id, itens: v.itens, total: v.total, pagamento: v.pagamento,
  valorRecebido: v.valor_recebido, troco: v.troco, data: v.data,
  operadorId: v.operador_id || null, operadorNome: v.operador_nome || null,
})

const toDbVenda = (v, lojaId) => ({
  id: v.id, loja_id: lojaId, itens: v.itens, total: v.total,
  pagamento: v.pagamento, valor_recebido: v.valorRecebido ?? null,
  troco: v.troco ?? null, data: v.data,
  operador_id: v.operadorId ?? null, operador_nome: v.operadorNome ?? null,
})

const fromDbOperador = o => ({
  id: o.id, nome: o.nome, pin: o.pin, ativo: o.ativo,
  criadoEm: o.criado_em,
})

const toDbOperador = (o, lojaId) => ({
  id: o.id, loja_id: lojaId, nome: o.nome, pin: o.pin,
  ativo: o.ativo ?? true, criado_em: o.criadoEm,
})

const fromDbLista = l => ({
  id: l.id, nome: l.nome, status: l.status, itens: l.itens,
  dataCriacao: l.data_criacao, dataConclusao: l.data_conclusao,
})

const toDbLista = (l, lojaId) => ({
  id: l.id, loja_id: lojaId, nome: l.nome, status: l.status,
  itens: l.itens, data_criacao: l.dataCriacao,
  data_conclusao: l.dataConclusao ?? null,
})

export function AppProvider({ children }) {
  const { lojaId } = useAuth()

  const [produtos, setProdutos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.produtos)
    if (saved) return JSON.parse(saved).map(p => ({ custoCompra: 0, estoque: 0, estoqueMinimo: 0, codigosAlternativos: [], ...p }))
    return produtosPadrao
  })

  const [vendas, setVendas] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.vendas)
    return saved ? JSON.parse(saved) : []
  })

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.config)
    return saved ? JSON.parse(saved) : { nomeMercadinho: 'Meu Mercadinho', endereco: '', telefone: '', geminiApiKey: '' }
  })

  const [listas, setListas] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.listas)
    return saved ? JSON.parse(saved) : []
  })

  const [operadores, setOperadores] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.operadores)
    return saved ? JSON.parse(saved) : []
  })

  const [operadorAtivo, setOperadorAtivo] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.operadorAtivo)
    return saved ? JSON.parse(saved) : null
  })

  const [caixaAtual, setCaixaAtual] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.caixaAtual)
    return saved ? JSON.parse(saved) : null
  })

  const [historicosCaixa, setHistoricosCaixa] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.historicosCaixa)
    return saved ? JSON.parse(saved) : []
  })

  const [sincStatus, setSincStatus] = useState('idle')

  // ── Persistência localStorage ─────────────────────────────
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.produtos, JSON.stringify(produtos)) }, [produtos])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.vendas, JSON.stringify(vendas)) }, [vendas])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config)) }, [config])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.listas, JSON.stringify(listas)) }, [listas])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.operadores, JSON.stringify(operadores)) }, [operadores])
  useEffect(() => {
    if (operadorAtivo) localStorage.setItem(STORAGE_KEYS.operadorAtivo, JSON.stringify(operadorAtivo))
    else localStorage.removeItem(STORAGE_KEYS.operadorAtivo)
  }, [operadorAtivo])
  useEffect(() => {
    if (caixaAtual) localStorage.setItem(STORAGE_KEYS.caixaAtual, JSON.stringify(caixaAtual))
    else localStorage.removeItem(STORAGE_KEYS.caixaAtual)
  }, [caixaAtual])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.historicosCaixa, JSON.stringify(historicosCaixa)) }, [historicosCaixa])

  // ── Supabase: carrega dados e inscreve realtime ───────────
  useEffect(() => {
    if (!supabase || !lojaId) return
    carregarDoSupabase(lojaId)
    const channel = configurarRealtime(lojaId)
    return () => { supabase.removeChannel(channel) }
  }, [lojaId])

  async function carregarDoSupabase(lid) {
    setSincStatus('sincronizando')
    try {
      const [pRes, vRes, cRes, lRes, oRes] = await Promise.all([
        supabase.from('pdv_produtos').select('*').eq('loja_id', lid),
        supabase.from('pdv_vendas').select('*').eq('loja_id', lid).order('data', { ascending: false }),
        supabase.from('pdv_config').select('*').eq('loja_id', lid).maybeSingle(),
        supabase.from('pdv_listas').select('*').eq('loja_id', lid),
        supabase.from('pdv_operadores').select('*').eq('loja_id', lid),
      ])

      if (pRes.data?.length > 0) {
        setProdutos(pRes.data.map(fromDbProduto))
        setVendas((vRes.data || []).map(fromDbVenda))
        if (cRes.data) setConfig(prev => ({
          geminiApiKey: prev.geminiApiKey || '',
          nomeMercadinho: cRes.data.nome_mercadinho || 'Meu Mercadinho',
          endereco: cRes.data.endereco || '',
          telefone: cRes.data.telefone || '',
        }))
        setListas((lRes.data || []).map(fromDbLista))
        if (oRes.data?.length > 0) setOperadores(oRes.data.map(fromDbOperador))
      } else {
        await enviarParaSupabase(lid)
      }
      setSincStatus('ok')
    } catch {
      setSincStatus('erro')
    }
  }

  async function enviarParaSupabase(lid) {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.produtos) || '[]')
    const v = JSON.parse(localStorage.getItem(STORAGE_KEYS.vendas) || '[]')
    const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.config) || '{}')
    const l = JSON.parse(localStorage.getItem(STORAGE_KEYS.listas) || '[]')
    const o = JSON.parse(localStorage.getItem(STORAGE_KEYS.operadores) || '[]')
    await Promise.all([
      p.length && supabase.from('pdv_produtos').upsert(p.map(pr => toDbProduto(pr, lid))),
      v.length && supabase.from('pdv_vendas').upsert(v.map(ve => toDbVenda(ve, lid))),
      supabase.from('pdv_config').upsert({
        loja_id: lid,
        nome_mercadinho: c.nomeMercadinho || 'Meu Mercadinho',
        endereco: c.endereco || '',
        telefone: c.telefone || '',
      }),
      l.length && supabase.from('pdv_listas').upsert(l.map(li => toDbLista(li, lid))),
      o.length && supabase.from('pdv_operadores').upsert(o.map(op => toDbOperador(op, lid))),
    ])
  }

  function configurarRealtime(lid) {
    return supabase
      .channel(`pdv-sync-${lid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdv_produtos', filter: `loja_id=eq.${lid}` },
        ({ eventType, new: n, old: o }) => {
          if (eventType === 'DELETE') {
            setProdutos(prev => prev.filter(p => p.id !== o.id))
          } else {
            const p = fromDbProduto(n)
            setProdutos(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              if (idx >= 0) { const next = [...prev]; next[idx] = p; return next }
              return [...prev, p]
            })
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pdv_vendas', filter: `loja_id=eq.${lid}` },
        ({ new: n }) => {
          const v = fromDbVenda(n)
          setVendas(prev => prev.find(x => x.id === v.id) ? prev : [v, ...prev])
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdv_listas', filter: `loja_id=eq.${lid}` },
        ({ eventType, new: n, old: o }) => {
          if (eventType === 'DELETE') {
            setListas(prev => prev.filter(l => l.id !== o.id))
          } else {
            const l = fromDbLista(n)
            setListas(prev => {
              const idx = prev.findIndex(x => x.id === l.id)
              if (idx >= 0) { const next = [...prev]; next[idx] = l; return next }
              return [l, ...prev]
            })
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdv_config', filter: `loja_id=eq.${lid}` },
        ({ new: n }) => {
          if (n) setConfig(prev => ({
            geminiApiKey: prev.geminiApiKey || '',
            nomeMercadinho: n.nome_mercadinho || 'Meu Mercadinho',
            endereco: n.endereco || '',
            telefone: n.telefone || '',
          }))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdv_operadores', filter: `loja_id=eq.${lid}` },
        ({ eventType, new: n, old: o }) => {
          if (eventType === 'DELETE') {
            setOperadores(prev => prev.filter(op => op.id !== o.id))
          } else {
            const op = fromDbOperador(n)
            setOperadores(prev => {
              const idx = prev.findIndex(x => x.id === op.id)
              if (idx >= 0) { const next = [...prev]; next[idx] = op; return next }
              return [...prev, op]
            })
          }
        })
      .subscribe()
  }

  async function sincronizarComCodigo(novoCodigo) {
    if (!supabase || !novoCodigo.trim()) return 'sem_supabase'
    const { data } = await supabase.from('pdv_produtos').select('id').eq('loja_id', novoCodigo.trim()).limit(1)
    if (!data?.length) return 'nao_encontrado'
    localStorage.setItem('pdv_loja_id', novoCodigo.trim())
    return 'ok'
  }

  // ── Produtos ──────────────────────────────────────────────
  async function adicionarProduto(produto) {
    const novo = { custoCompra: 0, estoque: 0, estoqueMinimo: 0, codigosAlternativos: [], ...produto, id: uuidv4(), ativo: true }
    setProdutos(prev => [...prev, novo])
    if (supabase && lojaId) await supabase.from('pdv_produtos').insert(toDbProduto(novo, lojaId))
  }

  async function editarProduto(id, dados) {
    let atualizado
    setProdutos(prev => prev.map(p => {
      if (p.id !== id) return p
      atualizado = { ...p, ...dados }
      return atualizado
    }))
    if (supabase && atualizado && lojaId) {
      await supabase.from('pdv_produtos').update(toDbProduto(atualizado, lojaId)).eq('id', id)
    }
  }

  async function excluirProduto(id) {
    setProdutos(prev => prev.filter(p => p.id !== id))
    if (supabase) await supabase.from('pdv_produtos').delete().eq('id', id)
  }

  async function atualizarEstoque(id, delta) {
    const produto = produtos.find(p => p.id === id)
    if (!produto) return
    const novoEstoque = Math.max(0, (produto.estoque || 0) + delta)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, estoque: novoEstoque } : p))
    if (supabase) await supabase.from('pdv_produtos').update({ estoque: novoEstoque }).eq('id', id)
  }

  function buscarPorCodigo(codigo) {
    return produtos.find(p => p.ativo && (
      p.codigo === codigo || (p.codigosAlternativos || []).includes(codigo)
    ))
  }

  async function adicionarCodigoAlternativo(produtoId, codigo) {
    let atualizado
    setProdutos(prev => prev.map(p => {
      if (p.id !== produtoId) return p
      const alts = [...new Set([...(p.codigosAlternativos || []), codigo])]
      atualizado = { ...p, codigosAlternativos: alts }
      return atualizado
    }))
    if (supabase && atualizado) {
      try {
        await supabase.from('pdv_produtos')
          .update({ codigos_alternativos: atualizado.codigosAlternativos })
          .eq('id', produtoId)
      } catch { /* coluna pode não existir no Supabase */ }
    }
  }

  function buscarPorNome(termo) {
    const t = termo.toLowerCase()
    return produtos.filter(p => p.ativo && p.nome.toLowerCase().includes(t))
  }

  const produtosBaixoEstoque = produtos.filter(p =>
    p.ativo && p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo
  )

  // ── Vendas ────────────────────────────────────────────────
  async function registrarVenda(venda) {
    const novaVenda = {
      ...venda,
      id: uuidv4(),
      data: new Date().toISOString(),
      operadorId: operadorAtivo?.id || null,
      operadorNome: operadorAtivo?.nome || null,
    }
    setVendas(prev => [novaVenda, ...prev])
    venda.itens.forEach(item => {
      if (item.tipo === 'unidade') atualizarEstoque(item.produtoId, -item.quantidade)
    })
    if (supabase && lojaId) await supabase.from('pdv_vendas').insert(toDbVenda(novaVenda, lojaId))
    return novaVenda
  }

  async function salvarConfig(dados) {
    setConfig(prev => ({ ...prev, ...dados }))
    if (supabase && lojaId) await supabase.from('pdv_config').upsert({
      loja_id: lojaId,
      nome_mercadinho: dados.nomeMercadinho,
      endereco: dados.endereco,
      telefone: dados.telefone,
    })
  }

  // ── Listas de Reposição ───────────────────────────────────
  async function criarLista(nome, itensIniciais = []) {
    const itens = itensIniciais.map(item => ({ ...item, id: uuidv4(), comprado: false }))
    const nova = { id: uuidv4(), nome, dataCriacao: new Date().toISOString(), status: 'aberta', itens }
    setListas(prev => [nova, ...prev])
    if (supabase && lojaId) await supabase.from('pdv_listas').insert(toDbLista(nova, lojaId))
    return nova
  }

  async function adicionarItemLista(listaId, item) {
    let listaAtualizada
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      listaAtualizada = { ...l, itens: [...l.itens, { ...item, id: uuidv4(), comprado: false }] }
      return listaAtualizada
    }))
    if (supabase && listaAtualizada) {
      await supabase.from('pdv_listas').update({ itens: listaAtualizada.itens }).eq('id', listaId)
    }
  }

  async function removerItemLista(listaId, itemId) {
    let listaAtualizada
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      listaAtualizada = { ...l, itens: l.itens.filter(i => i.id !== itemId) }
      return listaAtualizada
    }))
    if (supabase && listaAtualizada) {
      await supabase.from('pdv_listas').update({ itens: listaAtualizada.itens }).eq('id', listaId)
    }
  }

  async function marcarItemComprado(listaId, itemId, dados) {
    let listaAtualizada
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      listaAtualizada = { ...l, itens: l.itens.map(i => i.id === itemId ? { ...i, comprado: true, ...dados } : i) }
      return listaAtualizada
    }))

    if (dados.resolucao === 'mesmo_produto' && dados.produtoId) {
      const produto = produtos.find(p => p.id === dados.produtoId)
      if (produto) {
        const novoEstoque = (produto.estoque || 0) + (dados.quantidadeComprada || 0)
        const novoPreco = dados.precoComprado || produto.preco
        setProdutos(prev => prev.map(p => p.id === dados.produtoId ? { ...p, estoque: novoEstoque, preco: novoPreco } : p))
        if (supabase) await supabase.from('pdv_produtos').update({ estoque: novoEstoque, preco: novoPreco }).eq('id', dados.produtoId)
      }
    }

    if (dados.resolucao === 'produto_novo') {
      await adicionarProduto({
        nome: dados.nomeProdutoNovo,
        codigo: dados.codigoNovo || `2${Date.now()}`.slice(0, 13),
        tipo: dados.tipoNovo || 'unidade',
        preco: dados.precoComprado || 0,
        categoria: dados.categoriaNova || 'mercearia',
        estoque: dados.quantidadeComprada || 0,
        estoqueMinimo: 0,
      })
    }

    if (supabase && listaAtualizada) {
      await supabase.from('pdv_listas').update({ itens: listaAtualizada.itens }).eq('id', listaId)
    }
  }

  async function desmarcarItemComprado(listaId, itemId) {
    let listaAtualizada
    setListas(prev => prev.map(l => {
      if (l.id !== listaId) return l
      listaAtualizada = {
        ...l, itens: l.itens.map(i => i.id === itemId ? {
          ...i, comprado: false,
          resolucao: undefined, quantidadeComprada: undefined,
          precoComprado: undefined, produtoId: undefined,
        } : i),
      }
      return listaAtualizada
    }))
    if (supabase && listaAtualizada) {
      await supabase.from('pdv_listas').update({ itens: listaAtualizada.itens }).eq('id', listaId)
    }
  }

  async function concluirLista(listaId) {
    const dataConclusao = new Date().toISOString()
    setListas(prev => prev.map(l => l.id === listaId ? { ...l, status: 'concluida', dataConclusao } : l))
    if (supabase) await supabase.from('pdv_listas').update({ status: 'concluida', data_conclusao: dataConclusao }).eq('id', listaId)
  }

  async function excluirLista(listaId) {
    setListas(prev => prev.filter(l => l.id !== listaId))
    if (supabase) await supabase.from('pdv_listas').delete().eq('id', listaId)
  }

  // ── Operadores ────────────────────────────────────────────
  async function adicionarOperador(nome, pin) {
    const novo = { id: uuidv4(), nome, pin, ativo: true, criadoEm: new Date().toISOString() }
    setOperadores(prev => [...prev, novo])
    if (supabase && lojaId) {
      try { await supabase.from('pdv_operadores').insert(toDbOperador(novo, lojaId)) } catch {}
    }
    return novo
  }

  async function editarOperador(id, dados) {
    let atualizado
    setOperadores(prev => prev.map(op => {
      if (op.id !== id) return op
      atualizado = { ...op, ...dados }
      return atualizado
    }))
    if (supabase && atualizado && lojaId) {
      try { await supabase.from('pdv_operadores').update(toDbOperador(atualizado, lojaId)).eq('id', id) } catch {}
    }
  }

  async function excluirOperador(id) {
    setOperadores(prev => prev.filter(op => op.id !== id))
    if (operadorAtivo?.id === id) setOperadorAtivo(null)
    if (supabase) {
      try { await supabase.from('pdv_operadores').delete().eq('id', id) } catch {}
    }
  }

  function ativarOperador(operador) {
    setOperadorAtivo(operador)
  }

  function desativarOperador() {
    setOperadorAtivo(null)
  }

  // ── Caixa ─────────────────────────────────────────────────
  function abrirCaixa(valorInicial) {
    const novo = {
      id: uuidv4(),
      abertura: new Date().toISOString(),
      valorInicial: Number(valorInicial) || 0,
      movimentacoes: [],
      fechamento: null,
    }
    setCaixaAtual(novo)
  }

  function adicionarMovimentacaoCaixa(tipo, valor, motivo) {
    const mov = { id: uuidv4(), tipo, valor: Number(valor), motivo: motivo || '', data: new Date().toISOString() }
    setCaixaAtual(prev => ({ ...prev, movimentacoes: [...prev.movimentacoes, mov] }))
  }

  function fecharCaixa(valorContado) {
    if (!caixaAtual) return
    const caixaFechado = {
      ...caixaAtual,
      fechamento: new Date().toISOString(),
      valorContado: Number(valorContado),
    }
    setHistoricosCaixa(prev => [caixaFechado, ...prev])
    setCaixaAtual(null)
  }

  const vendasHoje = vendas.filter(v => new Date(v.data).toDateString() === new Date().toDateString())
  const totalHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0)

  return (
    <AppContext.Provider value={{
      lojaId,
      sincStatus,
      produtos,
      vendas,
      vendasHoje,
      totalHoje,
      config,
      listas,
      produtosBaixoEstoque,
      operadores,
      operadorAtivo,
      adicionarProduto,
      editarProduto,
      excluirProduto,
      atualizarEstoque,
      buscarPorCodigo,
      buscarPorNome,
      adicionarCodigoAlternativo,
      registrarVenda,
      salvarConfig,
      criarLista,
      adicionarItemLista,
      removerItemLista,
      marcarItemComprado,
      desmarcarItemComprado,
      concluirLista,
      excluirLista,
      sincronizarComCodigo,
      adicionarOperador,
      editarOperador,
      excluirOperador,
      ativarOperador,
      desativarOperador,
      caixaAtual,
      historicosCaixa,
      abrirCaixa,
      fecharCaixa,
      adicionarMovimentacaoCaixa,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
