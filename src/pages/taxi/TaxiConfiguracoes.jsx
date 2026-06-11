import { useState } from 'react'
import { useTaxi } from '../../context/TaxiContext'
import { Check, User, Car, Phone, Hash, CreditCard } from 'lucide-react'

export default function TaxiConfiguracoes() {
  const { config, atualizarConfig } = useTaxi()

  const [form, setForm] = useState({
    nomeMotorista: config.nomeMotorista || '',
    placaVeiculo: config.placaVeiculo || '',
    telefone: config.telefone || '',
    cpf: config.cpf || '',
    proximoNumero: String(config.proximoNumero || 1),
  })
  const [salvo, setSalvo] = useState(false)

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleSalvar() {
    atualizarConfig({
      nomeMotorista: form.nomeMotorista.trim(),
      placaVeiculo: form.placaVeiculo.trim().toUpperCase(),
      telefone: form.telefone.trim(),
      cpf: form.cpf.trim(),
      proximoNumero: Math.max(1, parseInt(form.proximoNumero) || 1),
    })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="font-bold text-gray-900 text-xl">Configurações</h1>
        <p className="text-xs text-gray-500 mt-0.5">Seus dados aparecem em todos os recibos</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Dados pessoais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <User size={16} className="text-violet-600" />
            Dados do Motorista
          </h2>

          <div>
            <label className="block text-xs font-bold text-violet-700 mb-1.5 uppercase tracking-wide">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.nomeMotorista}
              onChange={set('nomeMotorista')}
              placeholder="Seu nome como aparece no recibo"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Car size={12} /> Placa do veículo
            </label>
            <input
              type="text"
              value={form.placaVeiculo}
              onChange={set('placaVeiculo')}
              placeholder="ABC-1234"
              maxLength={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Phone size={12} /> Telefone
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={set('telefone')}
              placeholder="(00) 00000-0000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <CreditCard size={12} /> CPF
            </label>
            <input
              type="text"
              value={form.cpf}
              onChange={set('cpf')}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Numeração */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Hash size={16} className="text-violet-600" />
            Numeração dos Recibos
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
              Próximo número
            </label>
            <input
              type="number"
              value={form.proximoNumero}
              onChange={set('proximoNumero')}
              min="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Ajuste para continuar a sequência dos seus recibos físicos existentes.
            </p>
          </div>
        </div>

        <button
          onClick={handleSalvar}
          className={`w-full font-bold py-4 rounded-2xl transition-all text-base flex items-center justify-center gap-2 active:scale-[0.98] ${
            salvo
              ? 'bg-green-500 text-white'
              : 'bg-yellow-400 active:bg-yellow-500 text-yellow-900'
          }`}
        >
          {salvo ? (
            <>
              <Check size={20} /> Salvo com sucesso!
            </>
          ) : (
            'Salvar Configurações'
          )}
        </button>

        {/* Dica sobre assinatura */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-amber-800 mb-1">Sobre a assinatura</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            O campo de assinatura fica em branco no recibo impresso para você assinar à mão,
            exatamente como no modelo original.
          </p>
        </div>

        {/* Versão */}
        <p className="text-center text-xs text-gray-300 pb-2">Recibo Táxi v1.0</p>
      </div>
    </div>
  )
}
