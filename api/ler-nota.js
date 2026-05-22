export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ erro: 'GEMINI_API_KEY não configurada' })

  const { imagemBase64, mimeType = 'image/jpeg', texto } = req.body || {}
  if (!imagemBase64 && !texto) return res.status(400).json({ erro: 'Imagem ou texto não fornecido' })

  const prompt = `Você é um especialista em leitura de notas fiscais brasileiras. Analise a imagem com atenção máxima.

TIPOS DE DOCUMENTO que você pode receber:
1. DANF-e / NF-e: tabela com colunas Código, Descrição, QTD, V.UN, V.TOTAL
2. NFC-e (cupom fiscal eletrônico): formato estreito, cada item em 2 linhas:
   - Linha 1: número do item + código + NOME DO PRODUTO + unidade
   - Linha 2: quantidade + "Kg" ou "Un" + "x" + preço unitário + valor total
   Exemplo: "001  576 BANANA NANICA kg" / "3,035 Kg x  4,99  15,14"
3. Nota de atacado / armazém: formato livre, menos estruturado

REGRAS IMPORTANTES:
- Ignore anotações manuscritas (valores escritos à mão sobre o impresso)
- Ignore linhas de "Desconto no item X"
- Para NFC-e, use o preço da linha 2 (valor numérico após o "x"), não o preço riscado ou manuscrito
- Nome do produto: use o nome impresso, limpo, sem códigos numéricos no início
- Se o mesmo produto aparecer múltiplas vezes (ex: BANANA em 4 linhas), some as quantidades em um único item

Para cada item retorne:
- nome: nome limpo do produto (ex: "Banana Nanica kg", "Arroz 5kg", "Coca-Cola 2L")
- quantidade: quantidade numérica (number)
- unidade: "un" para unidade/peça, "kg" para quilogramas, "cx" para caixa, "fd" para fardo, "lt" para litro, "pc" para pacote
- preco_unitario: preço unitário em reais (number, ex: 4.99)

Retorne SOMENTE JSON válido, sem texto adicional:
{"itens": [{"nome": "Banana Nanica kg", "quantidade": 14.84, "unidade": "kg", "preco_unitario": 4.99}]}

Se não encontrar itens: {"itens": []}`

  const promptTexto = `Você é um especialista em notas fiscais brasileiras. Analise o texto abaixo, extraído de uma nota fiscal ou fornecido por outra IA, e identifique os produtos.

REGRAS:
- Ignore linhas de desconto, totais, impostos e informações que não sejam itens
- Se o mesmo produto aparecer múltiplas vezes, some as quantidades
- Nome do produto: limpo, sem códigos numéricos no início

Para cada item retorne:
- nome: nome limpo do produto
- quantidade: quantidade numérica (number)
- unidade: "un" para unidade/peça, "kg" para quilogramas, "cx" para caixa, "fd" para fardo, "lt" para litro, "pc" para pacote
- preco_unitario: preço unitário em reais (number)

TEXTO DA NOTA:
${texto}

Retorne SOMENTE JSON válido, sem texto adicional:
{"itens": [{"nome": "Banana Nanica kg", "quantidade": 14.84, "unidade": "kg", "preco_unitario": 4.99}]}

Se não encontrar itens: {"itens": []}`

  const contents = texto
    ? [{ parts: [{ text: promptTexto }] }]
    : [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imagemBase64 } }] }]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini error:', errText)
      return res.status(500).json({ erro: 'Erro ao chamar Gemini API', detalhe: errText })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let parsed = { itens: [] }
    try {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
    } catch {
      parsed = { itens: [] }
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Erro interno:', err)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}
