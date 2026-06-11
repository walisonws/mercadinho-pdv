import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Package, Search, Plus, X, Sparkles, ChevronDown, Scissors, AlignLeft, Key, Eye, EyeOff, ExternalLink, QrCode } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { precoVendaSugerido, margemEfetiva } from '../utils/precos'
import ModalQrScanner from '../components/ModalQrScanner'

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

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
// Chave padrão do dono (env do Vercel). Usada quando o cliente não colou a dele,
// para a Nota IA funcionar sem nenhuma configuração. O campo em Configurações
// continua valendo como override pessoal.
const CHAVE_PADRAO = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()

async function chamarGemini(apiKey, contents, modelIdx = 0, tentativa = 0) {
  const model = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[0]
  const response = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.1, maxOutputTokens: 4096 } }),
  })
  if (!response.ok) {
    const errText = await response.text()
    let mensagem = 'Erro desconhecido. Tente novamente.'
    let code
    try {
      const errJson = JSON.parse(errText)
      code = errJson?.error?.code
      const violations = errJson?.error?.details?.find(d => d['@type']?.includes('QuotaFailure'))?.violations || []
      const quotaZerada = violations.some(v => v.quotaId?.includes('GenerateRequestsPerDay') || v.quotaId?.includes('FreeTier'))
      const chaveInvalida = errJson?.error?.details?.some(d => d.reason === 'API_KEY_INVALID')
      if (code === 400) {
        if (chaveInvalida) {
          // Auto-cura: se a chave colada pelo cliente é inválida (ex: sobrou uma
          // chave velha no aparelho), tenta automaticamente a chave padrão do sistema.
          if (CHAVE_PADRAO && apiKey !== CHAVE_PADRAO) {
            return chamarGemini(CHAVE_PADRAO, contents, 0, 0)
          }
          mensagem = 'Chave inválida. Gere uma nova chave em aistudio.google.com/apikey e cole em Configurações.'
        } else {
          mensagem = 'Não consegui ler esta nota (imagem ilegível ou formato não suportado). Tente uma foto mais nítida e reta, ou recorte só a parte dos itens.'
        }
      } else if (code === 429 || code === 403) {
        if (quotaZerada) {
          mensagem = 'Cota da chave esgotada (limite 0). Crie uma nova chave gratuita em aistudio.google.com/apikey e cole no campo acima.'
        } else {
          mensagem = 'Limite de requisições atingido. Aguarde alguns minutos e tente novamente.'
        }
      } else if (code === 503 || code === 500) {
        // Tenta modelo alternativo antes de desistir
        if (modelIdx + 1 < GEMINI_MODELS.length) {
          return chamarGemini(apiKey, contents, modelIdx + 1, 0)
        }
        // Retry no último modelo
        if (tentativa < 2) {
          await new Promise(r => setTimeout(r, 4000 * (tentativa + 1)))
          return chamarGemini(apiKey, contents, modelIdx, tentativa + 1)
        }
        mensagem = 'O serviço de IA está sobrecarregado agora. Aguarde 1 minuto e tente novamente.'
      }
    } catch { /* usa mensagem padrão */ }
    throw new Error(mensagem)
  }
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default function EntradaEstoque() {
  const { produtos, adicionarProduto, editarProduto, config, salvarConfig } = useApp()
  const [margem, setMargem] = useState(config?.margemPadrao ?? 30)
  const fileInputRef = useRef(null)

  const [imagem, setImagem] = useState(null)
  const [imagemPreview, setImagemPreview] = useState(null)
  const [etapa, setEtapa] = useState('upload') // 'upload' | 'analisando' | 'revisao' | 'aplicando' | 'concluido'
  const [erroApi, setErroApi] = useState('')
  const [itens, setItens] = useState([])
  const [melhorarImagem, setMelhorarImagem] = useState(false)
  const [modoCorte, setModoCorte] = useState(false)
  const [modoColar, setModoColar] = useState(false)
  const [textoNota, setTextoNota] = useState('')
  const [chaveInput, setChaveInput] = useState('')
  const [mostrarChave, setMostrarChave] = useState(false)
  const [salvandoChave, setSalvandoChave] = useState(false)
  const [chaveSalva, setChaveSalva] = useState(false)
  const [qrScannerAberto, setQrScannerAberto] = useState(false)
  const [qrMensagem, setQrMensagem] = useState('')

  function handleQrResult(texto) {
    setQrScannerAberto(false)
    const ehUrl = /^https?:\/\//i.test(texto)
    if (ehUrl) {
      window.open(texto, '_blank')
      setModoColar(true)
      setQrMensagem('A nota foi aberta numa nova aba. Selecione tudo (Ctrl+A), copie (Ctrl+C) e cole o texto abaixo.')
    } else {
      setTextoNota(texto)
      setModoColar(true)
      setQrMensagem('QR Code lido! Confira o texto e clique em Analisar.')
    }
  }

  async function salvarChave() {
    const chave = chaveInput.trim()
    if (!chave) return
    setSalvandoChave(true)
    await salvarConfig({ ...config, geminiApiKey: chave })
    setSalvandoChave(false)
    setChaveSalva(true)
    setTimeout(() => setChaveSalva(false), 3000)
  }

  function handleCrop(blob) {
    const file = new File([blob], 'nota_recortada.jpg', { type: 'image/jpeg' })
    setImagem(file)
    setImagemPreview(URL.createObjectURL(blob))
    setModoCorte(false)
    setErroApi('')
  }

  async function analisarTexto() {
    if (!textoNota.trim()) return
    const apiKey = config?.geminiApiKey?.trim() || CHAVE_PADRAO
    if (!apiKey) {
      setErroApi('Chave Gemini não configurada. Vá em Configurações e adicione sua chave gratuita.')
      return
    }
    setEtapa('analisando')
    setErroApi('')
    try {
      const promptTexto = `Você é um especialista em notas fiscais brasileiras. Analise o texto abaixo e identifique os produtos.

REGRAS:
- Ignore linhas de desconto, totais, impostos e informações que não sejam itens
- Se o mesmo produto aparecer múltiplas vezes, some as quantidades
- Nome do produto: limpo, sem códigos numéricos no início

Para cada item retorne:
- nome: nome limpo do produto
- quantidade: quantidade numérica (number)
- unidade: "un" para unidade/peça, "kg" para quilogramas, "cx" para caixa, "fd" para fardo, "lt" para litro, "pc" para pacote
- preco_unitario: preço unitário em reais (number)
- codigo: código de barras EAN/GTIN do produto (string, somente dígitos, se presente na nota; senão "")

TEXTO DA NOTA:
${textoNota}

Retorne SOMENTE JSON válido, sem texto adicional:
{"itens": [{"nome": "Banana Nanica kg", "quantidade": 14.84, "unidade": "kg", "preco_unitario": 4.99, "codigo": "7891234567890"}]}

Se não encontrar itens: {"itens": []}`
      const rawText = await chamarGemini(apiKey, [{ parts: [{ text: promptTexto }] }])
      let parsed = { itens: [] }
      try { const m = rawText.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]) } catch { /* */ }
      if (!parsed.itens?.length) throw new Error('Nenhum item encontrado. Verifique se o texto contém produtos com quantidades e preços.')
      const itensProcessados = parsed.itens.map((item, i) => {
        const codigoNota = (item.codigo || '').replace(/\D/g, '')
        const porCodigo = codigoNota ? produtos.find(p => p.ativo && (p.codigo === codigoNota || (p.codigosAlternativos || []).includes(codigoNota))) : null
        const sugestoes = produtos.filter(p =>
          p.ativo && p.nome.toLowerCase().includes((item.nome || '').toLowerCase().slice(0, 4))
        ).slice(0, 5)
        const produtoMatch = porCodigo || sugestoes[0] || null
        return {
          _id: i, nomeOriginal: item.nome || '', nome: item.nome || '',
          quantidade: item.quantidade || 1, unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          codigo: codigoNota,
          margem,
          precoVenda: precoVendaSugerido(item.preco_unitario || 0, margem),
          vendaEditada: false,
          resolucao: produtoMatch ? 'existente' : 'novo',
          produtoId: produtoMatch?.id || '', sugestoes,
          categoria: 'mercearia', tipo: 'unidade', selecionarProduto: false, ativo: true,
        }
      })
      setItens(itensProcessados)
      setEtapa('revisao')
    } catch (err) {
      setErroApi(err.message)
      setEtapa('upload')
    }
  }

  function handleArquivo(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImagem(file)
    setImagemPreview(URL.createObjectURL(file))
    setErroApi('')
    setEtapa('upload')
  }

  async function analisarNota() {
    if (!imagem) return
    const apiKey = config?.geminiApiKey?.trim() || CHAVE_PADRAO
    if (!apiKey) {
      setErroApi('Chave Gemini não configurada. Vá em Configurações e adicione sua chave gratuita.')
      return
    }
    setEtapa('analisando')
    setErroApi('')
    try {
      const { base64, mimeType } = await comprimirImagem(imagem, 2000, melhorarImagem)
      const prompt = `Você é um especialista em leitura de notas fiscais brasileiras. Analise a imagem com atenção máxima.

TIPOS DE DOCUMENTO que você pode receber:
1. DANF-e / NF-e: tabela com colunas Código, Descrição, QTD, V.UN, V.TOTAL
2. NFC-e (cupom fiscal eletrônico): formato estreito, cada item em 2 linhas:
   - Linha 1: número do item + código + NOME DO PRODUTO + unidade
   - Linha 2: quantidade + "Kg" ou "Un" + "x" + preço unitário + valor total
   Exemplo: "001  576 BANANA NANICA kg" / "3,035 Kg x  4,99  15,14"
3. Nota de atacado / armazém: formato livre, menos estruturado

REGRAS IMPORTANTES:
- Ignore anotações manuscritas (valores escritos à mão sobre o impresso)
- Ignore linhas de "Desconto no item X"
- Para NFC-e, use o preço da linha 2 (valor numérico após o "x"), não o preço riscado ou manuscrito
- Nome do produto: use o nome impresso, limpo, sem códigos numéricos no início
- Se o mesmo produto aparecer múltiplas vezes, some as quantidades em um único item

Para cada item retorne:
- nome: nome limpo do produto (ex: "Banana Nanica kg", "Arroz 5kg", "Coca-Cola 2L")
- quantidade: quantidade numérica (number)
- unidade: "un" para unidade/peça, "kg" para quilogramas, "cx" para caixa, "fd" para fardo, "lt" para litro, "pc" para pacote
- preco_unitario: preço unitário em reais (number, ex: 4.99)
- codigo: código de barras EAN/GTIN do produto (string, somente dígitos, se visível na nota; senão "")

Retorne SOMENTE JSON válido, sem texto adicional:
{"itens": [{"nome": "Banana Nanica kg", "quantidade": 14.84, "unidade": "kg", "preco_unitario": 4.99, "codigo": "7891234567890"}]}

Se não encontrar itens: {"itens": []}`

      const contents = [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }]
      const rawText = await chamarGemini(apiKey, contents)
      let parsed = { itens: [] }
      try { const m = rawText.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]) } catch { /* */ }
      if (!parsed.itens?.length) throw new Error('Nenhum item encontrado na imagem. Tente uma foto mais clara.')

      const itensProcessados = parsed.itens.map((item, i) => {
        const codigoNota = (item.codigo || '').replace(/\D/g, '')
        const porCodigo = codigoNota ? produtos.find(p => p.ativo && (p.codigo === codigoNota || (p.codigosAlternativos || []).includes(codigoNota))) : null
        const sugestoes = produtos.filter(p =>
          p.ativo && p.nome.toLowerCase().includes((item.nome || '').toLowerCase().slice(0, 4))
        ).slice(0, 5)
        const produtoMatch = porCodigo || sugestoes[0] || null
        return {
          _id: i,
          nomeOriginal: item.nome || '',
          nome: item.nome || '',
          quantidade: item.quantidade || 1,
          unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          codigo: codigoNota,
          margem,
          precoVenda: precoVendaSugerido(item.preco_unitario || 0, margem),
          vendaEditada: false,
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
    setItens(prev => prev.map(i => {
      if (i._id !== id) return i
      const atualizado = { ...i, [campo]: valor }
      if (campo === 'margem') {
        atualizado.vendaEditada = true
        atualizado.precoVenda = precoVendaSugerido(atualizado.precoUnitario || 0, valor || 0)
      } else if (campo === 'precoVenda') {
        atualizado.vendaEditada = true
        atualizado.margem = margemEfetiva(atualizado.precoUnitario || 0, valor || 0)
      } else if (campo === 'precoUnitario') {
        if (atualizado.vendaEditada) {
          // mantém a venda personalizada; só atualiza a % mostrada
          atualizado.margem = margemEfetiva(valor || 0, atualizado.precoVenda || 0)
        } else {
          atualizado.precoVenda = precoVendaSugerido(valor || 0, atualizado.margem ?? 0)
        }
      }
      return atualizado
    }))
  }

  function aplicarMargemTodos() {
    setItens(prev => prev.map(i =>
      i.vendaEditada
        ? i
        : { ...i, margem, precoVenda: precoVendaSugerido(i.precoUnitario || 0, margem) }
    ))
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
            custoCompra: item.precoUnitario || produto.custoCompra || 0,
            preco: item.precoVenda || produto.preco,
          })
        }
      } else if (item.resolucao === 'novo') {
        await adicionarProduto({
          nome: item.nome,
          codigo: item.codigo || `2${Date.now()}${Math.random().toString().slice(2, 5)}`.slice(0, 13),
          tipo: item.tipo,
          preco: item.precoVenda || 0,
          custoCompra: item.precoUnitario || 0,
          categoria: item.categoria,
          estoque: item.quantidade,
          estoqueMinimo: 0,
        })
      }
    }
    if (margem !== (config?.margemPadrao ?? 30)) {
      await salvarConfig({ ...config, margemPadrao: margem })
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

      {/* Setup inline quando não tem chave (nem a do cliente, nem a padrão do sistema) */}
      {!config?.geminiApiKey?.trim() && !CHAVE_PADRAO && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-2xl p-6 space-y-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shrink-0">
              <Key size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-violet-900 text-lg">Ativar Nota IA</h2>
              <p className="text-sm text-violet-600">Adicione sua chave gratuita do Google para começar</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-violet-200 p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-700">Como obter a chave (2 minutos):</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Clique em <strong>"Abrir Google AI Studio"</strong> abaixo</li>
              <li>Faça login com sua conta Google</li>
              <li>Clique em <strong>"Create API key"</strong> → copie a chave</li>
              <li>Cole aqui e clique em <strong>Ativar</strong></li>
            </ol>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-violet-600 font-semibold hover:text-violet-800 mt-1"
            >
              <ExternalLink size={14} /> Abrir Google AI Studio
            </a>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-violet-800">Cole sua chave aqui:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={mostrarChave ? 'text' : 'password'}
                  value={chaveInput}
                  onChange={e => setChaveInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && salvarChave()}
                  placeholder="AIzaSy..."
                  className="w-full border-2 border-violet-300 rounded-xl px-4 py-3 pr-10 font-mono text-sm focus:outline-none focus:border-violet-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setMostrarChave(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600"
                >
                  {mostrarChave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={salvarChave}
                disabled={!chaveInput.trim() || salvandoChave}
                className="flex items-center gap-2 bg-violet-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {salvandoChave ? <Loader2 size={16} className="animate-spin" /> : chaveSalva ? <CheckCircle size={16} /> : <Key size={16} />}
                {chaveSalva ? 'Ativado!' : 'Ativar'}
              </button>
            </div>
            <p className="text-xs text-violet-500">A chave fica salva só neste dispositivo. 1.500 análises grátis por dia.</p>
          </div>
        </div>
      )}

      {/* Etapa: upload */}
      {(etapa === 'upload' || etapa === 'analisando') && (
        <div className="space-y-4">
          {/* Ferramenta de recorte */}
          {modoCorte && imagemPreview && (
            <CropTool imageSrc={imagemPreview} onCrop={handleCrop} onCancel={() => setModoCorte(false)} />
          )}

          {/* Área de upload */}
          {!modoCorte && <div
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagemPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img src={imagemPreview} alt="Nota" className="max-h-64 rounded-xl object-contain shadow" />
                <button
                  onClick={e => { e.stopPropagation(); setModoCorte(true) }}
                  className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-semibold bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg"
                >
                  <Scissors size={12} /> Recortar foto
                </button>
              </div>
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
          </div>}

          {/* Botões selecionar/câmera — ocultos no modo corte ou colar */}
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

          {/* Botão: escanear QR Code da nota */}
          <button
            onClick={() => setQrScannerAberto(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 hover:border-violet-400 hover:text-violet-700 transition-all text-sm font-medium"
          >
            <QrCode size={16} />
            <span>Escanear QR Code da nota</span>
          </button>

          {/* Toggle: colar texto de outra IA */}
          <button
            onClick={() => setModoColar(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              modoColar ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlignLeft size={16} />
              <span>Colar texto de outra IA</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${modoColar ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${modoColar ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Área de texto quando colar está ativo */}
          {modoColar && (
            <div className="space-y-2">
              {qrMensagem && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-xs text-violet-700 font-medium">
                  {qrMensagem}
                </div>
              )}
              <p className="text-xs text-blue-600 font-medium">Cole o texto que o ChatGPT, Gemini ou outra IA extraiu da nota:</p>
              <textarea
                value={textoNota}
                onChange={e => setTextoNota(e.target.value)}
                placeholder={'Exemplo:\nBanana Nanica 3kg - R$ 4,99/kg\nArroz Tio João 5kg - R$ 24,90\nFeijão Carioca 1kg - R$ 8,50'}
                className="w-full h-44 border-2 border-blue-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={analisarTexto}
                disabled={!textoNota.trim() || etapa === 'analisando'}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {etapa === 'analisando' ? <Loader2 size={18} className="animate-spin" /> : <AlignLeft size={18} />}
                Analisar texto
              </button>
            </div>
          )}

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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">{erroApi}</p>
                  {!melhorarImagem && (
                    <p className="text-xs text-red-500 mt-1">Tente ativar "Nota escura ou papel fino" e analisar novamente.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {imagemPreview && (
                  <button
                    onClick={() => setModoCorte(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-violet-300 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-50"
                  >
                    <Scissors size={13} /> Recortar foto
                  </button>
                )}
                <button
                  onClick={() => { setModoColar(true); setErroApi('') }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-blue-300 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-50"
                >
                  <AlignLeft size={13} /> Colar texto
                </button>
              </div>
            </div>
          )}

          <button
            onClick={analisarNota}
            disabled={!imagem || etapa === 'analisando' || (!config?.geminiApiKey?.trim() && !CHAVE_PADRAO)}
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

          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-sm font-semibold text-violet-800">Margem geral</span>
            <input
              type="number"
              min={0}
              step="1"
              value={margem}
              onChange={e => setMargem(parseFloat(e.target.value) || 0)}
              className="w-20 border-2 border-violet-200 rounded-lg px-3 py-1.5 text-sm font-bold text-violet-800 focus:outline-none focus:border-violet-500"
            />
            <span className="text-sm font-semibold text-violet-800">%</span>
            <button
              onClick={aplicarMargemTodos}
              className="ml-auto bg-violet-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
            >
              Aplicar a todos
            </button>
          </div>
          <p className="text-xs text-violet-600 -mt-2 mb-4 px-1">
            "Aplicar a todos" muda só os itens que você não ajustou na mão.
          </p>

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

      {qrScannerAberto && (
        <ModalQrScanner
          onResult={handleQrResult}
          onFechar={() => setQrScannerAberto(false)}
        />
      )}
    </div>
  )
}

function CropTool({ imageSrc, onCrop, onCancel }) {
  const [top, setTop] = useState(0)
  const [bottom, setBottom] = useState(100)
  const [left, setLeft] = useState(0)
  const [right, setRight] = useState(100)
  const imgRef = useRef(null)

  function confirmar() {
    const img = imgRef.current
    if (!img) return
    const canvas = document.createElement('canvas')
    const natW = img.naturalWidth, natH = img.naturalHeight
    const x = Math.round((left / 100) * natW)
    const y = Math.round((top / 100) * natH)
    const w = Math.round(((right - left) / 100) * natW)
    const h = Math.round(((bottom - top) / 100) * natH)
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h)
    canvas.toBlob(blob => onCrop(blob), 'image/jpeg', 0.92)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">Arraste os controles para focar nos produtos:</p>
      <div className="relative select-none rounded-xl overflow-hidden">
        <img src={imageSrc} className="w-full" style={{ filter: 'brightness(0.3)' }} />
        <img
          ref={imgRef}
          src={imageSrc}
          className="absolute top-0 left-0 w-full"
          style={{ clipPath: `inset(${top}% ${100 - right}% ${100 - bottom}% ${left}%)` }}
          crossOrigin="anonymous"
        />
        <div className="absolute pointer-events-none" style={{
          top: `${top}%`, left: `${left}%`,
          width: `${right - left}%`, height: `${bottom - top}%`,
          border: '2px solid #7c3aed', borderRadius: 4,
        }} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {[
          { label: 'Cortar topo', value: top, onChange: v => setTop(Math.min(v, bottom - 10)), max: bottom - 10 },
          { label: 'Cortar base', value: 100 - bottom, onChange: v => setBottom(Math.max(100 - v, top + 10)), max: 100 - top - 10 },
          { label: 'Cortar esq.', value: left, onChange: v => setLeft(Math.min(v, right - 10)), max: right - 10 },
          { label: 'Cortar dir.', value: 100 - right, onChange: v => setRight(Math.max(100 - v, left + 10)), max: 100 - left - 10 },
        ].map(({ label, value, onChange, max }) => (
          <div key={label}>
            <label className="block text-xs text-gray-600 font-medium mb-1">{label}: {value}%</label>
            <input
              type="range" min={0} max={max} value={value}
              onChange={e => onChange(+e.target.value)}
              className="w-full accent-violet-600"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={confirmar} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700">
          Usar recorte
        </button>
      </div>
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
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">{item.quantidade} {item.unidade}</span>
              {item.precoUnitario > 0 && (
                <span className="text-xs text-gray-500">custo R$ {item.precoUnitario.toFixed(2)}</span>
              )}
              {item.precoVenda > 0 && (
                <span className="text-xs font-semibold text-green-700">venda R$ {item.precoVenda.toFixed(2)}</span>
              )}
              {item.precoVenda > 0 && item.precoUnitario > 0 && (
                <span className="text-xs font-medium text-emerald-600">
                  lucro R$ {(item.precoVenda - item.precoUnitario).toFixed(2)}
                </span>
              )}
            </div>

            {/* Margem (%) editável por item */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Lucro</span>
              <input
                type="number"
                min={0}
                step="1"
                value={item.margem ?? 0}
                onChange={e => onAtualizar('margem', parseFloat(e.target.value) || 0)}
                className="w-16 border-2 border-violet-200 rounded-lg px-2 py-1 text-sm font-bold text-violet-700 text-center focus:outline-none focus:border-violet-500"
              />
              <span className="text-xs text-gray-500">%</span>
              {item.vendaEditada && (
                <span className="text-[10px] text-violet-500 font-semibold bg-violet-50 px-1.5 py-0.5 rounded">
                  personalizado
                </span>
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
          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={item.precoUnitario}
                onChange={e => onAtualizar('precoUnitario', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={item.precoVenda}
                onChange={e => onAtualizar('precoVenda', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-green-200 rounded-xl px-3 py-2 text-sm font-semibold text-green-700 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {item.precoVenda > 0 && item.precoUnitario > 0 && (
            <p className="text-xs text-emerald-600 font-medium -mt-2">
              Lucro por unidade: R$ {(item.precoVenda - item.precoUnitario).toFixed(2)}
            </p>
          )}

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
