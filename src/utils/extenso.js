const unidades = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
]
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function grupo(n) {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const d = Math.floor(resto / 10)
  const u = resto % 10
  const parts = []
  if (c > 0) parts.push(centenas[c])
  if (resto > 0) {
    if (resto < 20) parts.push(unidades[resto])
    else {
      parts.push(dezenas[d])
      if (u > 0) parts.push(unidades[u])
    }
  }
  return parts.join(' e ')
}

export function valorExtenso(valor) {
  if (!valor || valor <= 0) return 'Zero reais'
  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)
  const partesReais = []
  if (inteiro > 0) {
    const milhoes = Math.floor(inteiro / 1000000)
    const milhares = Math.floor((inteiro % 1000000) / 1000)
    const resto = inteiro % 1000
    if (milhoes > 0) partesReais.push(grupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'))
    if (milhares > 0) partesReais.push(grupo(milhares) + ' mil')
    if (resto > 0) partesReais.push(grupo(resto))
  }
  const partesFinal = []
  if (inteiro > 0) {
    partesFinal.push(partesReais.join(' e ') + (inteiro === 1 ? ' real' : ' reais'))
  }
  if (centavos > 0) {
    partesFinal.push(grupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos'))
  }
  const result = partesFinal.join(' e ')
  return result ? result.charAt(0).toUpperCase() + result.slice(1) : 'Zero reais'
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function formatarDataExtenso(dateStr) {
  if (!dateStr) return ''
  const [ano, mes, dia] = dateStr.split('-').map(Number)
  return `${dia} de ${MESES[mes - 1]} de ${ano}`
}

export function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
