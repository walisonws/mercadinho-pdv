import { useState } from 'react'
import { Banknote, CreditCard, QrCode, X, CheckCircle } from 'lucide-react'

const formas = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'bg-yellow-500' },
  { id: 'cartao', label: 'Cartão', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'pix', label: 'Pix', icon: QrCode, color: 'bg-green-500' },
]

export default function ModalFinalizarVenda({ total, onConfirmar, onFechar }) {
  const [forma, setForma] = useState('dinheiro')
  const [subtipoCartao, setSubtipoCartao] = useState('debito')
  const [valorRecebido, setValorRecebido] = useState('')

  const recebido = parseFloat(valorRecebido) || 0
  const troco = forma === 'dinheiro' ? Math.max(0, recebido - total) : 0
  const podeConfirmar = forma !== 'dinheiro' || recebido >= total

  function handleConfirmar() {
    if (!podeConfirmar) return
    const formaPagamento = forma === 'cartao' ? `cartao_${subtipoCartao}` : forma
    onConfirmar({ forma: formaPagamento, valorRecebido: recebido, troco })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">Finalizar Venda</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="bg-green-50 rounded-xl p-4 text-center mb-5">
          <p className="text-sm text-gray-500 mb-1">Total da compra</p>
          <p className="text-4xl font-bold text-green-700">R$ {total.toFixed(2)}</p>
        </div>

        <p className="text-sm font-semibold text-gray-600 mb-3">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {formas.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => { setForma(id); setValorRecebido('') }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all ${
                forma === id
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className={`${color} text-white p-2 rounded-lg`}>
                <Icon size={20} />
              </div>
              {label}
            </button>
          ))}
        </div>

        {forma === 'dinheiro' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor recebido (R$)
            </label>
            <input
              type="number"
              autoFocus
              value={valorRecebido}
              onChange={e => setValorRecebido(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmar()}
              placeholder="0,00"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-green-500"
            />
            {recebido >= total && recebido > 0 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                <p className="text-sm text-yellow-700">Troco</p>
                <p className="text-2xl font-bold text-yellow-700">R$ {troco.toFixed(2)}</p>
              </div>
            )}
            {recebido > 0 && recebido < total && (
              <p className="text-sm text-red-500 mt-2 text-center">
                Falta R$ {(total - recebido).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {forma === 'pix' && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <QrCode size={40} className="mx-auto text-green-600 mb-2" />
            <p className="text-sm text-green-700 font-medium">
              Mostre seu QR Code Pix ou chave para o cliente.<br />
              Confirme o recebimento antes de finalizar.
            </p>
          </div>
        )}

        {forma === 'cartao' && (
          <div className="mb-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'debito', label: 'Débito' }, { id: 'credito', label: 'Crédito' }].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSubtipoCartao(id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-all text-sm ${
                    subtipoCartao === id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={16} />
                  {label}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700 font-medium">
                Digite R$ {total.toFixed(2)} na maquininha.<br />
                Confirme após o pagamento ser aprovado.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
