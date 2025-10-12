# 環境変数設定ガイド

## 必要な環境変数

`.env.local`ファイルに以下の環境変数を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 環境変数の取得方法

### 1. Supabaseダッシュボードにアクセス
- [Supabase Dashboard](https://supabase.com/dashboard) にログイン

### 2. プロジェクトを選択
- 対象のプロジェクトを選択

### 3. 設定 > API に移動
- 左サイドバーの「Settings」→「API」をクリック

### 4. 必要なキーをコピー
- **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`に設定
- **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`に設定
- **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY`に設定

## 設定例

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjQ2NDAwMCwiZXhwIjoxOTYyMDQwMDAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2NDY0MDAwLCJleHAiOjE5NjIwNDAwMDB9.example
```

## トラブルシューティング

### エラー: "Export supabase doesn't exist in target module"
- 環境変数が正しく設定されているか確認
- `.env.local`ファイルがプロジェクトルートにあるか確認
- 開発サーバーを再起動

### エラー: "Invalid API key"
- Supabaseダッシュボードで正しいキーをコピーしているか確認
- キーに余分なスペースや文字が含まれていないか確認

### エラー: "Database connection failed"
- Supabaseプロジェクトがアクティブか確認
- データベースマイグレーションが実行されているか確認
- RLSポリシーが正しく設定されているか確認

## セキュリティ注意事項

- `.env.local`ファイルはGitにコミットしないでください
- 本番環境では適切な環境変数管理システムを使用してください
- `SUPABASE_SERVICE_ROLE_KEY`は特に機密情報なので厳重に管理してください

