import { useState } from 'react'
import { Save, Store, CheckCircle, Copy, Link2, AlertCircle, Wifi, WifiOff, Loader2, ExternalLink, Eye, EyeOff, Download, FileText, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function baixarArquivo(conteudo, nome, tipo = 'text/csv') {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome; a.click()
  URL.revokeObjectURL(url)
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

export default function Configuracoes() {
  const { config, salvarConfig, lojaId, sincStatus, sincronizarComCodigo, produtos, vendas } = useApp()
  const { sair } = useAuth()
  const [form, setForm] = useState({ ...config })
  const [salvo, setSalvo] = useState(false)

  const [mostrarChave, setMostrarChave] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [codigoSync, setCodigoSync] = useState('')
  const [sincMsg, setSincMsg] = useState('')
  const [sincLoading, setSincLoading] = useState(false)

  function handleSalvar(e) {
    e.preventDefault()
    salvarConfig(form)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(lojaId)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function exportarProdutos() {
    const linhas = [
      ['Nome', 'Codigo', 'Tipo', 'Preco', 'CustoCompra', 'Categoria', 'Estoque', 'EstoqueMinimo'].join(','),
      ...produtos.map(p => [p.nome, p.codigo, p.tipo, p.preco, p.custoCompra || 0, p.categoria, p.estoque, p.estoqueMinimo].map(csvEscape).join(',')),
    ]
    baixarArquivo(linhas.join('\n'), `produtos_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function exportarVendas(periodo) {
    const agora = new Date()
    const filtradas = vendas.filter(v => {
      const d = new Date(v.data)
      if (periodo === 'mes') return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
      if (periodo === 'hoje') return d.toDateString() === agora.toDateString()
      return true
    })
    const linhas = [
      ['Data', 'Hora', 'Total', 'Pagamento', 'Troco', 'Operador', 'Itens'].join(','),
      ...filtradas.map(v => {
        const d = new Date(v.data)
        return [
          d.toLocaleDateString('pt-BR'),
          d.toLocaleTimeString('pt-BR'),
          v.total.toFixed(2),
          v.pagamento,
          (v.troco || 0).toFixed(2),
          v.operadorNome || '',
          v.itens.map(i => `${i.nome}×${i.quantidade || i.peso}`).join(' | '),
        ].map(csvEscape).join(',')
      }),
    ]
    const label = periodo === 'mes' ? `${agora.getMonth() + 1}-${agora.getFullYear()}` : periodo === 'hoje' ? agora.toISOString().slice(0, 10) : 'total'
    baixarArquivo(linhas.join('\n'), `vendas_${label}.csv`)
  }

  async function handleSincronizar() {
    if (!codigoSync.trim()) return
    setSincLoading(true)
    setSincMsg('')
    const resultado = await sincronizarComCodigo(codigoSync.trim())
    setSincLoading(false)
    if (resultado === 'ok') {
      setSincMsg('ok')
    } else if (resultado === 'nao_encontrado') {
      setSincMsg('nao_encontrado')
    } else {
      setSincMsg('sem_supabase')
    }
  }

  const sincStatusLabel = {
    idle: null,
    sincronizando: { icon: Loader2, text: 'Sincronizando com a nuvem...', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    ok: { icon: Wifi, text: 'Sincronizado com a nuvem', color: 'text-green-600 bg-green-50 border-green-200' },
    erro: { icon: WifiOff, text: 'Sem sincronização — dados salvos localmente', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  }[sincStatus]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Store size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
          <p className="text-sm text-gray-500">Dados do seu estabelecimento</p>
        </div>
      </div>

      {/* Status sincronização */}
      {sincStatusLabel && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${sincStatusLabel.color}`}>
          <sincStatusLabel.icon size={16} className={sincStatus === 'sincronizando' ? 'animate-spin' : ''} />
          {sincStatusLabel.text}
        </div>
      )}

      {/* Dados do mercadinho */}
      <form onSubmit={handleSalvar} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do mercadinho</label>
          <input
            type="text"
            value={form.nomeMercadinho}
            onChange={e => setForm(p => ({ ...p, nomeMercadinho: e.target.value }))}
            placeholder="Ex: Mercadinho do João"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
          <input
            type="text"
            value={form.endereco}
            onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
            placeholder="Ex: Rua das Flores, 123"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp</label>
          <input
            type="text"
            value={form.telefone}
            onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
            placeholder="Ex: (11) 99999-9999"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          {salvo ? <CheckCircle size={18} /> : <Save size={18} />}
          {salvo ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </form>

      {/* Sincronização entre dispositivos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Link2 size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Sincronização entre dispositivos</h3>
        </div>

        {!supabase ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-700">Supabase não configurado</p>
            <p>Para sincronizar celular e computador, configure as variáveis de ambiente:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 font-mono text-xs">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
            <p className="text-gray-500">Crie um projeto gratuito em <strong>supabase.com</strong> e execute o SQL em <code className="bg-gray-200 px-1 rounded">supabase/schema.sql</code></p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Código da loja */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Seu código de sincronização</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600 font-mono break-all">
                  {lojaId}
                </code>
                <button
                  onClick={copiarCodigo}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                >
                  {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Cole este código em outro dispositivo para sincronizar os dados</p>
            </div>

            {/* Sincronizar com outro código */}
            <div className="border-t pt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sincronizar com outra loja</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoSync}
                  onChange={e => setCodigoSync(e.target.value)}
                  placeholder="Cole o código da loja aqui"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={handleSincronizar}
                  disabled={!codigoSync.trim() || sincLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm disabled:opacity-40"
                >
                  {sincLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                  Vincular
                </button>
              </div>
              {sincMsg === 'ok' && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Vinculado! Recarregando dados...
                </p>
              )}
              {sincMsg === 'nao_encontrado' && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Código não encontrado. Verifique e tente novamente.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Config IA */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-violet-800">Entrada de Estoque por IA</h3>
        </div>
        <p className="text-sm text-violet-700">
          Cole sua chave gratuita do <strong>Google Gemini</strong> para ativar a leitura de notas. Cada conta tem <strong>1.500 análises/dia grátis</strong>.
        </p>

        <div>
          <label className="block text-sm font-medium text-violet-800 mb-1.5">Chave Gemini API</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={mostrarChave ? 'text' : 'password'}
                value={form.geminiApiKey || ''}
                onChange={e => setForm(p => ({ ...p, geminiApiKey: e.target.value }))}
                placeholder="AIzaSy..."
                className="w-full border-2 border-violet-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-violet-500 font-mono text-sm bg-white"
              />
              <button
                type="button"
                onClick={() => setMostrarChave(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600"
              >
                {mostrarChave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {form.geminiApiKey ? (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle size={12} /> Chave configurada — salve para ativar
            </p>
          ) : (
            <p className="text-xs text-violet-500 mt-1.5">Sem chave, a função Nota IA não funciona.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-violet-200 p-4 text-sm text-violet-700 space-y-1.5">
          <p className="font-medium">Como obter a chave (2 minutos):</p>
          <ol className="list-decimal list-inside space-y-1 text-violet-600">
            <li>Clique em "Abrir Google AI Studio" abaixo</li>
            <li>Faça login com sua conta Google</li>
            <li>Clique em <strong>"Create API key"</strong></li>
            <li>Copie a chave e cole aqui acima</li>
            <li>Clique em <strong>Salvar configurações</strong></li>
          </ol>
        </div>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          <ExternalLink size={14} />
          Abrir Google AI Studio
        </a>
      </div>

      {/* Backup / Exportar CSV */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Download size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-800">Backup e Exportação</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Exportar produtos</p>
            <button
              onClick={exportarProdutos}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <FileText size={16} />
              Baixar catálogo de produtos (.csv)
            </button>
            <p className="text-xs text-gray-400 mt-1">Exporta todos os produtos com preço, custo e estoque</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Exportar vendas</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportarVendas('hoje')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Download size={16} />
                Hoje
              </button>
              <button
                onClick={() => exportarVendas('mes')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Download size={16} />
                Este mês
              </button>
              <button
                onClick={() => exportarVendas('tudo')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Download size={16} />
                Tudo
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Exporta histórico de vendas com itens, pagamento e operador</p>
          </div>
        </div>
      </div>

      {/* Dica leitor */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Dica — Leitor de código de barras</h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          Conecte seu leitor USB normalmente ao notebook. Na tela PDV, clique no campo de busca e escaneie o produto — o código será digitado automaticamente. Se o produto não estiver cadastrado, você será avisado para cadastrá-lo primeiro em <strong>Produtos</strong>.
        </p>
      </div>

      {/* Começar loja nova / desvincular este aparelho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Começar uma loja nova</p>
          <p className="text-xs text-gray-400 mt-0.5">Desconecta este aparelho e gera um novo código. Os dados da loja na nuvem não são apagados.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Desconectar este aparelho e começar uma loja nova?\n\nOs dados da loja atual continuam salvos na nuvem (acessíveis pelo código). Este aparelho vai começar limpo.')) sair()
          }}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:border-red-400 px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          <LogOut size={16} />
          Loja nova
        </button>
      </div>
    </div>
  )
}
