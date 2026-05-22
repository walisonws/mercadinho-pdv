import { useState } from 'react'
import { Store, MapPin, Phone, ChevronRight, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ModalOnboarding({ onConcluir }) {
  const { salvarConfig } = useApp()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nomeMercadinho: '', endereco: '', telefone: '' })
  const [salvando, setSalvando] = useState(false)

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function handleConcluir() {
    setSalvando(true)
    await salvarConfig({
      nomeMercadinho: form.nomeMercadinho.trim() || 'Meu Mercadinho',
      endereco: form.endereco.trim(),
      telefone: form.telefone.trim(),
    })
    setSalvando(false)
    onConcluir()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">Bem-vindo ao PDV Mercadinho!</h1>
          <p className="text-green-100 text-sm mt-1">Vamos configurar seu mercadinho em 1 minuto</p>
          {/* Steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-white w-8' : 'bg-white/30 w-4'}`} />
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-800 text-lg mb-1">Como se chama seu mercadinho?</h2>
                <p className="text-sm text-gray-500">O nome aparecerá no topo do sistema e nos cupons.</p>
              </div>
              <div>
                <div className="relative">
                  <Store size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={form.nomeMercadinho}
                    onChange={e => set('nomeMercadinho', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && form.nomeMercadinho.trim() && setStep(2)}
                    placeholder="Ex: Mercadinho do João"
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-green-500 font-medium"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.nomeMercadinho.trim()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition-colors disabled:opacity-40"
              >
                Próximo <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-800 text-lg mb-1">Endereço do mercadinho</h2>
                <p className="text-sm text-gray-500">Aparece no cupom fiscal. Você pode pular.</p>
              </div>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={form.endereco}
                  onChange={e => set('endereco', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setStep(3)}
                  placeholder="Ex: Rua das Flores, 123 — Bairro"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold hover:bg-gray-50">
                  Voltar
                </button>
                <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700">
                  {form.endereco.trim() ? <><span>Próximo</span> <ChevronRight size={18} /></> : 'Pular'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-800 text-lg mb-1">Telefone / WhatsApp</h2>
                <p className="text-sm text-gray-500">Aparece no cupom fiscal. Você pode pular.</p>
              </div>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  autoFocus
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConcluir()}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Resumo */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-1.5">
                <p className="text-xs text-green-600 font-semibold mb-2">Resumo</p>
                <p className="text-sm font-semibold text-gray-800">🛒 {form.nomeMercadinho}</p>
                {form.endereco && <p className="text-xs text-gray-500">📍 {form.endereco}</p>}
                {form.telefone && <p className="text-xs text-gray-500">📞 {form.telefone}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold hover:bg-gray-50">
                  Voltar
                </button>
                <button
                  onClick={handleConcluir}
                  disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle size={18} />
                  {salvando ? 'Salvando...' : 'Tudo pronto!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
