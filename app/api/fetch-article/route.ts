import { NextRequest, NextResponse } from 'next/server'

interface WpPost {
  title: { rendered: string }
  content: { rendered: string }
  link: string
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url?.trim()) {
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

  let post: WpPost | null = null

  // ① 数字IDの場合：/wp-json/wp/v2/posts/{id} で直接取得
  if (isNumericId) {
    const idRes = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${lastSegment}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (idRes.ok) {
      post = (await idRes.json()) as WpPost
    }
  }

  // ② スラッグの場合（または①で取得できなかった場合）
  if (!post) {
    let apiUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1&status=publish`
    if (lastSegment && !isNumericId) {
      apiUrl += `&slug=${encodeURIComponent(lastSegment)}`
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
    const posts = (await res.json()) as WpPost[]
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: '記事が見つかりませんでした' }, { status: 404 })
    }
    post = posts[0]
  }

  if (!post) {
    return NextResponse.json({ error: '記事が見つかりませんでした' }, { status: 404 })
  }

  const title = post.title.rendered.replace(/&amp;/g, '&').replace(/<[^>]+>/g, '')
  const content = stripHtml(post.content.rendered)

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
