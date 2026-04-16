'use client'
import { useState, useEffect } from 'react'
import { DEFAULT_RULES } from '@/lib/rules'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (rules: string) => void
  currentRules: string
}

export default function RulesEditor({ isOpen, onClose, onSave, currentRules }: Props) {
  const [draft, setDraft] = useState(currentRules)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) setDraft(currentRules)
  }, [isOpen, currentRules])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1000)
  }

  const handleReset = () => {
    if (confirm('校閲ルールをデフォルトに戻しますか？')) {
      setDraft(DEFAULT_RULES)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col animate-fadeInUp"
           style={{ maxHeight: '90vh' }}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">校閲ルールの編集</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ルールはブラウザに保存され、次回以降も引き継がれます
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ルールカテゴリ説明 */}
        <div className="px-6 py-3 bg-brand-50 border-b border-brand-100 flex-shrink-0">
          <p className="text-xs text-brand-700 leading-relaxed">
            💡 <strong>編集のヒント：</strong>
            箇条書き（・）で記載。「費用表現」「誇張表現」「断定表現」などのカテゴリ見出しを【】で囲むとAIが分類しやすくなります。
          </p>
        </div>

        {/* テキストエリア */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full h-full input-base resize-none font-mono text-xs leading-relaxed"
            style={{ minHeight: '400px' }}
            placeholder="校閲ルールを入力してください..."
          />
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            デフォルトに戻す
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">キャンセル</button>
            <button onClick={handleSave} className="btn-primary">
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存しました
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
