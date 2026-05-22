import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Package, Search, Plus, X, Sparkles, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'

const categorias = ['mercearia', 'bebidas', 'frutas', 'verduras', 'carnes', 'frios', 'limpeza', 'higiene', 'outros']

const UNIDADES_MAP = {
  un: 'unidades', unidade: 'unidades', unidades: 'unidades', pc: 'unidades', pç: 'unidades',
  kg: 'kg', kgs: 'kg',
  cx: 'caixas', caixa: 'caixas', caixas: 'caixas',
  fd: 'fardos', fardo: 'fardos', fardos: 'fardos',
  lt: 'litros', litro: 'litros', litros: 'litros', l: 'litros',
  pc2: 'pacotes', pacote: 'pacotes', pacotes: 'pacotes', sc: 'pacotes', saco: 'pacotes',
}

function normalizarUnidade(u = '') {
  return UNIDADES_MAP[u.toLowerCase().trim()] || u
}

async function comprimirImagem(file, maxWidth = 2000, melhorar = false) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      if (melhorar) {
        // aumenta contraste e remove cor para texto ficar mais legível
        ctx.filter = 'grayscale(1) contrast(1.6) brightness(1.15)'
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        const reader = new FileReader()
        reader.onloadend = () => resolve({
          base64: reader.result.split(',')[1],
          mimeType: 'image/jpeg',
        })
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.92)
    }
    img.src = url
  })
}

