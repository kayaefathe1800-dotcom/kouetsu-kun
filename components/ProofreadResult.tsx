'use client'
import { useState } from 'react'
import CategoryBadge from './CategoryBadge'

export interface Correction {
  original: string
  corrected: string
  reason: string
  category: string
}

export interface ProofreadData {
  corrections: Correction[]
  titleSuggestions: string[]
  revisedArticle: string
  finalCheck: {
    readability: string
    seoBalance: string
    overallComment: string
  }
  summary: {
    totalIssues: number
    criticalIssues: number
    issuesByCategory: Record<string, number>
  }
}

interface Props {
  data: ProofreadData
  title: string
}

type Tab = 'corrections' | 'titles' | 'revised' | 'check'

export default function ProofreadResult({ data, title }: Props) {
  const [tab, setTab] = useState<Tab>('corrections')
  const [copied, setCopied] = useState(false)

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'corrections', label: '訂正一覧', count: data.corrections.length },
    { id: 'titles', label: 'タイトル案', count: data.titleSuggestions.length },
    { id: 'revised', label: '修正後全文' },
    { id: 'check', label: '最終確認' },
  ]

  const handleCopyRevised = async () => {
    await navigator.clipboard.writeText(data.revisedArticle)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCSV = () => {
    const header = '元の文章,訂正後,訂正理由,カテゴリ\n'
    const rows = data.corrections
      .map(c =>
        [c.original, c.corrected, c.reason, c.category]
          .map(v => `"${v.replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `校閲_${title.substring(0, 20)}.csv`
    a.click()
  }

  const categoryEntries = Object.entries(data.summary?.issuesByCategory ?? {}).filter(
    ([, v]) => v > 0
  )

  return (
    <div className="animate-fadeInUp space-y-6">
      {/* サマリーカード */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">校閲サマリー</h2>
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="text-4xl font-bold text-brand-600">{data.corrections.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">件の修正</div>
          </div>
          {categoryEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {categoryEntries.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <CategoryBadge category={cat} />
                  <span className="text-xs font-semibold text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {data.finalCheck?.overallComment && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
            {data.finalCheck.overallComment}
          </p>
        )}
      </div>

      {/* タブナビ */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === t.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* 訂正一覧 */}
          {tab === 'corrections' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  {data.corrections.length === 0
                    ? '訂正箇所はありませんでした'
                    : `${data.corrections.length}件の訂正箇所が見つかりました`}
                </p>
                {data.corrections.length > 0 && (
                  <button onClick={handleDownloadCSV} className="btn-secondary text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    CSVダウンロード
                  </button>
                )}
              </div>

              {data.corrections.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 font-semibold text-gray-600 w-[30%]">元の文章</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 w-[30%]">訂正後</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">訂正理由</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 w-[100px]">カテゴリ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.corrections.map((c, i) => (
                        <tr
                          key={i}
                          className={`border-t border-gray-50 ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-700 align-top leading-relaxed">
                            <span className="line-through text-gray-400">{c.original}</span>
                          </td>
                          <td className="px-4 py-3 text-brand-700 font-medium align-top leading-relaxed">
                            {c.corrected}
                          </td>
                          <td className="px-4 py-3 text-gray-500 align-top leading-relaxed text-xs">
                            {c.reason}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <CategoryBadge category={c.category} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* タイトル案 */}
          {tab === 'titles' && (
            <div className="space-y-3">
              {data.titleSuggestions.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-gray-800 font-medium leading-relaxed pt-0.5">{t}</p>
                </div>
              ))}
            </div>
          )}

          {/* 修正後全文 */}
          {tab === 'revised' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={handleCopyRevised} className="btn-secondary text-sm">
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      コピーしました
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      全文コピー
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 text-sm leading-loose text-gray-700 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {data.revisedArticle}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">
                {data.revisedArticle?.length ?? 0}文字
              </p>
            </div>
          )}

          {/* 最終確認 */}
          {tab === 'check' && (
            <div className="space-y-4">
              {[
                { label: '一般読者への伝わりやすさ', value: data.finalCheck?.readability },
                { label: 'SEO・読みやすさバランス', value: data.finalCheck?.seoBalance },
                { label: '総合コメント', value: data.finalCheck?.overallComment },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {label}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
