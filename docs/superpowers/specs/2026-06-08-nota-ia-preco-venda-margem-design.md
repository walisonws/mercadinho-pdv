# Nota IA — Custo de compra + Preço de venda com margem

**Data:** 2026-06-08
**Status:** Aprovado, aguardando revisão final

## Problema

Quando a Nota IA lança um produto, ela grava o preço lido da nota (o valor que o
lojista **pagou**) no campo de **preço de venda** (`preco`) e deixa o `custoCompra`
zerado. Consequências:

1. O produto é vendido no PDV pelo mesmo valor de custo → **lucro zero**.
2. A aba **Lucro** mostra "produto sem custo cadastrado" e o lucro fica distorcido.

A infraestrutura de relatório de lucro (`RelatorioLucro.jsx`) e o modelo de dados
(`preco` + `custoCompra`) **já existem e funcionam**. O defeito está só na tela de
entrada (Nota IA / `EntradaEstoque.jsx`).

## Objetivo

Na conferência da Nota IA, o valor da nota deve ir para o **custo**, e o sistema
deve sugerir um **preço de venda** aplicando uma margem padrão de **30%**,
editável pelo operador (Rafael). Com isso, a aba Lucro passa a mostrar o lucro
real automaticamente (incluindo o fechamento do dia via filtro "Hoje").

## Comportamento desejado

### Mapeamento de dados (a correção central)

- O preço lido da nota (`precoUnitario`) passa a representar o **custo de compra**.
- Ao aplicar no estoque:
  - **Produto novo:** grava `custoCompra = <valor da nota>` e
    `preco = <preço de venda definido>`.
  - **Produto existente:** atualiza `custoCompra` e `estoque`; o `preco` (venda)
    recebe o valor definido na tela (pré-preenchido com a sugestão da margem, mas
    editável; ver abaixo).

### Campo de margem (topo da tela de conferência)

- Um único campo: **"Margem de lucro: [ 30 ]%"**, default **30%**.
- Ao definir/alterar a margem, o sistema recalcula o **preço de venda sugerido**
  de todos os itens que o operador ainda não editou manualmente.
- A margem usada fica salva como padrão para a próxima nota
  (`config.margemPadrao`, persistida via `salvarConfig`).

### Colunas por item (conferência)

Cada item passa a exibir:

- **Custo** (R$) — vem da nota, editável.
- **Venda** (R$) — sugerido pela margem, editável.
- **Lucro/un** (R$) — calculado (`venda − custo`), exibido em verde.

Se o operador editar a venda de um item manualmente, esse item passa a ser
"travado": uma mudança posterior na margem global **não** sobrescreve o valor que
ele digitou.

### Regra de arredondamento do preço sugerido

A partir do alvo `custo × (1 + margem/100)`, arredondar **para cima** para o
próximo final em **,49** ou **,99**:

- centavos do alvo `≤ 0,49` → termina em `,49`
- centavos do alvo `> 0,49` → termina em `,99`

Exemplos:
- custo 7,00 + 30% = 9,10 → **9,49**
- custo 1,92 + 30% = 2,496 → **2,99** (centavos 0,496 > 0,49)
- custo 4,00 + 30% = 5,20 → **5,49**

### Aba Lucro

Nenhuma mudança. Já calcula faturamento − custo por período (Hoje / Semana / Mês /
Total). O filtro "Hoje" é o fechamento de lucro do dia que o lojista pediu.

## Fora de escopo (YAGNI)

- Não recalcular automaticamente o preço de produtos **já cadastrados** com dados
  errados (ex: os que já entraram com custo 0 e venda = custo). Esses podem ser
  corrigidos manualmente em Produtos → Editar, ou reprocessados numa nova nota.
  *Observação para o usuário:* os 14 produtos já cadastrados continuarão com
  custo 0 até serem corrigidos à mão.
- Margens diferentes por categoria.
- Relatórios novos de lucro (a aba existente já cobre).

## Arquivos afetados

- `src/pages/EntradaEstoque.jsx` — campo de margem, colunas custo/venda/lucro,
  cálculo + arredondamento, flag de "item editado manualmente", gravação correta
  em `aplicarNoEstoque`.
- `src/context/AppContext.jsx` — garantir que a entrada grave `custoCompra` (e não
  só `preco`); persistir `config.margemPadrao` se ainda não existir no schema de
  config. Conferir o fluxo equivalente de Reposição (`marcarItemComprado`) para o
  mesmo mapeamento custo vs. venda.

## Critérios de sucesso

1. Lançar uma nota pela Nota IA grava o valor da nota em **custo**, não em venda.
2. Cada item mostra venda sugerida = custo + 30%, arredondada para ,49/,99.
3. Editar a margem global recalcula os itens não-travados; itens editados à mão
   permanecem.
4. Após salvar, a aba Lucro mostra lucro positivo e correto para os produtos
   vendidos (sem aviso "sem custo").
