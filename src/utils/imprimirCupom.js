export function imprimirCupom(venda, config = {}) {
  const { itens = [], total = 0, pagamento, valorRecebido, troco, data } = venda
  const dataVenda = new Date(data || Date.now())
  const dataStr = dataVenda.toLocaleDateString('pt-BR')
  const horaStr = dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formaLabel = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'Pix' }[pagamento] || pagamento || ''
  const nome = config.nomeMercadinho || 'Meu Mercadinho'
  const endereco = config.endereco || ''
  const telefone = config.telefone || ''

  const linhasItens = itens.map(item => {
    const qtdLabel = item.unidadeLabel || `${item.quantidade}x`
    return `
      <tr>
        <td colspan="2" style="padding:2px 0 0;font-weight:bold">${item.nome}</td>
      </tr>
      <tr>
        <td style="padding:0 0 5px;color:#555">${qtdLabel} &times; R$ ${Number(item.preco).toFixed(2)}</td>
        <td style="text-align:right;padding:0 0 5px;font-weight:bold">R$ ${Number(item.total).toFixed(2)}</td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:80mm auto;margin:3mm 2mm}
    body{font-family:'Courier New',Courier,monospace;font-size:11px;width:76mm;color:#000}
    .c{text-align:center}
    .b{font-weight:bold}
    .hr{border:none;border-top:1px dashed #000;margin:5px 0}
    table{width:100%;border-collapse:collapse}
    .tot td{font-size:13px;font-weight:bold;padding-top:4px}
  </style>
</head>
<body>
  <div class="c b" style="font-size:14px;margin-bottom:2px">${nome}</div>
  ${endereco ? `<div class="c" style="font-size:10px">${endereco}</div>` : ''}
  ${telefone ? `<div class="c" style="font-size:10px">Tel: ${telefone}</div>` : ''}
  <div class="c" style="font-size:10px;margin-top:2px">${dataStr} ${horaStr}</div>

  <hr class="hr">
  <div class="b" style="margin-bottom:3px">ITENS</div>
  <table>${linhasItens}</table>
  <hr class="hr">

  <table>
    <tr class="tot">
      <td>TOTAL</td>
      <td style="text-align:right">R$ ${Number(total).toFixed(2)}</td>
    </tr>
    <tr>
      <td style="padding-top:4px">${formaLabel}</td>
      ${pagamento === 'dinheiro' && valorRecebido
        ? `<td style="text-align:right;padding-top:4px">Recebido: R$ ${Number(valorRecebido).toFixed(2)}</td>`
        : '<td></td>'}
    </tr>
    ${pagamento === 'dinheiro' && troco > 0
      ? `<tr><td style="padding-top:2px">Troco</td><td style="text-align:right;padding-top:2px">R$ ${Number(troco).toFixed(2)}</td></tr>`
      : ''}
  </table>

  <hr class="hr">
  <div class="c" style="font-size:10px;margin-top:4px">Obrigado pela preferência!</div>
  <div class="c" style="font-size:10px">Volte sempre!</div>
  <div style="height:20mm"></div>
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:none;opacity:0;'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()

  iframe.contentWindow.focus()
  iframe.contentWindow.print()

  setTimeout(() => document.body.removeChild(iframe), 3000)
}
