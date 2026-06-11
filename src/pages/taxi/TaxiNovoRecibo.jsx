import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaxi } from '../../context/TaxiContext'
import { valorExtenso, formatarMoeda, formatarDataExtenso, hojeISO } from '../../utils/extenso'
import { ArrowLeft, Eye, EyeOff, Check, Printer } from 'lucide-react'

function ReciboPreview({ dados, nomeMotorista }) {
  const valor = parseFloat(dados.valor) || 0
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-5 text-sm leading-relaxed"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <div className="flex items-start justify-between gap-2 mb-5">
        <div className="text-sm">
          <span className="font-bold" style={{ color: '#7C3AED' }}>Nº </span>
          <span>{dados.numero}</span>
        </div>
        <h2 className="text-2xl font-black tracking-widest" style={{ color: '#7C3AED' }}>
          RECIBO
        </h2>
        <div className="border-2 border-gray-800 px-2.5 py-1.5 text-xs">
          <span className="font-bold" style={{ color: '#7C3AED' }}>Valor: </span>
          <span className="font-semibold">{formatarMoeda(valor)}</span>
        </div>
      </div>

      <div className="border-b pb-2 mb-2" style={{ borderColor: '#7C3AED55' }}>
        <span className="font-bold" style={{ color: '#7C3AED' }}>Recebi(emos) de: </span>
        <span>{dados.cliente || '___________________'}</span>
      </div>

      <div className="border-b pb-2 mb-3" style={{ borderColor: '#7C3AED55' }}>
        <span className="font-bold" style={{ color: '#7C3AED' }}>A importância de: </span>
        <span>{valor > 0 ? valorExtenso(valor) : '___________________'}</span>
      </div>

      <div className="border-b-2 pb-2 mb-5" style={{ borderColor: '#7C3AED' }}>
        <span className="font-bold" style={{ color: '#7C3AED' }}>Referente: </span>
        <span>{dados.referente}</span>
      </div>

      <div className="mb-5 text-gray-700">{formatarDataExtenso(dados.data)}</div>

      <div className="border-b border-gray-300 pb-2 mb-5">
        <span className="font-bold" style={{ color: '#7C3AED' }}>Emitente: </span>
        <span>{nomeMotorista || '___________________'}</span>
      </div>

      <div>
        <span className="font-bold" style={{ color: '#7C3AED' }}>Assinatura: </span>
        <div className="border-b border-gray-300 h-10 mt-2" />
      </div>
    </div>
  )
}

export default function TaxiNovoRecibo() {
  const navigate = useNavigate()
  const { config, criarRecibo } = useTaxi()

  const [form, setForm] = useState({
    cliente: '',
    valor: '',
    referente: 'Serviço de táxi',
    data: hojeISO(),
  })
  const [preview, setPreview] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [erro, setErro] = useState('')

  const dadosPreview = { ...form, numero: config.proximoNumero }
  const valorNum = parseFloat(form.valor)

  function set(field) {
    return e => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (erro) setErro('')
    }
  }

  function handleSalvar() {
    if (!form.cliente.trim()) return setErro('Informe o nome do passageiro.')
    if (!form.valor || valorNum <= 0) return setErro('Informe um valor válido.')
    const recibo = criarRecibo({
      cliente: form.cliente.trim(),
      valor: valorNum,
      referente: form.referente.trim() || 'Serviço de táxi',
      data: form.data,
      emitente: config.nomeMotorista,
    })
    setSucesso(recibo)
  }

  if (sucesso) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 pb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Recibo criado!</h2>
        <p className="text-gray-500 text-sm mb-1">Nº {sucesso.numero}</p>
        <p className="text-gray-700 font-medium mb-6">{sucesso.cliente} — {formatarMoeda(sucesso.valor)}</p>
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate(`/taxi/recibo/${sucesso.id}`)}
            className="w-full bg-yellow-400 active:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Printer size={20} />
            Imprimir / Compartilhar
          </button>
          <button
            onClick={() => {
              setSucesso(null)
              setForm({ cliente: '', valor: '', referente: 'Serviço de táxi', data: hojeISO() })
            }}
            className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-4 rounded-2xl transition-colors"
          >
            Criar Novo Recibo
          </button>
          <button
            onClick={() => navigate('/taxi')}
            className="w-full text-gray-400 py-2 text-sm"
          >
            Ir para o início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl active:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Novo Recibo</h1>
        <button
          onClick={() => setPreview(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            preview
              ? 'bg-violet-100 text-violet-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {preview ? <EyeOff size={14} /> : <Eye size={14} />}
          Preview
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Preview do recibo */}
        {preview && (
          <ReciboPreview dados={dadosPreview} nomeMotorista={config.nomeMotorista} />
        )}

        {/* Formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          {/* Número automático */}
          <div>
            <label className="block text-xs font-bold text-violet-700 mb-1.5 uppercase tracking-wide">
              Nº do Recibo
            </label>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-500 text-sm">
              #{config.proximoNumero} — gerado automaticamente
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Recebido de *
            </label>
            <input
              type="text"
              value={form.cliente}
              onChange={set('cliente')}
              placeholder="Nome do passageiro ou empresa"
              autoComplete="off"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Valor (R$) *
            </label>
            <input
              type="number"
              value={form.valor}
              onChange={set('valor')}
              placeholder="0,00"
              step="0.01"
              min="0"
              inputMode="decimal"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            {valorNum > 0 && (
              <p className="text-xs text-violet-600 mt-1.5 italic font-medium">
                {valorExtenso(valorNum)}
              </p>
            )}
          </div>

          {/* Referente */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Referente
            </label>
            <input
              type="text"
              value={form.referente}
              onChange={set('referente')}
              placeholder="Serviço de táxi"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Data
            </label>
            <input
              type="date"
              value={form.data}
              onChange={set('data')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Emitente */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Emitente
            </label>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600">
              {config.nomeMotorista || (
                <span className="text-orange-500 font-medium">
                  ⚠️ Configure seu nome nas Configurações
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
            {erro}
          </div>
        )}

        <button
          onClick={handleSalvar}
          className="w-full bg-yellow-400 active:bg-yellow-500 active:scale-[0.98] text-yellow-900 font-bold py-4 rounded-2xl transition-all text-base"
        >
          Criar Recibo
        </button>
      </div>
    </div>
  )
}
