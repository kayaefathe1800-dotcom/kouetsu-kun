import { NextRequest, NextResponse } from 'next/server'
import { buildProofreadPrompt } from '@/lib/rules'

// Groqの無料枠に収まるよう記事を分割して校閲
const MAX_ARTICLE_CHARS = 3500

export async function POST(req: NextRequest) {
  const { article, keywords, charCount, customRules } = await req.json()

  if (!article?.trim()) {
    return NextResponse.json({ error: '記事本文を入力してください' }, { status: 400 })
  }

  // OpenAI優先、なければGroqにフォールバック
  const openaiKey = process.env.OPENAI_API_KEY
  const groqKey = process.env.GROQ_API_KEY
  const useOpenAI = !!openaiKey

  if (!openaiKey && !groqKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY または GROQ_API_KEY が設定されていません' }, { status: 500 })
  }
  const apiKey = (openaiKey || groqKey)!

  // 記事が長い場合は分割して校閲し、結果をマージ
  const chunks = splitArticle(article, MAX_ARTICLE_CHARS)

  let allCorrections: unknown[] = []
  let revisedArticle = ''
  let titleSuggestions: string[] = []
  let finalCheck = { readability: '', seoBalance: '', overallComment: '' }
  let summary = { totalIssues: 0, criticalIssues: 0, issuesByCategory: {} as Record<string, number> }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const isLast = i === chunks.length - 1
    const prompt = buildProofreadPrompt(
      chunk,
      keywords ?? '',
      charCount ?? '',
      customRules ?? undefined,
      chunks.length > 1 ? `（${i + 1}/${chunks.length}パート目）` : ''
    )

    const endpoint = useOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions'

    const model = useOpenAI ? 'gpt-4o-mini' : 'llama-3.3-70b-versatile'

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 6000,
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.error('AI API error:', aiRes.status, err)
      let errMsg = `HTTPステータス: ${aiRes.status}`
      try { errMsg = JSON.parse(err)?.error?.message ?? errMsg } catch { /* ignore */ }
      return NextResponse.json({ error: `AI校閲に失敗しました（${errMsg}）` }, { status: 502 })
    }

    const aiJson = await aiRes.json()
    const rawText: string = aiJson?.choices?.[0]?.message?.content ?? ''

    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) continue

    let result: Record<string, unknown>
    try {
      result = JSON.parse(match[0])
    } catch {
      continue
    }

    // 訂正一覧をマージ
    if (Array.isArray(result.corrections)) {
      allCorrections = allCorrections.concat(result.corrections)
    }

    // 修正全文・タイトル・最終確認は最後のチャンクのみ使用
    if (isLast) {
      revisedArticle = (result.revisedArticle as string) ?? ''
      titleSuggestions = (result.titleSuggestions as string[]) ?? []
      finalCheck = (result.finalCheck as typeof finalCheck) ?? finalCheck
      summary = (result.summary as typeof summary) ?? summary
    }
  }

  // 分割校閲の場合、修正全文は全チャンクをつなげて再構成
  if (chunks.length > 1 && !revisedArticle) {
    revisedArticle = chunks.join('\n\n')
  }

  summary.totalIssues = allCorrections.length

  return NextResponse.json({
    corrections: allCorrections,
    titleSuggestions,
    revisedArticle,
    finalCheck,
    summary,
  })
}

// 記事を段落単位で分割
function splitArticle(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]

  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + para).length > maxChars && current) {
      chunks.push(current.trim())
      current = para
    } else {
      current += (current ? '\n\n' : '') + para
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks.length > 0 ? chunks : [text.substring(0, maxChars)]
}
