# Nota IA — Custo + Preço de Venda com Margem — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a Nota IA gravar o valor da nota como **custo de compra** e sugerir um **preço de venda** com margem padrão de 30% (editável), e adicionar um botão "Corrigir custos" para consertar produtos já cadastrados — para que a aba Lucro mostre o lucro real.

**Architecture:** A lógica de cálculo (margem + arredondamento ,49/,99) fica isolada num módulo puro `src/utils/precos.js` (única parte com teste automatizado, rodável via `node`). A tela `EntradaEstoque.jsx` ganha um campo de margem global e mostra custo/venda/lucro por item, gravando os campos corretos. `Produtos.jsx` ganha o botão de correção em lote. O modelo de dados (`preco`, `custoCompra`) e a aba `RelatorioLucro.jsx` já existem e não mudam.

**Tech Stack:** React 19, Vite, sem framework de teste instalado (teste puro via `node` para a lógica de preços).

---

## File Structure

- **Create:** `src/utils/precos.js` — funções puras `arredondarPreco` e `precoVendaSugerido`.
- **Create:** `src/utils/precos.test.mjs` — teste rodável com `node` (sem dependências).
- **Modify:** `src/pages/EntradaEstoque.jsx` — estado de margem, cálculo do preço de venda por item, UI de margem/custo/venda/lucro, gravação correta em `aplicarNoEstoque`.
- **Modify:** `src/pages/Produtos.jsx` — botão "Corrigir custos" + modal de confirmação + correção em lote.

`AppContext.jsx` **não muda**: `adicionarProduto` e `editarProduto` já aceitam e persistem `custoCompra` (mapeado para `custo_compra` por `toDbProduto`).

---

### Task 1: Módulo puro de preços (com teste)

**Files:**
- Create: `src/utils/precos.js`
- Test: `src/utils/precos.test.mjs`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/utils/precos.test.mjs`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node src/utils/precos.test.mjs`
Expected: FALHA com erro de import (`Cannot find module ... precos.js`).

- [ ] **Step 3: Implementar o módulo**

Create `src/utils/precos.js`:

```js
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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node src/utils/precos.test.mjs`
Expected: PASS — "Todos os testes passaram".

- [ ] **Step 5: Commit**

```bash
git add src/utils/precos.js src/utils/precos.test.mjs
git commit -m "feat: módulo puro de preço de venda com margem e arredondamento"
```

---

### Task 2: Nota IA — estado de margem e cálculo da venda por item

**Files:**
- Modify: `src/pages/EntradaEstoque.jsx`

- [ ] **Step 1: Importar o módulo de preços**

No topo de `src/pages/EntradaEstoque.jsx`, logo após os imports existentes de `lucide-react`/contexto, adicionar:

```js
import { precoVendaSugerido } from '../utils/precos'
```

- [ ] **Step 2: Adicionar estado de margem**

Dentro do componente, logo após a linha `const { produtos, adicionarProduto, editarProduto, config, salvarConfig } = useApp()` (linha ~113), adicionar:

```js
const [margem, setMargem] = useState(config?.margemPadrao ?? 30)
```

- [ ] **Step 3: Calcular `precoVenda` ao processar os itens (texto)**

Na função de análise por texto, no objeto retornado pelo `.map` (perto da linha ~188), adicionar os campos `precoVenda` e `vendaEditada`. O bloco deve ficar:

```js
        return {
          _id: i, nomeOriginal: item.nome || '', nome: item.nome || '',
          quantidade: item.quantidade || 1, unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          precoVenda: precoVendaSugerido(item.preco_unitario || 0, margem),
          vendaEditada: false,
          resolucao: produtoMatch ? 'existente' : 'novo',
          produtoId: produtoMatch?.id || '', sugestoes,
          categoria: 'mercearia', tipo: 'unidade', selecionarProduto: false, ativo: true,
        }
```

- [ ] **Step 4: Calcular `precoVenda` ao processar os itens (imagem)**

Na função `analisarNota`, no objeto retornado pelo `.map` (perto da linha ~263), adicionar os mesmos dois campos:

```js
        return {
          _id: i,
          nomeOriginal: item.nome || '',
          nome: item.nome || '',
          quantidade: item.quantidade || 1,
          unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          precoVenda: precoVendaSugerido(item.preco_unitario || 0, margem),
          vendaEditada: false,
          resolucao: produtoMatch ? 'existente' : 'novo',
          produtoId: produtoMatch?.id || '',
          sugestoes,
          categoria: 'mercearia',
          tipo: 'unidade',
          selecionarProduto: false,
          ativo: true,
        }
```

- [ ] **Step 5: Atualizar `atualizarItem` para recalcular a venda**

Substituir a função `atualizarItem` existente (linha ~287) por:

```js
  function atualizarItem(id, campo, valor) {
    setItens(prev => prev.map(i => {
      if (i._id !== id) return i
      const atualizado = { ...i, [campo]: valor }
      if (campo === 'precoVenda') atualizado.vendaEditada = true
      if (campo === 'precoUnitario' && !atualizado.vendaEditada) {
        atualizado.precoVenda = precoVendaSugerido(valor || 0, margem)
      }
      return atualizado
    }))
  }
```

- [ ] **Step 6: Adicionar handler de mudança de margem**

Logo abaixo de `atualizarItem`, adicionar:

```js
  function alterarMargem(novaMargem) {
    setMargem(novaMargem)
    setItens(prev => prev.map(i =>
      i.vendaEditada ? i : { ...i, precoVenda: precoVendaSugerido(i.precoUnitario || 0, novaMargem) }
    ))
  }
```

- [ ] **Step 7: Adicionar o campo de margem no topo da revisão**

No bloco `etapa === 'revisao'`, logo após o `<div className="flex items-center justify-between mb-4">...</div>` de cabeçalho (depois da linha ~597, antes do `<div className="space-y-3 mb-5">`), inserir:

```jsx
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-sm font-semibold text-violet-800">Margem de lucro</span>
            <input
              type="number"
              min={0}
              step="1"
              value={margem}
              onChange={e => alterarMargem(parseFloat(e.target.value) || 0)}
              className="w-20 border-2 border-violet-200 rounded-lg px-3 py-1.5 text-sm font-bold text-violet-800 focus:outline-none focus:border-violet-500"
            />
            <span className="text-sm font-semibold text-violet-800">%</span>
            <span className="text-xs text-violet-600 ml-auto hidden sm:block">
              Aplica em todos. Você pode ajustar a venda item a item.
            </span>
          </div>
```

- [ ] **Step 8: Verificar build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/pages/EntradaEstoque.jsx
git commit -m "feat: Nota IA calcula preço de venda por margem na revisão"
```

---

### Task 3: Nota IA — exibir custo / venda / lucro por item

**Files:**
- Modify: `src/pages/EntradaEstoque.jsx` (componente `ItemRevisao`)

- [ ] **Step 1: Atualizar o resumo do item (badge de preço)**

No `ItemRevisao`, substituir o bloco do preço no resumo (linhas ~753-758) por:

```jsx
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">{item.quantidade} {item.unidade}</span>
              {item.precoUnitario > 0 && (
                <span className="text-xs text-gray-500">custo R$ {item.precoUnitario.toFixed(2)}</span>
              )}
              {item.precoVenda > 0 && (
                <span className="text-xs font-semibold text-green-700">venda R$ {item.precoVenda.toFixed(2)}</span>
              )}
              {item.precoVenda > 0 && item.precoUnitario > 0 && (
                <span className="text-xs font-medium text-emerald-600">
                  lucro R$ {(item.precoVenda - item.precoUnitario).toFixed(2)}
                </span>
              )}
            </div>
