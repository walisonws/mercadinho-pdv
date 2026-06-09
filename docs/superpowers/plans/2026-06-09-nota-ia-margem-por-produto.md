# Margem (%) por produto na Nota IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir definir a margem de lucro (%) de cada produto da Nota IA individualmente, na linha do item, mantendo um botão "Aplicar a todos" que respeita os itens já personalizados.

**Architecture:** Uma função pura nova (`margemEfetiva`) em `src/utils/precos.js` para back-calcular a % a partir de um preço de venda digitado na mão. Todo o resto é estado/UI dentro de `src/pages/EntradaEstoque.jsx`: cada item ganha um campo `margem`, o handler `atualizarItem` passa a tratar mudanças de `margem`/`precoVenda`, e a margem global vira ação por botão.

**Tech Stack:** React 19, Vite, Tailwind. Testes unitários simples em `.test.mjs` rodados com `node` (sem framework).

**Spec:** `docs/superpowers/specs/2026-06-09-nota-ia-margem-por-produto-design.md`

---

### Task 1: Função pura `margemEfetiva` (TDD)

Back-calcula a margem (%) embutida num preço de venda, dado o custo. Usada para atualizar o
campo "Lucro %" quando o lojista digita a venda em R$ direto.

**Files:**
- Modify: `src/utils/precos.js`
- Test: `src/utils/precos.test.mjs`

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `src/utils/precos.test.mjs`, **antes** do bloco
`if (falhas > 0) { ... }` (linhas 27-28):

```js
// margemEfetiva: % de lucro embutida numa venda, dado o custo
check('efetiva 2 -> 2.99', margemEfetiva(2, 2.99), 50)
check('efetiva 7 -> 9.49', margemEfetiva(7, 9.49), 36)
check('efetiva 10 -> 13', margemEfetiva(10, 13), 30)
check('efetiva custo 0', margemEfetiva(0, 5), 0)
check('efetiva venda igual custo', margemEfetiva(5, 5), 0)
```

E atualizar a linha 1 do import para incluir a nova função:

```js
import { arredondarPreco, precoVendaSugerido, margemEfetiva } from './precos.js'
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node src/utils/precos.test.mjs`
Expected: FAIL — erro de `margemEfetiva is not a function` (ou processo sai com erro).

- [ ] **Step 3: Implementar a função**

Adicionar ao final de `src/utils/precos.js` (depois de `precoVendaSugerido`, linha 15):

```js
// Margem (%) efetiva embutida num preço de venda, dado o custo.
// Usada para mostrar a % real quando o usuário digita a venda em R$ na mão.
export function margemEfetiva(custo, venda) {
  if (!custo || custo <= 0) return 0
  return Math.round((venda / custo - 1) * 100)
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node src/utils/precos.test.mjs`
Expected: PASS — "Todos os testes passaram".

- [ ] **Step 5: Commit**

```bash
git add src/utils/precos.js src/utils/precos.test.mjs
git commit -m "feat: margemEfetiva() para back-calcular % a partir da venda"
```

---

### Task 2: Margem por item na tela Nota IA

Adiciona `margem` a cada item, reescreve `atualizarItem`, troca a aplicação automática da
margem global por um botão "Aplicar a todos", e adiciona o campo "Lucro %" na linha de cada
item. Tudo em um arquivo; commit único após verificar no preview (mantém o app sempre
buildando).

**Files:**
- Modify: `src/pages/EntradaEstoque.jsx`

- [ ] **Step 1: Importar `margemEfetiva`**

Linha 4, trocar:

```js
import { precoVendaSugerido } from '../utils/precos'
```

por:

```js
import { precoVendaSugerido, margemEfetiva } from '../utils/precos'
```

- [ ] **Step 2: Adicionar `margem` ao item em `analisarTexto`**

No objeto retornado dentro de `analisarTexto` (linhas 189-198), adicionar o campo `margem`
logo após `precoUnitario`. Resultado:

