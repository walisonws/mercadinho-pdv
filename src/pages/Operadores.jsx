import { useState } from 'react'
import { Users, Plus, Edit2, Trash2, X, Eye, EyeOff, CheckCircle, UserCheck, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

function ModalOperador({ operador, onSalvar, onFechar }) {
  const [nome, setNome] = useState(operador?.nome || '')
  const [pin, setPin] = useState('')
  const [confirmarPin, setConfirmarPin] = useState('')
  const [mostrarPin, setMostrarPin] = useState(false)
  const [erro, setErro] = useState('')

  function handleSalvar() {
    setErro('')
    if (!nome.trim()) { setErro('Nome obrigatório.'); return }
    if (!operador && !pin) { setErro('PIN obrigatório para novo operador.'); return }
    if (pin && !/^\d{4}$/.test(pin)) { setErro('PIN deve ter exatamente 4 dígitos.'); return }
    if (pin && pin !== confirmarPin) { setErro('PINs não coincidem.'); return }
    onSalvar({ nome: nome.trim(), ...(pin ? { pin } : {}) })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{operador ? 'Editar operador' : 'Novo operador'}</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erro}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
          <input
            type="text"
            autoFocus
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João, Maria..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            PIN de 4 dígitos {operador && <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>}
          </label>
          <div className="relative">
            <input
              type={mostrarPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              inputMode="numeric"
              maxLength={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-green-500 font-mono text-lg tracking-widest"
            />
            <button type="button" onClick={() => setMostrarPin(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {mostrarPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {pin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar PIN</label>
            <input
              type={mostrarPin ? 'text' : 'password'}
              value={confirmarPin}
              onChange={e => setConfirmarPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              inputMode="numeric"
              maxLength={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 font-mono text-lg tracking-widest"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onFechar} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-bold hover:bg-green-700">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalPin({ operador, onConfirmar, onFechar }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)

  function handleConfirmar() {
    if (pin === operador.pin) {
      onConfirmar()
    } else {
      setErro(true)
      setPin('')
      setTimeout(() => setErro(false), 1500)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center space-y-5">
        <div>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCheck size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Entrar como</h2>
          <p className="text-green-600 font-semibold text-xl mt-1">{operador.nome}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-3">Digite o PIN de 4 dígitos</p>
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && handleConfirmar()}
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            className={`w-32 border-2 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none transition-colors ${erro ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-green-500'}`}
          />
          {erro && <p className="text-red-500 text-sm mt-2">PIN incorreto</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={pin.length !== 4}
            className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-bold hover:bg-green-700 disabled:opacity-40"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Operadores() {
  const { operadores, operadorAtivo, adicionarOperador, editarOperador, excluirOperador, ativarOperador, desativarOperador, vendas } = useApp()
  const [modalNovo, setModalNovo] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalPin, setModalPin] = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)

  function contarVendas(operadorId) {
    return vendas.filter(v => v.operadorId === operadorId).length
  }

  function handleSalvarNovo(dados) {
    adicionarOperador(dados.nome, dados.pin)
    setModalNovo(false)
  }

  function handleSalvarEditar(dados) {
    editarOperador(modalEditar.id, dados)
    setModalEditar(null)
  }

  function handleSelecionarOperador(op) {
    setModalPin(op)
  }

  function handleConfirmarPin() {
    ativarOperador(modalPin)
    setModalPin(null)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Operadores</h1>
            <p className="text-sm text-gray-500">Gerencie quem opera o caixa</p>
          </div>
        </div>
        <button
          onClick={() => setModalNovo(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
        >
          <Plus size={18} />
          Novo
        </button>
      </div>

      {/* Operador ativo */}
      {operadorAtivo && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck size={20} className="text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-semibold">OPERADOR ATIVO</p>
              <p className="font-bold text-gray-800">{operadorAtivo.nome}</p>
            </div>
          </div>
          <button
            onClick={desativarOperador}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}

      {/* Lista de operadores */}
      {operadores.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <Users size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum operador cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione operadores para controlar quem faz cada venda</p>
          <button
            onClick={() => setModalNovo(true)}
            className="mt-4 flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 mx-auto text-sm"
          >
            <Plus size={16} />
            Adicionar primeiro operador
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {operadores.map(op => {
            const isAtivo = operadorAtivo?.id === op.id
            const qtdVendas = contarVendas(op.id)

            return (
              <div key={op.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${isAtivo ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {op.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{op.nome}</p>
                    {isAtivo && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle size={10} /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{qtdVendas} venda{qtdVendas !== 1 ? 's' : ''} registradas</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isAtivo && (
                    <button
                      onClick={() => handleSelecionarOperador(op)}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition-colors"
                    >
                      Entrar
                    </button>
                  )}
                  <button onClick={() => setModalEditar(op)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setConfirmarExcluir(op)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmarExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">Excluir operador?</h2>
            <p className="text-gray-600 text-sm">
              O operador <strong>{confirmarExcluir.nome}</strong> será removido. As vendas associadas a ele serão mantidas no histórico.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarExcluir(null)} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => { excluirOperador(confirmarExcluir.id); setConfirmarExcluir(null) }}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-bold hover:bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNovo && <ModalOperador onSalvar={handleSalvarNovo} onFechar={() => setModalNovo(false)} />}
      {modalEditar && <ModalOperador operador={modalEditar} onSalvar={handleSalvarEditar} onFechar={() => setModalEditar(null)} />}
      {modalPin && <ModalPin operador={modalPin} onConfirmar={handleConfirmarPin} onFechar={() => setModalPin(null)} />}
    </div>
  )
}
