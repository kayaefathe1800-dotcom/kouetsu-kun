# 校閲くん セットアップガイド

## 必要なもの（すべて無料）

| サービス | 用途 | 無料枠 |
|---------|------|--------|
| [Google AI Studio](https://aistudio.google.com/) | Gemini API（AI校閲） | 1500回/日 |
| [Vercel](https://vercel.com/) | アプリのホスティング | 無料 |
| [GitHub](https://github.com/) | コードの管理 | 無料 |
| [Resend](https://resend.com/) | メール送信 | 100通/日（メール機能を使う場合のみ） |

---

## Step 1: Gemini APIキーを取得

1. https://aistudio.google.com/ にアクセス（Googleアカウントでログイン）
2. 左メニュー「Get API key」→「Create API key」
3. 表示されたキーをコピーして保管

---

## Step 2: GitHubにコードをアップロード

1. https://github.com/ でアカウント作成（または既存アカウントでログイン）
2. 「New repository」→ リポジトリ名を入力（例：`proofreading-app`）→「Create repository」
3. このフォルダをGitHubにプッシュ:

```bash
cd proofreading-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのユーザー名/proofreading-app.git
git push -u origin main
```

---

## Step 3: Vercelにデプロイ

1. https://vercel.com/ でアカウント作成（GitHubでログイン推奨）
2. 「New Project」→ GitHubリポジトリ「proofreading-app」を選択
3. 「Environment Variables（環境変数）」に以下を追加:

| キー | 値 |
|------|-----|
| `GEMINI_API_KEY` | Step1で取得したキー |
| `RESEND_API_KEY` | Resendのキー（メール機能を使う場合のみ） |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス（例: noreply@yourdomain.com） |

4. 「Deploy」をクリック
5. 数分でデプロイ完了 → URLが発行されます

---

## Step 4: メール送信設定（任意）

メールで送信機能を使う場合:

1. https://resend.com/ でアカウント作成
2. 「API Keys」→「Create API Key」→ キーをコピー
3. 独自ドメインを所有している場合は「Domains」でドメインを追加
4. Vercelの環境変数に `RESEND_API_KEY` と `RESEND_FROM_EMAIL` を追加

---

## 使い方

1. アプリのURLにアクセス
2. ブログ記事をテキストで貼り付け、またはWordPressのURLを入力
3. キーワードや目標文字数を入力（任意）
4. 「校閲する」ボタンをクリック
5. 結果が表示されたら:
   - 「訂正一覧」タブ: 修正箇所を確認
   - 「タイトル案」タブ: 改善されたタイトル3案を確認
   - 「修正後全文」タブ: 完成版記事をコピー
   - 「CSVダウンロード」: Googleスプレッドシートに貼り付け可能
   - 「メールで送信」: 複数人にレポートを送信

---

## よくある質問

**Q: 記事が長すぎてエラーが出る**
A: 8000文字を超える場合は前半・後半に分けて校閲してください

**Q: URLから記事を取得できない**
A: WordPressのREST APIが無効になっている場合があります。テキスト貼り付けモードをご利用ください

**Q: メールが届かない**
A: Resendの無料プランではドメイン認証が必要な場合があります。Resendダッシュボードでドメインを設定してください
