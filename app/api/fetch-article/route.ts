import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json() as { url?: string }
  const url = body.url ?? ''

  if (!url.trim()) {
    return NextResponse.json({ error: 'URLを入力してください' }, { status: 400 })
  }

  let baseUrl: string
  try {
    const parsed = new URL(url)
    baseUrl = `${parsed.protocol}//${parsed.host}`
  } catch {
    return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 })
  }

  // URLの末尾セグメントを取得（数字ならID、文字列ならスラッグ）
  const lastSegment = url.split('/').filter(Boolean).pop()?.split('?')[0] ?? ''
  const isNumericId = /^\d+$/.test(lastSegment)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let post: any = null

  // ① 数字IDの場合：/wp-json/wp/v2/posts/{id} で直接取得
  if (isNumericId) {
    try {
      const idRes = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${lastSegment}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      })
      if (idRes.ok) {
        post = await idRes.json()
      }
    } catch {
      // IDでの取得に失敗した場合はスラッグで試みる
    }
  }

  // ② スラッグの場合（または①で取得できなかった場合）
  if (!post) {
    let apiUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1&status=publish`
    if (lastSegment && !isNumericId) {
      apiUrl += `&slug=${encodeURIComponent(lastSegment)}`
    }
    try {
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
      post = posts[0]
    } catch {
      return NextResponse.json({ error: '記事の取得中にエラーが発生しました' }, { status: 500 })
    }
  }

  if (!post) {
    return NextResponse.json({ error: '記事が見つかりませんでした' }, { status: 404 })
  }

  const rawTitle: string = post?.title?.rendered ?? ''
  const rawContent: string = post?.content?.rendered ?? ''
  const postUrl: string = post?.link ?? url

  const title = rawTitle.replace(/&amp;/g, '&').replace(/<[^>]+>/g, '')
  const content = stripHtml(rawContent)

  return NextResponse.json({ title, content, postUrl })
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
