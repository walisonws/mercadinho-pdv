// Arredonda um valor para cima até o próximo final em ,49 ou ,99 (preços de comércio).
export function arredondarPreco(valor) {
  if (!valor || valor <= 0) return 0
  const reais = Math.floor(valor)
  const centavos = valor - reais
  if (centavos <= 0.49 + 1e-9) return +(reais + 0.49).toFixed(2)
  return +(reais + 0.99).toFixed(2)
}

// Preço de venda sugerido a partir do custo e de uma margem em %.
export function precoVendaSugerido(custo, margemPct) {
  if (!custo || custo <= 0) return 0
  const alvo = custo * (1 + (margemPct || 0) / 100)
  return arredondarPreco(alvo)
}
