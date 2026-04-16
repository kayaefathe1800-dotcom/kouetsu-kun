import { NextRequest, NextResponse } from 'next/server'
import { buildProofreadPrompt } from '@/lib/rules'

export async function POST(req: NextRequest) {
  const { article, keywords, charCount, customRules } = await req.json()

  if (!article?.trim()) {
    return NextResponse.json({ error: '記事本文を入力してください' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 })
  }

  const prompt = buildProofreadPrompt(article, keywords ?? '', charCount ?? '', customRules ?? undefined)

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('Gemini API error status:', geminiRes.status)
    console.error('Gemini API error body:', err)
    const errJson = JSON.parse(err || '{}')
    const errMsg = errJson?.error?.message ?? `HTTPステータス: ${geminiRes.status}`
    return NextResponse.json(
      { error: `AI校閲に失敗しました（${errMsg}）` },
      { status: 502 }
    )
  }

  const geminiJson = await geminiRes.json()
  const rawText: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

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
