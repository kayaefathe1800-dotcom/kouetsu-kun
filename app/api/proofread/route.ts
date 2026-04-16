import { NextRequest, NextResponse } from 'next/server'
import { buildProofreadPrompt } from '@/lib/rules'

export async function POST(req: NextRequest) {
  const { article, keywords, charCount, customRules } = await req.json()

  if (!article?.trim()) {
    return NextResponse.json({ error: '記事本文を入力してください' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY が設定されていません' }, { status: 500 })
  }

  const prompt = buildProofreadPrompt(article, keywords ?? '', charCount ?? '', customRules ?? undefined)

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.text()
    console.error('Groq API error:', groqRes.status, err)
    let errMsg = `HTTPステータス: ${groqRes.status}`
    try { errMsg = JSON.parse(err)?.error?.message ?? errMsg } catch { /* ignore */ }
    return NextResponse.json({ error: `AI校閲に失敗しました（${errMsg}）` }, { status: 502 })
  }

  const groqJson = await groqRes.json()
  const rawText: string = groqJson?.choices?.[0]?.message?.content ?? ''

  // JSON部分を抽出
  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) {
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }

  try {
    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'AIの応答のJSON解析に失敗しました' }, { status: 500 })
  }
}
