import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTaxi } from '../../context/TaxiContext'
import { valorExtenso, formatarMoeda, formatarDataExtenso } from '../../utils/extenso'
import { ArrowLeft, Printer, MessageCircle, Copy, Check } from 'lucide-react'

const PURPLE = '#7C3AED'

function ReciboImprimivel({ recibo, nomeEmitente }) {
  return (
    <div
      id="recibo-print"
      style={{
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fff',
        padding: '40px 44px',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px' }}>
        <div style={{ fontSize: '15px' }}>
          <strong style={{ color: PURPLE }}>Nº </strong>
          <span>{recibo.numero}</span>
        </div>
        <h1 style={{ color: PURPLE, fontSize: '34px', fontWeight: '900', letterSpacing: '3px', margin: 0, lineHeight: 1 }}>
          RECIBO
        </h1>
        <div style={{ border: '2px solid #1f2937', padding: '8px 16px', textAlign: 'right' }}>
          <strong style={{ color: PURPLE, fontSize: '13px', display: 'block' }}>Valor:</strong>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatarMoeda(recibo.valor)}</span>
        </div>
      </div>

      {/* Recebi de */}
      <div style={{ borderBottom: `1.5px solid ${PURPLE}55`, paddingBottom: '10px', marginBottom: '12px', fontSize: '15px' }}>
        <strong style={{ color: PURPLE }}>Recebi(emos) de: </strong>
        {recibo.cliente}
      </div>

      {/* Importância */}
      <div style={{ borderBottom: `1.5px solid ${PURPLE}55`, paddingBottom: '10px', marginBottom: '24px', fontSize: '15px' }}>
        <strong style={{ color: PURPLE }}>A importância de: </strong>
        {valorExtenso(recibo.valor)}
      </div>

      {/* Referente */}
      <div style={{ borderBottom: `2px solid ${PURPLE}`, paddingBottom: '10px', marginBottom: '36px', fontSize: '15px' }}>
        <strong style={{ color: PURPLE }}>Referente: </strong>
        {recibo.referente}
      </div>

      {/* Data */}
      <div style={{ fontSize: '15px', color: '#374151', marginBottom: '36px' }}>
        {formatarDataExtenso(recibo.data)}
      </div>

      {/* Emitente */}
      <div style={{ borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '36px', fontSize: '15px' }}>
        <strong style={{ color: PURPLE }}>Emitente: </strong>
        {nomeEmitente}
      </div>

      {/* Assinatura */}
      <div style={{ fontSize: '15px' }}>
        <strong style={{ color: PURPLE }}>Assinatura: </strong>
        <div style={{ borderBottom: '1px solid #d1d5db', height: '72px', marginTop: '8px' }} />
      </div>
    </div>
  )
}

export default function TaxiImprimir() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { buscarRecibo, config } = useTaxi()
  const recibo = buscarRecibo(id)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'taxi-print-css'
    el.textContent = `
      @media print {
        .taxi-no-print { display: none !important; }
        body { background: #fff !important; margin: 0; }
        #recibo-print { padding: 20px !important; max-width: 100% !important; }
      }
    `
    document.head.appendChild(el)
    return () => document.getElementById('taxi-print-css')?.remove()
  }, [])

  if (!recibo) {
    return (
      <div className="max-w-md mx-auto p-10 text-center">
        <p className="text-gray-500 mb-4">Recibo não encontrado.</p>
        <button onClick={() => navigate('/taxi')} className="text-yellow-600 font-semibold">
          Voltar ao início
        </button>
      </div>
    )
  }

  const nomeEmitente = recibo.emitente || config.nomeMotorista || ''

  function textoWhatsApp() {
    return (
      `*RECIBO Nº ${recibo.numero}*\n\n` +
      `Recebi de: ${recibo.cliente}\n` +
      `Valor: ${formatarMoeda(recibo.valor)}\n` +
      `Por extenso: ${valorExtenso(recibo.valor)}\n` +
      `Referente: ${recibo.referente}\n` +
      `Data: ${formatarDataExtenso(recibo.data)}\n` +
      `Emitente: ${nomeEmitente}`
    )
  }

  function handleWhatsApp() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp())}`
    window.open(url, '_blank')
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(textoWhatsApp())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de ações */}
      <div className="taxi-no-print bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 sticky top-0 z-10 max-w-full">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl active:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900 text-sm flex-1 truncate">
          Recibo Nº {recibo.numero} — {recibo.cliente}
        </span>
        <button
          onClick={handleCopiar}
          title="Copiar texto"
          className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
        >
          {copiado ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 bg-green-500 active:bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-yellow-400 active:bg-yellow-500 text-yellow-900 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Printer size={16} />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>

      {/* Recibo */}
      <div className="py-6 px-4">
        <div className="bg-white shadow rounded-2xl overflow-hidden max-w-2xl mx-auto">
          <ReciboImprimivel recibo={recibo} nomeEmitente={nomeEmitente} />
        </div>
        <p className="taxi-no-print text-center text-xs text-gray-400 mt-4">
          Toque em "Imprimir" para salvar como PDF ou imprimir em papel
        </p>
      </div>
    </div>
  )
}
