import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URLを入力してください' }, { status: 400 })
  }

  // WordPress REST API から記事を取得
  // URLからベースドメインを抽出し、スラッグで検索
  let baseUrl: string
  try {
    const parsed = new URL(url)
    baseUrl = `${parsed.protocol}//${parsed.host}`
  } catch {
    return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 })
  }

  // 最新記事を取得（URLがスラッグ付きの場合はslugで絞り込み）
  const slug = url.split('/').filter(Boolean).pop()?.split('?')[0] ?? ''

  let apiUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1&status=publish`
  if (slug && !slug.match(/^\d+$/)) {
    apiUrl += `&slug=${encodeURIComponent(slug)}`
  }

  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'WordPress REST APIにアクセスできませんでした。URLを確認してください。' },
      { status: 400 }
    )
  }

  const posts = await res.json()
  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: '記事が見つかりませんでした' }, { status: 404 })
  }

  const post = posts[0]
  const title: string = post.title?.rendered?.replace(/&amp;/g, '&').replace(/<[^>]+>/g, '') ?? ''
  const content: string = stripHtml(post.content?.rendered ?? '')

  return NextResponse.json({ title, content, postUrl: post.link })
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
