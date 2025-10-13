# Vercel Deployment Guide for X Auto Poster

## 🚀 デプロイ手順

### 1. 前提条件
- Vercel CLIがインストールされていること
- X API認証情報が準備されていること

### 2. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```bash
# X API認証情報
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
X_BEARER_TOKEN=your_bearer_token_here

# Cron認証
CRON_SECRET=your_cron_secret_here

# 投稿設定
POST_INTERVAL_MINUTES=120
MAX_POSTS_PER_DAY=15
POST_START_HOUR=0
POST_END_HOUR=23
LOG_LEVEL=INFO
```

### 3. デプロイ実行

```bash
# デプロイスクリプトを実行
./deploy-vercel.sh
```

または手動で：

```bash
# Vercelにログイン
vercel login

# プロジェクトを初期化（初回のみ）
vercel

# 本番環境にデプロイ
vercel --prod
```

### 4. Cron設定

Vercelダッシュボードで以下のcron設定を追加：

- **Path**: `/api/cron/x-auto-poster`
- **Schedule**: `0 */2 * * *` (2時間おき)
- **Timezone**: `UTC`

### 5. 動作確認

デプロイ後、以下のエンドポイントで動作確認：

- **手動実行**: `POST https://your-domain.vercel.app/api/x-auto-poster`
- **Cron実行**: 自動的に2時間おきに実行

### 6. ログ確認

Vercelダッシュボードの「Functions」タブでログを確認できます。

## 📊 投稿スケジュール

### X (Twitter)
- **投稿頻度**: 2時間おき（1日12回）
- **投稿時間**: 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00, 00:00, 02:00, 04:00
- **投稿内容**: ランダムなブランドの商品画像と背景画像

### Instagram
- **投稿頻度**: 8時間おき（1日3回）
- **投稿時間**: 08:00, 16:00, 00:00
- **投稿内容**: ランダムなブランドの背景画像（単一画像）
- **ハッシュタグ**: Instagram用に最適化されたハッシュタグ

## 🔧 トラブルシューティング

### よくある問題

1. **環境変数が設定されていない**
   - Vercelダッシュボードで環境変数を確認

2. **Cronが動作しない**
   - Vercelダッシュボードでcron設定を確認
   - CRON_SECRETが正しく設定されているか確認

3. **投稿が失敗する**
   - X API認証情報が正しいか確認
   - ログを確認してエラー内容を特定

### ログの確認方法

```bash
# Vercel CLIでログを確認
vercel logs

# 特定の関数のログを確認
vercel logs --function=api/cron/x-auto-poster
```

## 📝 注意事項

### X (Twitter)
- 投稿制限: 1日15件まで
- 時間制限: 24時間いつでも投稿可能
- 投稿間隔: 2時間（120分）
- 画像: 1枚目は商品画像、2枚目は背景画像

### Instagram
- 投稿制限: 1日3件まで
- 時間制限: 24時間いつでも投稿可能
- 投稿間隔: 8時間（480分）
- 画像: 背景画像（単一画像）
- ハッシュタグ: Instagram用に最適化
