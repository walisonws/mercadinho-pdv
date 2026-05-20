import { useState } from 'react'
import { Save, Store, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Configuracoes() {
  const { config, salvarConfig } = useApp()
  const [form, setForm] = useState({ ...config })
  const [salvo, setSalvo] = useState(false)

  function handleSalvar(e) {
    e.preventDefault()
    salvarConfig(form)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Store size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
          <p className="text-sm text-gray-500">Dados do seu estabelecimento</p>
        </div>
      </div>

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

        <div className="pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            {salvo ? <CheckCircle size={18} /> : <Save size={18} />}
            {salvo ? 'Salvo!' : 'Salvar configurações'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Dica — Leitor de código de barras</h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          Conecte seu leitor USB normalmente ao notebook. Na tela PDV, clique no campo de busca e escaneie o produto — o código será digitado automaticamente. Se o produto não estiver cadastrado, você será avisado para cadastrá-lo primeiro em <strong>Produtos</strong>.
        </p>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Backup dos dados</h3>
        <p className="text-sm text-yellow-700 leading-relaxed">
          Os dados são salvos no próprio navegador (localStorage). Para não perder os dados, <strong>não limpe o histórico do navegador</strong> e sempre use o mesmo navegador neste computador. No futuro podemos adicionar backup automático na nuvem.
        </p>
      </div>
    </div>
  )
}
