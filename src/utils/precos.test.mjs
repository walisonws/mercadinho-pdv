import { arredondarPreco, precoVendaSugerido } from './precos.js'

let falhas = 0
function check(nome, real, esperado) {
  if (real !== esperado) {
    console.error(`FAIL ${nome}: esperado ${esperado}, recebeu ${real}`)
    falhas++
  } else {
    console.log(`ok   ${nome} = ${real}`)
  }
}

// arredondarPreco: sobe para o próximo final em ,49 ou ,99
check('arredondar 9.10', arredondarPreco(9.10), 9.49)
check('arredondar 2.496', arredondarPreco(2.496), 2.99)
check('arredondar 5.20', arredondarPreco(5.20), 5.49)
check('arredondar 9.49 exato', arredondarPreco(9.49), 9.49)
check('arredondar 9.50', arredondarPreco(9.50), 9.99)
check('arredondar 9.00 inteiro', arredondarPreco(9.00), 9.49)
check('arredondar 0', arredondarPreco(0), 0)

// precoVendaSugerido: custo * (1 + margem%) arredondado
check('venda 7 +30%', precoVendaSugerido(7, 30), 9.49)
check('venda 1.92 +30%', precoVendaSugerido(1.92, 30), 2.99)
check('venda 0 +30%', precoVendaSugerido(0, 30), 0)

if (falhas > 0) { console.error(`\n${falhas} teste(s) falharam`); process.exit(1) }
console.log('\nTodos os testes passaram')