```js
        return {
          _id: i, nomeOriginal: item.nome || '', nome: item.nome || '',
          quantidade: item.quantidade || 1, unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          margem,
          precoVenda: precoVendaSugerido(item.preco_unitario || 0, margem),
          vendaEditada: false,
          resolucao: produtoMatch ? 'existente' : 'novo',
          produtoId: produtoMatch?.id || '', sugestoes,
          categoria: 'mercearia', tipo: 'unidade', selecionarProduto: false, ativo: true,
        }
```

- [ ] **Step 3: Adicionar `margem` ao item em `analisarNota`**

No objeto retornado dentro de `analisarNota` (linhas 266-282), adicionar `margem` logo após
`precoUnitario`. Resultado:

```js
        return {
          _id: i,
          nomeOriginal: item.nome || '',
          nome: item.nome || '',
          quantidade: item.quantidade || 1,
          unidade: normalizarUnidade(item.unidade),
          precoUnitario: item.preco_unitario || 0,
          margem,
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

- [ ] **Step 4: Reescrever `atualizarItem`**

Substituir a função inteira (linhas 292-302) por:

```js
  function atualizarItem(id, campo, valor) {
    setItens(prev => prev.map(i => {
      if (i._id !== id) return i
      const atualizado = { ...i, [campo]: valor }
      if (campo === 'margem') {
        atualizado.vendaEditada = true
        atualizado.precoVenda = precoVendaSugerido(atualizado.precoUnitario || 0, valor || 0)
      } else if (campo === 'precoVenda') {
        atualizado.vendaEditada = true
        atualizado.margem = margemEfetiva(atualizado.precoUnitario || 0, valor || 0)
      } else if (campo === 'precoUnitario') {
        if (atualizado.vendaEditada) {
          // mantém a venda personalizada; só atualiza a % mostrada
          atualizado.margem = margemEfetiva(valor || 0, atualizado.precoVenda || 0)
        } else {
          atualizado.precoVenda = precoVendaSugerido(valor || 0, atualizado.margem ?? 0)
        }
      }
      return atualizado
    }))
  }
```

- [ ] **Step 5: Trocar `alterarMargem` (live) por `aplicarMargemTodos` (botão)**

Substituir a função `alterarMargem` (linhas 304-309) por:

```js
  function aplicarMargemTodos() {
    setItens(prev => prev.map(i =>
      i.vendaEditada
        ? i
        : { ...i, margem, precoVenda: precoVendaSugerido(i.precoUnitario || 0, margem) }
    ))
  }
```

- [ ] **Step 6: Atualizar o controle de margem global (cabeçalho da revisão)**

Substituir o bloco do controle global (linhas 624-638) por:

```jsx
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-sm font-semibold text-violet-800">Margem geral</span>
            <input
              type="number"
              min={0}
              step="1"
              value={margem}
              onChange={e => setMargem(parseFloat(e.target.value) || 0)}
              className="w-20 border-2 border-violet-200 rounded-lg px-3 py-1.5 text-sm font-bold text-violet-800 focus:outline-none focus:border-violet-500"
            />
            <span className="text-sm font-semibold text-violet-800">%</span>
            <button
              onClick={aplicarMargemTodos}
              className="ml-auto bg-violet-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
            >
              Aplicar a todos
            </button>
          </div>
          <p className="text-xs text-violet-600 -mt-2 mb-4 px-1">
            "Aplicar a todos" muda só os itens que você não ajustou na mão.
          </p>
