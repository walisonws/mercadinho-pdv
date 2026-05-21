export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ erro: 'GEMINI_API_KEY não configurada' })

  const { imagemBase64, mimeType = 'image/jpeg' } = req.body || {}
  if (!imagemBase64) return res.status(400).json({ erro: 'Imagem não fornecida' })

  const prompt = `Você é um especialista em leitura de notas fiscais e documentos de compra brasileiros.
Analise a imagem e extraia TODOS os produtos/itens listados, incluindo notas de armazém, notas simples, DANFE ou qualquer documento de compra.

Para cada item retorne:
- nome: nome completo do produto (string)
- quantidade: quantidade numérica (number)
- unidade: unidade abreviada — use: "un" para unidade/peça, "kg" para quilogramas, "cx" para caixa, "fd" para fardo, "lt" para litro, "pc" para pacote, "sc" para saco
- preco_unitario: preço unitário em reais (number, somente o número, ex: 18.50)

Retorne SOMENTE um JSON válido no seguinte formato, sem explicações:
{"itens": [{"nome": "Arroz 5kg", "quantidade": 10, "unidade": "un", "preco_unitario": 18.50}]}

Se não encontrar itens claros, retorne: {"itens": []}
Abreviações comuns: Fd=fardo, Cx=caixa, Sc=saco, Pc=pacote, Fdo=fundo, Qtd=quantidade, Vl/Vr=valor, Un=unidade, Lt=litro`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imagemBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
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
