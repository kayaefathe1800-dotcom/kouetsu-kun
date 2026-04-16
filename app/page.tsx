'use client'
import { useState, useEffect } from 'react'
import ProofreadResult, { type ProofreadData } from '@/components/ProofreadResult'
import EmailModal from '@/components/EmailModal'
import RulesEditor from '@/components/RulesEditor'
import { DEFAULT_RULES } from '@/lib/rules'

type InputMode = 'text' | 'url'

const RULES_STORAGE_KEY = 'kouetsu_custom_rules'

export default function Home() {
  const [mode, setMode] = useState<InputMode>('text')
  const [articleText, setArticleText] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [keywords, setKeywords] = useState('')
  const [charCount, setCharCount] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [result, setResult] = useState<ProofreadData | null>(null)
  const [error, setError] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [customRules, setCustomRules] = useState<string>(DEFAULT_RULES)
  const [rulesModified, setRulesModified] = useState(false)

  // ローカルストレージからルールを読み込み
  useEffect(() => {
    const saved = localStorage.getItem(RULES_STORAGE_KEY)
    if (saved) {
      setCustomRules(saved)
      setRulesModified(saved !== DEFAULT_RULES)
    }
  }, [])

  const handleSaveRules = (rules: string) => {
    setCustomRules(rules)
    localStorage.setItem(RULES_STORAGE_KEY, rules)
    setRulesModified(rules !== DEFAULT_RULES)
    setRulesOpen(false)
  }

  const fetchFromUrl = async () => {
    if (!articleUrl.trim()) return
    setFetching(true)
    setError('')
    const res = await fetch('/api/fetch-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: articleUrl }),
    })
    setFetching(false)
    if (res.ok) {
      const data = await res.json()
      setArticleText(data.content)
      setTitle(data.title)
    } else {
      const d = await res.json()
      setError(d.error ?? '記事の取得に失敗しました')
    }
  }

  const handleProofread = async () => {
    const text = articleText.trim()
    if (!text) {
      setError('記事本文を入力してください')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/proofread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: text, keywords, charCount, customRules }),
    })

    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      setResult(data)
      if (!title && data.titleSuggestions?.[0]) {
        setTitle(articleText.split('\n')[0].substring(0, 40) || '記事')
      }
    } else {
      const d = await res.json()
      setError(d.error ?? '校閲に失敗しました')
    }
  }

  const charLen = articleText.length

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">校閲くん</span>
            <span className="hidden sm:inline text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
              ペイントホームズ専用
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRulesOpen(true)}
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              校閲ルール編集
              {rulesModified && (
                <span className="w-2 h-2 bg-amber-400 rounded-full" title="カスタムルール適用中" />
              )}
            </button>
            {result && (
              <button
                onClick={() => setEmailOpen(true)}
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                メールで送信
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ヒーロー */}
        {!result && (
          <div className="text-center py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              AIブログ校閲ツール
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              店舗ブログの校閲ルールに基づいて、記事を自動チェック・修正します
            </p>
          </div>
        )}

        {/* 入力フォーム */}
        <div className="card p-6 space-y-5">
          {/* モード切替 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {(['text', 'url'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'text' ? '✏️ テキスト入力' : '🔗 URLから取得'}
              </button>
            ))}
          </div>

          {/* URL入力 */}
          {mode === 'url' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={articleUrl}
                onChange={e => setArticleUrl(e.target.value)}
                placeholder="https://painthomes-osakakita.com/blog/..."
                className="input-base"
                onKeyDown={e => e.key === 'Enter' && fetchFromUrl()}
              />
              <button
                onClick={fetchFromUrl}
                disabled={fetching || !articleUrl.trim()}
                className="btn-primary flex-shrink-0"
              >
                {fetching ? <div className="spinner" /> : '取得'}
              </button>
            </div>
          )}

          {/* 記事テキスト */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                記事本文 <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${charLen > 0 ? 'text-brand-600' : 'text-gray-400'}`}>
                {charLen.toLocaleString()}文字
              </span>
            </div>
            <textarea
              value={articleText}
              onChange={e => setArticleText(e.target.value)}
              placeholder="ブログ記事の本文をここに貼り付けてください..."
              rows={10}
              className="input-base resize-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* タイトル（オプション） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              記事タイトル <span className="text-gray-400 font-normal">（任意）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：外壁塗装の費用について大阪でお考えの方へ"
              className="input-base"
            />
          </div>

          {/* オプション行 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                狙っているキーワード <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="例：外壁塗装 大阪 費用"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                目標文字数 <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={charCount}
                onChange={e => setCharCount(e.target.value)}
                placeholder="例：1500字前後"
                className="input-base"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleProofread}
            disabled={loading || !articleText.trim()}
            className="btn-primary w-full justify-center py-3.5 text-base"
          >
            {loading ? (
              <>
                <div className="spinner" />
                AIが校閲中です...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                校閲する
              </>
            )}
          </button>
        </div>

        {/* ローディング状態 */}
        {loading && (
          <div className="card p-8 text-center animate-fadeInUp">
            <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 font-medium">ペイントホームズ校閲ルールに基づいて解析中...</p>
            <p className="text-gray-400 text-sm mt-1">30秒〜1分ほどかかります</p>
          </div>
        )}

        {/* 結果 */}
        {result && !loading && (
          <ProofreadResult data={result} title={title || '記事'} />
        )}
      </main>

      {/* フッター */}
      <footer className="mt-16 py-8 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          校閲くん — ペイントホームズ専用 AIブログ校閲ツール
        </p>
      </footer>

      {/* ルール編集モーダル */}
      <RulesEditor
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onSave={handleSaveRules}
        currentRules={customRules}
      />

      {/* メールモーダル */}
      {result && (
        <EmailModal
          isOpen={emailOpen}
          onClose={() => setEmailOpen(false)}
          data={result}
          title={title || '記事'}
        />
      )}
    </div>
  )
}