export default function EntradaEstoque() {
  const { produtos, adicionarProduto, editarProduto } = useApp()
  const fileInputRef = useRef(null)
  const cameraRef = useRef(null)

  const [imagem, setImagem] = useState(null)
  const [imagemPreview, setImagemPreview] = useState(null)
  const [etapa, setEtapa] = useState('upload') // 'upload' | 'analisando' | 'revisao' | 'aplicando' | 'concluido'
  const [erroApi, setErroApi] = useState('')
  const [itens, setItens] = useState([])
  const [melhorarImagem, setMelhorarImagem] = useState(false)

  function handleArquivo(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImagem(file)
    setImagemPreview(URL.createObjectURL(file))
    setErroApi('')
    setEtapa('upload')
  }

  async function analisarNota() {
    if (!imagem) return
    setEtapa('analisando')
    setErroApi('')
    try {
      const { base64, mimeType } = await comprimirImagem(imagem, 2000, melhorarImagem)
      const res = await fetch('/api/ler-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemBase64: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detalhe ? `${data.erro}: ${data.detalhe}` : (data.erro || 'Erro ao analisar nota'))
      if (!data.itens?.length) throw new Error('Nenhum item encontrado na imagem. Tente uma foto mais clara.')

      const itensProcessados = data.itens.map((item, i) => {
        const sugestoes = produtos.filter(p =>
          p.ativo && p.nome.toLowerCase().includes((item.nome || '').toLowerCase().slice(0, 4))
        ).slice(0, 5)
        const produtoMatch = sugestoes[0] || null
        return {
          _id: i,
          nomeOriginal: item.nome || '',
          nome: item.nome || '',
          quantidade: item.quantidade || 1,
          unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          resolucao: produtoMatch ? 'existente' : 'novo',
          produtoId: produtoMatch?.id || '',
          sugestoes,
          categoria: 'mercearia',
          tipo: 'unidade',
          selecionarProduto: false,
          ativo: true,
        }
      })
      setItens(itensProcessados)
      setEtapa('revisao')
    } catch (err) {
      setErroApi(err.message)
      setEtapa('upload')
    }
  }

  function atualizarItem(id, campo, valor) {
    setItens(prev => prev.map(i => i._id === id ? { ...i, [campo]: valor } : i))
  }

  function removerItem(id) {
    setItens(prev => prev.filter(i => i._id !== id))
  }

  async function aplicarNoEstoque() {
    setEtapa('aplicando')
    for (const item of itens) {
      if (!item.ativo) continue
      if (item.resolucao === 'existente' && item.produtoId) {
        const produto = produtos.find(p => p.id === item.produtoId)
        if (produto) {
          await editarProduto(item.produtoId, {
            estoque: (produto.estoque || 0) + item.quantidade,
            preco: item.precoUnitario || produto.preco,
          })
        }
      } else if (item.resolucao === 'novo') {
        await adicionarProduto({
          nome: item.nome,
          codigo: `2${Date.now()}${Math.random().toString().slice(2, 5)}`.slice(0, 13),
          tipo: item.tipo,
          preco: item.precoUnitario || 0,
          categoria: item.categoria,
          estoque: item.quantidade,
          estoqueMinimo: 0,
        })
      }
    }
    setEtapa('concluido')
  }

  function reiniciar() {
    setImagem(null)
    setImagemPreview(null)
    setItens([])
    setErroApi('')
    setEtapa('upload')
  }

  const itensAtivos = itens.filter(i => i.ativo)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Entrada de Estoque por IA</h1>
          <p className="text-sm text-gray-500">Fotografe qualquer nota fiscal e o sistema lança automaticamente</p>
        </div>
      </div>

      {/* Etapa: upload */}
      {(etapa === 'upload' || etapa === 'analisando') && (
        <div className="space-y-4">
          {/* Área de upload */}
          <div
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagemPreview ? (
              <img src={imagemPreview} alt="Nota" className="max-h-64 rounded-xl object-contain shadow" />
            ) : (
              <>
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Camera size={32} className="text-violet-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">Toque para fotografar ou selecionar a nota</p>
                  <p className="text-sm text-gray-400 mt-1">DANFE, nota de armazém, qualquer documento de compra</p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handleArquivo(e.target.files[0])}
            />
          </div>

          {/* Botão câmera para desktop (sem capture) */}
          <div className="flex gap-3">
            <button
              onClick={() => { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click() }}
              className="flex items-center gap-2 flex-1 justify-center border-2 border-gray-200 text-gray-600 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              <Upload size={16} />
              Selecionar arquivo
            </button>
            <button
              onClick={() => { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click() }}
              className="flex items-center gap-2 flex-1 justify-center border-2 border-violet-200 text-violet-600 px-4 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors text-sm"
            >
              <Camera size={16} />
              Abrir câmera
            </button>
          </div>

          {/* Toggle: nota escura / papel fino */}
          <button
            onClick={() => setMelhorarImagem(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              melhorarImagem
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌗</span>
              <span>Nota escura ou papel fino</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${melhorarImagem ? 'bg-violet-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${melhorarImagem ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {erroApi && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">{erroApi}</p>
                {!melhorarImagem && (
                  <p className="text-xs text-red-500 mt-1">Tente ativar "Nota escura ou papel fino" e analisar novamente.</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={analisarNota}
            disabled={!imagem || etapa === 'analisando'}
            className="w-full flex items-center justify-center gap-3 bg-violet-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {etapa === 'analisando' ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Analisando nota com IA...
              </>
            ) : (
              <>
                <Sparkles size={22} />
                Analisar Nota
              </>
            )}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Como funciona</p>
            <ul className="space-y-1 text-blue-600 list-disc list-inside">
              <li>Fotografe a nota fiscal, cupom ou nota de armazém</li>
              <li>A IA lê os produtos, quantidades e preços automaticamente</li>
              <li>Você revisa e confirma antes de aplicar ao estoque</li>
            </ul>
          </div>
        </div>
      )}

      {/* Etapa: revisão */}
      {etapa === 'revisao' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-800">{itens.length} item(ns) encontrado(s)</p>
              <p className="text-sm text-gray-500">Revise e confirme antes de aplicar ao estoque</p>
            </div>
            <button onClick={reiniciar} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X size={14} /> Nova nota
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {itens.map(item => (
              <ItemRevisao
                key={item._id}
                item={item}
                produtos={produtos}
                onAtualizar={(campo, valor) => atualizarItem(item._id, campo, valor)}
                onRemover={() => removerItem(item._id)}
              />
            ))}
          </div>

          {itensAtivos.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700 mb-4">
              Todos os itens foram removidos. Tire nova foto ou adicione itens.
            </div>
          )}

          <button
            onClick={aplicarNoEstoque}
            disabled={itensAtivos.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-40"
          >
            <CheckCircle size={22} />
            Aplicar {itensAtivos.length} item(ns) ao estoque
          </button>
        </div>
      )}

      {/* Etapa: aplicando */}
      {etapa === 'aplicando' && (
        <div className="bg-white rounded-2xl p-16 flex flex-col items-center gap-4 shadow-sm border border-gray-100">
          <Loader2 size={48} className="text-green-500 animate-spin" />
          <p className="font-semibold text-gray-700 text-lg">Aplicando ao estoque...</p>
          <p className="text-sm text-gray-400">Atualizando produtos e sincronizando</p>
        </div>
      )}

      {/* Etapa: concluído */}
      {etapa === 'concluido' && (
        <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={44} className="text-green-600" />
          </div>
          <p className="font-bold text-gray-800 text-2xl">Estoque atualizado!</p>
          <p className="text-gray-500 text-center">
            {itensAtivos.length} produto(s) lançado(s) com sucesso
          </p>
          <button
            onClick={reiniciar}
            className="mt-2 flex items-center gap-2 bg-violet-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            <Camera size={18} />
            Lançar outra nota
          </button>
        </div>
      )}
    </div>
  )
}

function ItemRevisao({ item, produtos, onAtualizar, onRemover }) {
  const [expandido, setExpandido] = useState(false)
  const [buscaProduto, setBuscaProduto] = useState('')

  const produtoSelecionado = produtos.find(p => p.id === item.produtoId)
  const sugestoesFiltradas = buscaProduto.length >= 2
    ? produtos.filter(p => p.ativo && p.nome.toLowerCase().includes(buscaProduto.toLowerCase())).slice(0, 6)
    : item.sugestoes

  if (!item.ativo) return null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Linha principal */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Package size={16} className="text-violet-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm leading-tight">{item.nomeOriginal}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">{item.quantidade} {item.unidade}</span>
              {item.precoUnitario > 0 && (
                <span className="text-xs font-medium text-green-700">R$ {item.precoUnitario.toFixed(2)}/un</span>
              )}
            </div>

            {/* Badge de resolução */}
            {item.resolucao === 'existente' && produtoSelecionado ? (
              <div className="mt-2 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                <CheckCircle size={12} className="text-blue-600 shrink-0" />
                <span className="text-xs text-blue-700 font-medium truncate">
                  → {produtoSelecionado.nome} (estoque atual: {produtoSelecionado.estoque})
                </span>
              </div>
            ) : item.resolucao === 'novo' ? (
              <div className="mt-2 flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                <Plus size={12} className="text-green-600 shrink-0" />
                <span className="text-xs text-green-700 font-medium">Cadastrar como novo produto</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpandido(!expandido)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ChevronDown size={16} className={`transition-transform ${expandido ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onRemover}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Painel expandido */}
      {expandido && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* Quantidade e preço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
              <input
                type="number"
                value={item.quantidade}
                onChange={e => onAtualizar('quantidade', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preço unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                value={item.precoUnitario}
                onChange={e => onAtualizar('precoUnitario', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Vincular a produto existente vs novo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Vincular ao estoque</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => onAtualizar('resolucao', 'existente')}
                className={`py-2 text-sm rounded-xl border-2 font-semibold transition-all ${
                  item.resolucao === 'existente' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                Produto existente
              </button>
              <button
                onClick={() => onAtualizar('resolucao', 'novo')}
                className={`py-2 text-sm rounded-xl border-2 font-semibold transition-all ${
                  item.resolucao === 'novo' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                Novo produto
              </button>
            </div>

            {item.resolucao === 'existente' && (
              <div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={buscaProduto}
                    onChange={e => setBuscaProduto(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sugestoesFiltradas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onAtualizar('produtoId', p.id); setBuscaProduto('') }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm border-2 transition-all ${
                        item.produtoId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <span className="font-medium text-gray-800">{p.nome}</span>
                      <span className="text-gray-400 ml-2 text-xs">estoque: {p.estoque}</span>
                    </button>
                  ))}
                  {sugestoesFiltradas.length === 0 && buscaProduto.length >= 2 && (
                    <p className="text-xs text-gray-400 text-center py-2">Nenhum produto encontrado</p>
                  )}
                </div>
              </div>
            )}

            {item.resolucao === 'novo' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome do produto</label>
                  <input
                    type="text"
                    value={item.nome}
                    onChange={e => onAtualizar('nome', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select
                      value={item.tipo}
                      onChange={e => onAtualizar('tipo', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
                    >
                      <option value="unidade">Por unidade</option>
                      <option value="peso">Por peso (kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                    <select
                      value={item.categoria}
                      onChange={e => onAtualizar('categoria', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
                    >
                      {categorias.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
