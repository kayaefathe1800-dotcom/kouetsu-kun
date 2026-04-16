'use client'
import { useState } from 'react'
import type { ProofreadData } from './ProofreadResult'

interface Props {
  isOpen: boolean
  onClose: () => void
  data: ProofreadData
  title: string
}

export default function EmailModal({ isOpen, onClose, data, title }: Props) {
  const [emails, setEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSend = async () => {
    const recipients = emails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(Boolean)

    if (!recipients.length) {
      setError('送信先メールアドレスを入力してください')
      return
    }

    setSending(true)
    setError('')

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients,
        title,
        corrections: data.corrections,
        revisedArticle: data.revisedArticle,
        titleSuggestions: data.titleSuggestions,
        finalCheck: data.finalCheck,
      }),
    })

    setSending(false)

    if (res.ok) {
      setSent(true)
    } else {
      const j = await res.json()
      setError(j.error ?? 'メール送信に失敗しました')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">送信しました</h3>
            <p className="text-sm text-gray-500">校閲レポートをメールで送信しました</p>
            <button onClick={onClose} className="btn-primary mt-6">閉じる</button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">メールで送信</h3>
            <p className="text-sm text-gray-500 mb-5">校閲レポートを指定のメールアドレスに送信します</p>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              送信先メールアドレス
            </label>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              placeholder="example@gmail.com&#10;another@example.com&#10;（複数の場合は改行またはカンマ区切り）"
              rows={4}
              className="input-base resize-none"
            />

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="btn-secondary flex-1">キャンセル</button>
              <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 justify-center">
                {sending ? <div className="spinner" /> : '送信する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
