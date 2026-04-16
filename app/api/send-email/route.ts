import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Resend } = require('resend') as { Resend: new (key: string) => { emails: { send: (opts: unknown) => Promise<unknown> } } }

export async function POST(req: NextRequest) {
  const { recipients, title, corrections, revisedArticle, titleSuggestions, finalCheck } =
    await req.json()

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: 'メール設定が不完全です' }, { status: 500 })
  }

  if (!recipients?.length) {
    return NextResponse.json({ error: '送信先メールアドレスを入力してください' }, { status: 400 })
  }

  const resend = new Resend(apiKey)

  const correctionsTable = corrections
    .map(
      (c: { original: string; corrected: string; reason: string; category: string }, i: number) =>
        `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151">${escHtml(c.original)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#166534;font-weight:500">${escHtml(c.corrected)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${escHtml(c.reason)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><span style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:9999px;font-size:12px">${escHtml(c.category)}</span></td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:800px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

  <!-- ヘッダー -->
  <div style="background:linear-gradient(135deg,#166534,#22c55e);padding:28px 32px">
    <div style="font-size:13px;color:#bbf7d0;margin-bottom:4px">校閲くん — 自動校閲レポート</div>
    <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700">${escHtml(title)}</h1>
    <div style="margin-top:8px;font-size:13px;color:#dcfce7">${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} に校閲完了</div>
  </div>

  <div style="padding:28px 32px">

    <!-- サマリー -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:28px">
      <div style="font-weight:700;color:#166534;margin-bottom:12px;font-size:15px">📊 校閲サマリー</div>
      <div style="font-size:28px;font-weight:700;color:#166534">${corrections.length}<span style="font-size:16px;font-weight:400;color:#4b5563;margin-left:4px">件の修正</span></div>
      <div style="margin-top:4px;font-size:13px;color:#6b7280">最終確認: ${escHtml(finalCheck?.overallComment ?? '')}</div>
    </div>

    <!-- タイトル案 -->
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">💡 修正タイトル案</h2>
    <ol style="margin:0 0 28px;padding-left:20px">
      ${(titleSuggestions ?? []).map((t: string) => `<li style="padding:6px 0;color:#374151">${escHtml(t)}</li>`).join('')}
    </ol>

    <!-- 訂正テーブル -->
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">✏️ 訂正箇所一覧</h2>
    <div style="overflow-x:auto;margin-bottom:28px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb">元の文章</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb">訂正後</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb">理由</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb">カテゴリ</th>
          </tr>
        </thead>
        <tbody>${correctionsTable}</tbody>
      </table>
    </div>

    <!-- 修正後完全版 -->
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">📝 修正後の完全版</h2>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;white-space:pre-wrap;font-size:14px;line-height:1.8;color:#374151;margin-bottom:28px">${escHtml(revisedArticle ?? '')}</div>

    <!-- 最終確認 -->
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">✅ 最終確認</h2>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;font-size:14px;color:#374151">
      <div><strong>読みやすさ:</strong> ${escHtml(finalCheck?.readability ?? '')}</div>
      <div style="margin-top:6px"><strong>SEOバランス:</strong> ${escHtml(finalCheck?.seoBalance ?? '')}</div>
    </div>

  </div>

  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
    このメールは校閲くんにより自動生成されました
  </div>
</div>
</body>
</html>`

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: `【校閲完了】${corrections.length}件の修正 | ${title}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Email send error:', e)
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 })
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