```

- [ ] **Step 7: Adicionar o campo "Lucro %" na linha de cada item (`ItemRevisao`)**

Dentro de `ItemRevisao`, logo **depois** do `</div>` que fecha a div de custo/venda/lucro
(a `<div className="flex items-center gap-3 mt-1 flex-wrap">`, que fecha na linha 807) e
**antes** do bloco de badge de resolução (`{item.resolucao === 'existente' ...`, linha 810),
inserir:

```jsx
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Lucro</span>
              <input
                type="number"
                min={0}
                step="1"
                value={item.margem ?? 0}
                onChange={e => onAtualizar('margem', parseFloat(e.target.value) || 0)}
                className="w-16 border-2 border-violet-200 rounded-lg px-2 py-1 text-sm font-bold text-violet-700 text-center focus:outline-none focus:border-violet-500"
              />
              <span className="text-xs text-gray-500">%</span>
              {item.vendaEditada && (
                <span className="text-[10px] text-violet-500 font-semibold bg-violet-50 px-1.5 py-0.5 rounded">
                  personalizado
                </span>
              )}
            </div>
```

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: sem erros novos no arquivo `EntradaEstoque.jsx` (sem referência a `alterarMargem`,
sem variáveis não usadas).

- [ ] **Step 9: Verificar no preview**

Subir o dev server e validar o fluxo (ver Task 3). Só commitar depois que a verificação
passar.

- [ ] **Step 10: Commit**

```bash
git add src/pages/EntradaEstoque.jsx
git commit -m "feat: margem (%) por produto na Nota IA + botao Aplicar a todos"
```

---

### Task 3: Verificação no preview

Sem testes de UI automatizados no projeto — validação pelo preview com os preview_* tools.

**Files:** nenhum (verificação).

- [ ] **Step 1: Subir o dev server** (`preview_start` na pasta `mercadinho-pdv`).

- [ ] **Step 2: Abrir a tela Nota IA e simular itens.** Como a leitura real exige uma nota,
  usar o modo **"Colar texto de outra IA"** com um exemplo:

```
Banana Nanica 3kg - R$ 2,00/kg
Arroz Tio João 5kg - R$ 24,90
Feijão Carioca 1kg - R$ 8,50
```

  Clicar "Analisar texto" (usa a chave padrão do sistema, se configurada no `.env`).

- [ ] **Step 3: Conferir o estado inicial** — cada item mostra "Lucro [30] %" e a venda
  arredondada (ex.: custo 2,00 → venda 2,99).

- [ ] **Step 4: Mudar a % de um item** (ex.: Arroz para 50%) e confirmar que venda e lucro
  recalculam na hora, e aparece o selo "personalizado".

- [ ] **Step 5: Mudar a "Margem geral" para 40 e clicar "Aplicar a todos"** — confirmar que
  os itens NÃO personalizados foram para 40% e o item personalizado (Arroz) continuou em 50%.

- [ ] **Step 6: Abrir o detalhe de um item e digitar a Venda em R$ na mão** (ex.: 9,99) —
  confirmar que o campo "Lucro %" da linha se ajustou para a margem real.

- [ ] **Step 7: Conferir o console** (`preview_console_logs`) — sem erros.

- [ ] **Step 8: Screenshot** da revisão com os campos de % visíveis, para registro.

---

## Self-Review

**Spec coverage:**
- Margem por item sempre visível → Task 2 Step 7. ✅
- Recalcula venda/lucro mantendo arredondamento → Task 2 Step 4 (`precoVendaSugerido`). ✅
- Item personalizado protegido → Task 2 Steps 4-5 (`vendaEditada` + `aplicarMargemTodos`). ✅
- Margem global + "Aplicar a todos" respeitando manuais → Task 2 Steps 5-6. ✅
- Editar venda em R$ ajusta a % → Task 2 Step 4 (`precoVenda` → `margemEfetiva`) + Task 1. ✅
- Custo 0 tratado → Task 1 (`margemEfetiva` retorna 0) + `precoVendaSugerido` já retorna 0. ✅
- Gravação no estoque inalterada → `aplicarNoEstoque` não é tocado. ✅

**Placeholder scan:** sem TBD/TODO; todo passo de código tem o código completo. ✅

**Type/nome consistency:** `margem` (item), `margemEfetiva(custo, venda)`, `aplicarMargemTodos()`,
`setMargem` (já existe via `useState`) usados de forma consistente entre as tasks. A função
removida `alterarMargem` não é mais referenciada após Task 2 Step 6. ✅
