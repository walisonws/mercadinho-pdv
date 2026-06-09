# Nota IA — Margem (%) por produto

**Data:** 2026-06-09
**Projeto:** Mercadinho PDV
**Arquivo afetado:** `src/pages/EntradaEstoque.jsx`

## Problema

Na tela **Entrada de Estoque por IA** ("Nota IA"), quando a IA lê uma nota, todos os
produtos recebem a **mesma margem de lucro** (global, padrão 30%). O lojista só consegue
ajustar o **preço de venda em R$** item a item (abrindo o detalhe). Não há como dizer
"esse produto eu quero 40%, esse outro 25%" digitando a **porcentagem** de cada um.

## Objetivo

Permitir definir a **margem (%) de cada produto individualmente**, direto na linha do item
(sempre visível), mantendo um botão para **aplicar uma % em todos** de uma vez.

## Comportamento desejado

### Margem por item (sempre visível)
- Cada item da revisão ganha um campo **"Lucro %"** editável na linha principal (colapsada),
  do lado das informações de custo/venda/lucro — não escondido no detalhe.
- Ao digitar a % de um item: **venda** e **lucro** recalculam na hora, mantendo o
  arredondamento comercial para `,49` / `,99` (função `precoVendaSugerido` existente).
- A % é o **alvo antes do arredondamento** — mesma semântica da margem global hoje. Ex.:
  custo R$ 2,00 + 30% = alvo R$ 2,60 → arredonda para venda R$ 2,99.

### Item "personalizado"
- Mexer na **% de um item** OU no **preço de venda em R$** marca o item como
  **personalizado** (campo `vendaEditada` reaproveitado).
- Item personalizado fica **protegido** do botão "Aplicar a todos".

### Margem global + "Aplicar a todos"
- No topo continua o campo de **margem geral** (inicia em 30% ou `config.margemPadrao`).
- Ao lado dele, um botão **"Aplicar a todos"**.
- Clicar no botão coloca a margem geral em **todos os itens que NÃO foram personalizados**
  (decisão do usuário: "respeita os manuais"). Os personalizados ficam com a % que o
  lojista escolheu.
- O campo global deixa de aplicar "ao vivo" a cada tecla; a aplicação passa a ser pelo
  botão, para o comportamento ficar previsível e explícito.

### Preço de venda em R$ (detalhe) — mantido, com sincronização
- No painel expandido, o campo **Venda (R$)** continua editável (permite cravar um preço
  exato, ex. 4,99).
- Ao editar a venda em R$ diretamente, o item vira **personalizado** e o campo **"Lucro %"**
  da linha **se ajusta** para refletir a margem real daquele preço (back-calculada,
  arredondada para inteiro): `margemEfetiva = round((venda / custo - 1) * 100)`.
- Se o custo for 0 (desconhecido), a % fica em branco/0 e a venda é editável livremente.

### Aplicar ao estoque (sem mudança)
- A gravação no estoque (`aplicarNoEstoque`) **não muda**: continua salvando `custoCompra`
  e `preco` (venda) por item, como já faz hoje.
- Continua salvando `margemPadrao` global em `config` quando ela difere do salvo.

## Abordagem escolhida

**Opção A** (recomendada e aprovada): campo de % editável **na linha de cada produto** +
botão "Aplicar a todos" no topo.

Alternativa descartada — **Opção B**: % só no detalhe expandido. Rejeitada porque exigiria
abrir item por item, contrariando o pedido de ter a % "do lado de cada produto".

## Modelo de dados (estado por item)

Cada item da lista `itens` (já existente) passa a usar:

| Campo            | Significado                                                        |
|------------------|-------------------------------------------------------------------|
| `margem`         | **(novo)** margem-alvo em % daquele item. Inicia = margem global. |
| `precoUnitario`  | custo (já existe)                                                  |
| `precoVenda`     | venda em R$, derivada de `precoUnitario` + `margem` (já existe)    |
| `vendaEditada`   | item personalizado — protegido do "Aplicar a todos" (já existe)   |

## Mudanças no código (`src/pages/EntradaEstoque.jsx`)

1. **Ao montar os itens** (`analisarNota` e `analisarTexto`): adicionar `margem` ao objeto
   de cada item, inicializado com a margem global atual.
2. **`atualizarItem`**: ao mudar `margem` do item → recalcular `precoVenda` e marcar
   `vendaEditada = true`. Ao mudar `precoVenda` (R$) → marcar `vendaEditada = true` e
   recalcular `margem` efetiva (back-calculada). Ao mudar `precoUnitario` de item não
   personalizado → recalcular `precoVenda` a partir da `margem` do item.
3. **Margem global**: transformar a aplicação automática (`alterarMargem`) em ação por
   **botão "Aplicar a todos"**, que seta `item.margem = margemGlobal` e recalcula
   `precoVenda` apenas dos itens com `vendaEditada === false`.
4. **`ItemRevisao`**: adicionar o campo compacto **"Lucro %"** na linha principal,
   editável, ligado a `onAtualizar('margem', ...)`.

## Casos de borda

- **Custo R$ 0 / desconhecido:** `precoVendaSugerido` já retorna 0; o campo % não força um
  preço. Venda fica editável manualmente no detalhe.
- **% negativa ou vazia:** tratar como 0 (igual ao parsing atual de `parseFloat(...) || 0`).
- **Item removido:** sem mudança — segue saindo da lista.
- **"Aplicar a todos" sem itens personalizados:** aplica em todos (todos não-personalizados).

## Fora de escopo (YAGNI)

- Margem por categoria.
- Persistir margens diferentes por produto entre notas distintas.
- Mudar a lógica de arredondamento comercial.
- Qualquer alteração na gravação do estoque ou no formato salvo em `config`.

## Testes

- `src/utils/precos.test.mjs` já cobre `precoVendaSugerido` e `arredondarPreco`; nenhuma
  mudança nessas funções, então os testes continuam válidos.
- Verificação manual no preview: ler/colar uma nota, ajustar % de um item, conferir
  venda/lucro recalculando; clicar "Aplicar a todos" e confirmar que o item personalizado
  não muda; editar venda em R$ no detalhe e ver a % se ajustar.
