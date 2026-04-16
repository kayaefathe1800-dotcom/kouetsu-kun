import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '校閲くん — AIブログ校閲ツール',
  description: 'WordPressのブログ記事をAIが自動校閲。誤字脱字・表現の改善点をスプレッドシート形式で確認できます。',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
