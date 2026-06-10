export function imprimirCupom(venda, config = {}) {
  const { itens = [], total = 0, pagamento, valorRecebido, troco, data } = venda
  const dataVenda = new Date(data || Date.now())
  const dataStr = dataVenda.toLocaleDateString('pt-BR')
  const horaStr = dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formaLabel = { dinheiro: 'Dinheiro', cartao: 'Cartão', cartao_debito: 'Cartão Débito', cartao_credito: 'Cartão Crédito', pix: 'Pix' }[pagamento] || pagamento || ''
  const nome = config.nomeMercadinho || 'Meu Mercadinho'
  const endereco = config.endereco || ''
  const telefone = config.telefone || ''

  const S = (tag, style, content) => `<${tag} style="${style}">${content}</${tag}>`
  const HR = '<div style="border-top:1px dashed #000;margin:5px 0"></div>'
  const C = (content, extra = '') => S('div', `text-align:center;${extra}`, content)

  const linhasItens = itens.map(item => {
    const qtdLabel = item.unidadeLabel || `${item.quantidade}x`
    return (
      S('div', 'font-weight:bold;padding:3px 0 1px', item.nome) +
      S('div', 'display:flex;justify-content:space-between;padding:0 0 5px;color:#444;font-size:10px',
        `<span>${qtdLabel} × R$ ${Number(item.preco).toFixed(2)}</span>` +
        S('span', 'font-weight:bold;color:#000', `R$ ${Number(item.total).toFixed(2)}`)
      )
    )
  }).join('')

  const cupomHTML =
    C(nome, 'font-size:14px;font-weight:bold;margin-bottom:2px') +
    (endereco ? C(endereco, 'font-size:10px') : '') +
    (telefone ? C(`Tel: ${telefone}`, 'font-size:10px') : '') +
    C(`${dataStr} ${horaStr}`, 'font-size:10px;margin-top:2px') +
    HR +
    S('div', 'font-weight:bold;margin-bottom:3px', 'ITENS') +
    linhasItens +
    HR +
    S('div', 'display:flex;justify-content:space-between;font-size:14px;font-weight:bold;padding:2px 0',
      '<span>TOTAL</span>' + S('span', '', `R$ ${Number(total).toFixed(2)}`)
    ) +
    S('div', 'display:flex;justify-content:space-between;padding-top:4px',
      S('span', '', formaLabel) +
      (pagamento === 'dinheiro' && valorRecebido
        ? S('span', '', `Recebido: R$ ${Number(valorRecebido).toFixed(2)}`)
        : '')
    ) +
    (pagamento === 'dinheiro' && troco > 0
      ? S('div', 'display:flex;justify-content:space-between;padding-top:2px',
          '<span>Troco</span>' + S('span', '', `R$ ${Number(troco).toFixed(2)}`))
      : '') +
    HR +
    C('Obrigado pela preferência!', 'font-size:10px;margin-top:4px') +
    C('Volte sempre!', 'font-size:10px') +
    '<div style="height:20mm"></div>'

  // Inject receipt as a hidden div; @media print shows only it
  const div = document.createElement('div')
  div.id = '__cupom_print__'
  div.innerHTML = S('div',
    'font-family:Courier New,Courier,monospace;font-size:11px;color:#000;width:54mm',
    cupomHTML
  )
  document.body.appendChild(div)

  const style = document.createElement('style')
  style.textContent = `
    @media print {
      body > *:not(#__cupom_print__) { display: none !important; }
      #__cupom_print__ { display: block !important; }
      @page { size: 58mm auto; margin: 2mm 1mm; }
    }
    #__cupom_print__ { display: none; }
  `
  document.head.appendChild(style)

  function cleanup() {
    div.remove()
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 60000)

  window.print()
}
