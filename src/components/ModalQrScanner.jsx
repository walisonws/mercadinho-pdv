import { useEffect, useRef, useState } from 'react'
import { X, QrCode } from 'lucide-react'

export default function ModalQrScanner({ onResult, onFechar }) {
  const videoRef = useRef(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let stream = null
    let animFrame = null
    let ativo = true

    if (!('BarcodeDetector' in window)) {
      setErro('Seu navegador não suporta leitura de QR. Use o Google Chrome atualizado.')
      return
    }

    const detector = new BarcodeDetector({ formats: ['qr_code'] })

    async function scan() {
      if (!ativo || !videoRef.current) return
      try {
        const codes = await detector.detect(videoRef.current)
        if (codes.length > 0) {
          onResult(codes[0].rawValue)
          return
        }
      } catch { /* */ }
      animFrame = requestAnimationFrame(scan)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!ativo) { stream.getTracks().forEach(t => t.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        scan()
      } catch {
        setErro('Não foi possível acessar a câmera. Verifique as permissões.')
      }
    }

    start()

    return () => {
      ativo = false
      cancelAnimationFrame(animFrame)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [onResult])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-violet-600" />
            <h2 className="font-bold text-gray-800">Escanear QR Code da Nota</h2>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {erro ? (
          <div className="p-8 text-center">
            <QrCode size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-red-600">{erro}</p>
          </div>
        ) : (
          <div className="relative bg-black">
            <video ref={videoRef} className="w-full" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 border-2 border-white/80 rounded-xl" />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center px-4 py-3">
          Aponte a câmera para o QR Code da nota fiscal
        </p>
      </div>
    </div>
  )
}