```

- [ ] **Step 2: Trocar o grid de quantidade/preço por quantidade + custo + venda + lucro**

No painel expandido, substituir o bloco `<div className="grid grid-cols-2 gap-3">...</div>` de quantidade e preço (linhas ~797-817) por:

```jsx
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
              <input
                type="number"
                value={item.quantidade}
                onChange={e => onAtualizar('quantidade', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={item.precoUnitario}
                onChange={e => onAtualizar('precoUnitario', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={item.precoVenda}
                onChange={e => onAtualizar('precoVenda', parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-green-200 rounded-xl px-3 py-2 text-sm font-semibold text-green-700 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {item.precoVenda > 0 && item.precoUnitario > 0 && (
            <p className="text-xs text-emerald-600 font-medium -mt-2">
              Lucro por unidade: R$ {(item.precoVenda - item.precoUnitario).toFixed(2)}
            </p>
          )}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 4: Verificação manual no navegador**

Run: `npm run dev`, abrir Nota IA, lançar uma nota (ou usar entrada por texto). Conferir:
- Campo "Margem de lucro" aparece no topo com 30%.
- Cada item mostra custo (da nota), venda (custo+30%, terminando em ,49/,99) e lucro.
- Mudar a margem recalcula a venda dos itens não editados.
- Editar a venda de um item e depois mudar a margem: aquele item **não** é sobrescrito.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EntradaEstoque.jsx
git commit -m "feat: Nota IA exibe custo, venda e lucro por item"
```

---

### Task 4: Nota IA — gravar custo + venda corretos e salvar margem padrão

**Files:**
- Modify: `src/pages/EntradaEstoque.jsx` (`aplicarNoEstoque`)

- [ ] **Step 1: Substituir `aplicarNoEstoque`**

Substituir a função `aplicarNoEstoque` (linhas ~295-320) por:

```js
  async function aplicarNoEstoque() {
    setEtapa('aplicando')
    for (const item of itens) {
      if (!item.ativo) continue
      if (item.resolucao === 'existente' && item.produtoId) {
        const produto = produtos.find(p => p.id === item.produtoId)
        if (produto) {
          await editarProduto(item.produtoId, {
            estoque: (produto.estoque || 0) + item.quantidade,
            custoCompra: item.precoUnitario || produto.custoCompra || 0,
            preco: item.precoVenda || produto.preco,
          })
        }
      } else if (item.resolucao === 'novo') {
        await adicionarProduto({
          nome: item.nome,
          codigo: `2${Date.now()}${Math.random().toString().slice(2, 5)}`.slice(0, 13),
          tipo: item.tipo,
          preco: item.precoVenda || 0,
          custoCompra: item.precoUnitario || 0,
          categoria: item.categoria,
          estoque: item.quantidade,
          estoqueMinimo: 0,
        })
      }
    }
    if (margem !== (config?.margemPadrao ?? 30)) {
      await salvarConfig({ ...config, margemPadrao: margem })
    }
    setEtapa('concluido')
  }
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 3: Verificação manual ponta a ponta**

Run: `npm run dev`. Lançar uma nota, aplicar ao estoque, depois:
- Abrir Produtos → Editar no produto lançado: "Custo de compra" = valor da nota, "Preço unitário" = venda com margem.
- Registrar uma venda desse produto no PDV e conferir na aba **Lucro** (filtro "Hoje") que o lucro aparece positivo, sem aviso "sem custo".

- [ ] **Step 4: Commit**

```bash
git add src/pages/EntradaEstoque.jsx
git commit -m "feat: Nota IA grava custo de compra e venda com margem; salva margem padrão"
```

---

### Task 5: Produtos — botão "Corrigir custos"

**Files:**
- Modify: `src/pages/Produtos.jsx`

- [ ] **Step 1: Importar o módulo de preços e o ícone**

No topo de `src/pages/Produtos.jsx`, adicionar `Wrench` ao import de `lucide-react` e importar o módulo de preços:

```js
import { Plus, Search, Edit2, Trash2, Scale, Tag, Filter, AlertTriangle, Wrench } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ModalProduto from '../components/ModalProduto'
import { precoVendaSugerido } from '../utils/precos'
```

- [ ] **Step 2: Pegar `config` do contexto e adicionar estado do modal**

Substituir a linha `const { produtos, adicionarProduto, editarProduto, excluirProduto } = useApp()` por:

```js
  const { produtos, adicionarProduto, editarProduto, excluirProduto, config } = useApp()
```

E logo após a linha `const [confirmarExclusao, setConfirmarExclusao] = useState(null)`, adicionar:

```js
  const [corrigirAberto, setCorrigirAberto] = useState(false)

  const margemPadrao = config?.margemPadrao ?? 30
  const produtosSemCusto = produtos.filter(p => p.ativo && (!p.custoCompra || p.custoCompra === 0) && p.preco > 0)

  async function handleCorrigirCustos() {
    for (const p of produtosSemCusto) {
      await editarProduto(p.id, {
        custoCompra: p.preco,
        preco: precoVendaSugerido(p.preco, margemPadrao),
      })
    }
    setCorrigirAberto(false)
  }
```

- [ ] **Step 3: Adicionar o botão no cabeçalho**

No cabeçalho, substituir o botão "Novo Produto" (bloco do `<button onClick={() => { setProdutoEditando(null); ...`) para colocá-lo dentro de um grupo com o novo botão:

```jsx
        <div className="flex items-center gap-2">
          {produtosSemCusto.length > 0 && (
            <button
              onClick={() => setCorrigirAberto(true)}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Wrench size={18} />
              Corrigir custos ({produtosSemCusto.length})
            </button>
          )}
          <button
            onClick={() => { setProdutoEditando(null); setModalAberto(true) }}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
```

- [ ] **Step 4: Adicionar o modal de confirmação**

Antes do fechamento final do componente (logo após o bloco `{confirmarExclusao && (...)}`, antes do último `</div>`), adicionar:

```jsx
      {/* Confirmar correção de custos */}
      {corrigirAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Wrench size={18} className="text-amber-500" /> Corrigir custos
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {produtosSemCusto.length} produto(s) estão sem custo de compra. Esta ação vai:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 mb-3 space-y-1">
              <li>Mover o <strong>preço atual</strong> de cada um para o <strong>custo de compra</strong>.</li>
              <li>Recalcular a <strong>venda</strong> com margem de <strong>{margemPadrao}%</strong> (terminando em ,49 ou ,99).</li>
              <li>O <strong>estoque não muda</strong>.</li>
            </ul>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              Use só se o preço atual desses produtos for, na verdade, o valor que você pagou (caso dos itens lançados pela Nota IA).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCorrigirAberto(false)}
                className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCorrigirCustos}
                className="flex-1 bg-amber-500 text-white rounded-xl py-2.5 font-bold hover:bg-amber-600"
              >
                Corrigir {produtosSemCusto.length}
              </button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 6: Verificação manual**

Run: `npm run dev`, abrir Produtos. Conferir:
- Botão "Corrigir custos (N)" aparece quando há produtos sem custo.
- Clicar → modal explica a ação → Confirmar.
- Após confirmar: nos produtos afetados, o custo passa a ter o valor antigo e a venda sobe com a margem; o estoque permanece igual; o botão some (N = 0).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Produtos.jsx
git commit -m "feat: botão Corrigir custos para ajustar produtos sem custo em lote"
```

---

### Task 6: Verificação final

- [ ] **Step 1: Lint e build**

Run: `npm run lint && npm run build`
Expected: sem erros de lint nem de build.

- [ ] **Step 2: Rodar o teste de preços de novo**

Run: `node src/utils/precos.test.mjs`
Expected: "Todos os testes passaram".

- [ ] **Step 3: Commit final (se houver ajustes de lint)**

```bash
git add -A
git commit -m "chore: ajustes finais de lint da feature de margem"
```

---

## Self-Review

**Spec coverage:**
- Mapeamento valor da nota → custo: Task 4 ✓
- Margem padrão 30% editável: Task 2 ✓
- Colunas custo/venda/lucro: Task 3 ✓
- Arredondamento ,49/,99: Task 1 ✓
- Margem salva como padrão: Task 4 (salvarConfig) ✓
- Item editado à mão não sobrescrito: Task 2 (flag `vendaEditada`) ✓
- Aba Lucro sem mudança: confirmado (nenhuma task mexe nela) ✓
- Botão "Corrigir custos" sem mexer no estoque: Task 5 ✓

**Type consistency:** `precoVendaSugerido(custo, margemPct)` e `arredondarPreco(valor)` usados de forma idêntica em Tasks 1, 2, 5. Campos de item `precoVenda` e `vendaEditada` criados na Task 2 e usados consistentemente em Tasks 2, 3, 4. `config.margemPadrao` lido/gravado de forma consistente em Tasks 2, 4, 5.

**Placeholder scan:** nenhum TODO/TBD; todo passo com código tem o código completo.
