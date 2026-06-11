import { useNavigate } from 'react-router-dom'
import { useTaxi } from '../../context/TaxiContext'
import { formatarMoeda } from '../../utils/extenso'
import { Car, FilePlus, ClipboardList, AlertCircle } from 'lucide-react'

export default function TaxiDashboard() {
  const { stats, config, recibos } = useTaxi()
  const navigate = useNavigate()
  const primeiroNome = config.nomeMotorista?.split(' ')[0]

  return (
    <div className="max-w-md mx-auto">
      {/* Header amarelo */}
      <div className="bg-yellow-400 px-5 pt-12 pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Car size={20} className="text-yellow-800" />
          <span className="text-yellow-800 font-semibold text-sm tracking-wide">RECIBO TÁXI</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {primeiroNome ? `Olá, ${primeiroNome}!` : 'Bem-vindo!'}
        </h1>
        {config.placaVeiculo && (
          <span className="text-yellow-800 text-sm font-medium">Placa {config.placaVeiculo}</span>
        )}
      </div>

      <div className="px-4 space-y-3 -mt-5">
        {/* Alerta de configuração */}
        {!config.nomeMotorista && (
          <button
            onClick={() => navigate('/taxi/configuracoes')}
            className="w-full bg-white border-2 border-yellow-400 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm"
          >
            <AlertCircle size={20} className="text-yellow-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Configure seu perfil</p>
              <p className="text-xs text-gray-500">Adicione seu nome para aparecer nos recibos</p>
            </div>
            <span className="ml-auto text-yellow-500 text-lg">→</span>
          </button>
        )}

        {/* Card hoje */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Hoje</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-0.5 rounded-full">
              {stats.corridasHoje} {stats.corridasHoje === 1 ? 'corrida' : 'corridas'}
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {formatarMoeda(stats.ganhosHoje)}
          </p>
        </div>

        {/* Semana e Mês */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Esta semana</p>
            <p className="text-xl font-bold text-gray-900">{formatarMoeda(stats.ganhosSemana)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.corridasSemana} corridas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Este mês</p>
            <p className="text-xl font-bold text-gray-900">{formatarMoeda(stats.ganhosMes)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.corridasMes} corridas</p>
          </div>
        </div>

        {/* Total acumulado */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-violet-600">Total acumulado</p>
            <p className="text-xl font-bold text-violet-900">{formatarMoeda(stats.totalGanhos)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-violet-600">Recibos emitidos</p>
            <p className="text-xl font-bold text-violet-900">{stats.totalRecibos}</p>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/taxi/novo')}
            className="bg-yellow-400 active:bg-yellow-500 rounded-2xl p-5 flex flex-col items-center gap-2 transition-colors"
          >
            <FilePlus size={28} className="text-yellow-900" />
            <span className="text-sm font-bold text-yellow-900">Novo Recibo</span>
          </button>
          <button
            onClick={() => navigate('/taxi/historico')}
            className="bg-white active:bg-gray-50 rounded-2xl p-5 flex flex-col items-center gap-2 border border-gray-200 transition-colors"
          >
            <ClipboardList size={28} className="text-gray-600" />
            <span className="text-sm font-bold text-gray-600">Histórico</span>
          </button>
        </div>

        {/* Recentes */}
        {recibos.length > 0 && (
          <div className="pb-4">
            <h2 className="text-sm font-bold text-gray-600 mb-2 px-1">Recentes</h2>
            <div className="space-y-2">
              {recibos.slice(0, 4).map(r => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/taxi/recibo/${r.id}`)}
                  className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.cliente}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Nº {r.numero} &nbsp;·&nbsp; {r.data?.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">
                    {formatarMoeda(r.valor)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recibos.length === 0 && (
          <div className="text-center py-10 text-gray-400 pb-6">
            <Car size={52} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhuma corrida registrada ainda</p>
            <p className="text-xs mt-1">Toque em "Novo Recibo" para começar!</p>
          </div>
        )}
      </div>
    </div>
  )
}
