// Quanto descontar do estoque ao vender UM item do carrinho.
// Produtos por peso guardam a quantidade em GRAMAS no carrinho, mas o estoque
// é controlado em kg → converte. Produtos por unidade descontam 1:1.
export function deltaEstoqueVenda(item) {
  const qtd = item?.quantidade || 0
  if (item?.tipo === 'peso') return qtd / 1000
  return qtd
}

// Soma um delta ao estoque, nunca abaixo de zero, arredondando a 3 casas (kg)
// para evitar lixo de ponto flutuante (ex.: 9.499999999).
export function aplicarDeltaEstoque(estoqueAtual, delta) {
  return Math.max(0, Math.round(((estoqueAtual || 0) + delta) * 1000) / 1000)
}
