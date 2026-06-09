// Testes puros (sem framework): node src/utils/estoque.test.mjs
import { deltaEstoqueVenda, aplicarDeltaEstoque } from './estoque.js'

let passou = 0
let falhou = 0
function eq(nome, atual, esperado) {
  const ok = Math.abs(atual - esperado) < 1e-9
  if (ok) { passou++; console.log(`  ✓ ${nome}`) }
  else { falhou++; console.log(`  ✗ ${nome} → esperado ${esperado}, veio ${atual}`) }
}

console.log('deltaEstoqueVenda:')
eq('unidade desconta 1:1', deltaEstoqueVenda({ tipo: 'unidade', quantidade: 3 }), 3)
eq('peso 500g vira 0,5 kg', deltaEstoqueVenda({ tipo: 'peso', quantidade: 500 }), 0.5)
eq('peso 1250g vira 1,25 kg', deltaEstoqueVenda({ tipo: 'peso', quantidade: 1250 }), 1.25)
eq('item sem quantidade = 0', deltaEstoqueVenda({ tipo: 'unidade' }), 0)
eq('item nulo = 0', deltaEstoqueVenda(null), 0)
eq('tipo ausente trata como unidade', deltaEstoqueVenda({ quantidade: 2 }), 2)

console.log('aplicarDeltaEstoque:')
eq('vende 1 de 10 → 9', aplicarDeltaEstoque(10, -1), 9)
eq('vende 0,5 kg de 9,5 → 9', aplicarDeltaEstoque(9.5, -0.5), 9)
eq('nunca fica negativo', aplicarDeltaEstoque(0.2, -1), 0)
eq('repõe 5 a 3 → 8', aplicarDeltaEstoque(3, 5), 8)
eq('arredonda lixo de float a 3 casas', aplicarDeltaEstoque(9.6, -0.1), 9.5)
eq('estoque nulo + 4 → 4', aplicarDeltaEstoque(null, 4), 4)

console.log(`\n${passou} passaram, ${falhou} falharam`)
process.exit(falhou > 0 ? 1 : 0)
