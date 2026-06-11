import JsBarcode from 'jsbarcode'

export function imprimirEtiqueta(produto) {
  const { nome, codigo, preco } = produto

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  let formato = 'CODE128'
  if (/^\d{13}$/.test(codigo)) formato = 'EAN13'
  else if (/^\d{8}$/.test(codigo)) formato = 'EAN8'

  try {
    JsBarcode(svg, codigo, {
      format: formato,
      width: 1.5,
      height: 38,
      displayValue: true,
      fontSize: 9,
      margin: 3,
      textMargin: 2,
    })
  } catch {
    JsBarcode(svg, codigo, {
      format: 'CODE128',
      width: 1.5,
      height: 38,
      displayValue: true,
      fontSize: 9,
      margin: 3,
    })
  }

  const svgStr = new XMLSerializer().serializeToString(svg)
  const nomeEscapado = nome.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><style>
    @page { size: 50mm 30mm; margin: 1mm 2mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 1mm; width: 46mm; }
    .nome { font-size: 8px; font-weight: bold; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 1px; }
    .preco { font-size: 11px; font-weight: bold; text-align: center; margin-top: 1px; }
    svg { width: 100%; height: auto; display: block; }
  </style></head><body>
    <div class="nome">${nomeEscapado}</div>
    ${svgStr}
    <div class="preco">R$ ${Number(preco).toFixed(2)}</div>
  </body></html>`)
  doc.close()

  iframe.contentWindow.focus()
  iframe.contentWindow.print()
  iframe.contentWindow.onafterprint = () => iframe.remove()
  setTimeout(() => { if (iframe.parentNode) iframe.remove() }, 60000)
}
