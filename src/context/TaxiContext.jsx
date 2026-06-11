import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const TaxiContext = createContext(null)

const CONFIG_DEFAULT = {
  nomeMotorista: '',
  placaVeiculo: '',
  telefone: '',
  cpf: '',
  proximoNumero: 1,
}

export function TaxiProvider({ children }) {
  const [recibos, setRecibos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taxi_recibos') || '[]') }
    catch { return [] }
  })

  const [config, setConfig] = useState(() => {
    try { return { ...CONFIG_DEFAULT, ...JSON.parse(localStorage.getItem('taxi_config') || '{}') } }
    catch { return CONFIG_DEFAULT }
  })

  useEffect(() => { localStorage.setItem('taxi_recibos', JSON.stringify(recibos)) }, [recibos])
  useEffect(() => { localStorage.setItem('taxi_config', JSON.stringify(config)) }, [config])

  const criarRecibo = useCallback((dados) => {
    const numero = config.proximoNumero
    const recibo = { id: String(Date.now()), numero, ...dados, criadoEm: new Date().toISOString() }
    setRecibos(prev => [recibo, ...prev])
    setConfig(prev => ({ ...prev, proximoNumero: prev.proximoNumero + 1 }))
    return recibo
  }, [config.proximoNumero])

  const excluirRecibo = useCallback((id) => {
    setRecibos(prev => prev.filter(r => r.id !== id))
  }, [])

  const atualizarConfig = useCallback((novaConfig) => {
    setConfig(prev => ({ ...prev, ...novaConfig }))
  }, [])

  const buscarRecibo = useCallback((id) => {
    return recibos.find(r => r.id === id)
  }, [recibos])

  const agora = new Date()
  const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`

  const recibosHoje = recibos.filter(r => r.data === hojeStr)
  const ganhosHoje = recibosHoje.reduce((s, r) => s + (r.valor || 0), 0)

  const semanaAtras = new Date(agora - 7 * 24 * 60 * 60 * 1000)
  const recibosSemana = recibos.filter(r => {
    if (!r.data) return false
    const [a, m, d] = r.data.split('-').map(Number)
    return new Date(a, m - 1, d) >= semanaAtras
  })
  const ganhosSemana = recibosSemana.reduce((s, r) => s + (r.valor || 0), 0)

  const recibosMes = recibos.filter(r => {
    if (!r.data) return false
    const [a, m] = r.data.split('-').map(Number)
    return a === agora.getFullYear() && m === agora.getMonth() + 1
  })
  const ganhosMes = recibosMes.reduce((s, r) => s + (r.valor || 0), 0)

  return (
    <TaxiContext.Provider value={{
      recibos,
      criarRecibo,
      excluirRecibo,
      buscarRecibo,
      config,
      atualizarConfig,
      stats: {
        ganhosHoje,
        corridasHoje: recibosHoje.length,
        ganhosSemana,
        corridasSemana: recibosSemana.length,
        ganhosMes,
        corridasMes: recibosMes.length,
        totalGanhos: recibos.reduce((s, r) => s + (r.valor || 0), 0),
        totalRecibos: recibos.length,
      },
    }}>
      {children}
    </TaxiContext.Provider>
  )
}

export const useTaxi = () => useContext(TaxiContext)
