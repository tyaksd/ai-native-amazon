# Feature Management Setup Guide

## 概要
ホームページのヒーローカルーセルに表示する特集を管理するシステムです。

## セットアップ手順

### 1. データベースセットアップ

Supabase SQL Editorで以下のSQLコードを実行してください：

```sql
-- Create features table for hero carousel management
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT '/explore',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_features_display_order ON features(display_order);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_features_is_active ON features(is_active);

-- Add RLS policies
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active features
CREATE POLICY "Allow public read access to active features"
  ON features
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all features
CREATE POLICY "Allow authenticated read access to all features"
  ON features
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert features
CREATE POLICY "Allow authenticated insert access to features"
  ON features
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update features
CREATE POLICY "Allow authenticated update access to features"
  ON features
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete features
CREATE POLICY "Allow authenticated delete access to features"
  ON features
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default sample data
INSERT INTO features (title, subtitle, image_url, link_url, display_order, is_active) VALUES
  ('ホリデーコレクション', 'メタリックパープルの限定パッケージが登場', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', '/explore', 1, true),
  ('タイムセール開催中！', 'MAX50%オフ！10月26日(日)26時まで', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80', '/explore', 2, true),
  ('Paul Smith、DUFFERなど', 'ラグジュアリーブランドがクーポン等の特別企画開催', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&q=80', '/brands', 3, true);
```

### 2. 環境変数の設定

`.env.local` ファイルに以下を追加してください：

```bash
# Admin password for feature management (production only)
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password_here
```

**注意**: 本番環境では必ず強力なパスワードに変更してください。

### 3. 管理画面へのアクセス

- **URL**: `https://yourdomain.com/feature`
- **開発環境**: パスワード不要（自動ログイン）
- **本番環境**: 管理者パスワードが必要

## 使い方

### 特集の作成

1. `/feature` ページにアクセス
2. 「新規作成」ボタンをクリック
3. 以下の情報を入力：
   - **タイトル**: 特集のメインタイトル
   - **説明文**: サブタイトルまたは説明
   - **画像**: 画像ファイルをアップロードまたはURLを入力
   - **リンクURL**: クリック時の遷移先（例: `/explore`, `/brands`）
   - **表示順**: 数値が小さいほど先に表示
   - **公開する**: チェックで公開、未チェックで非公開
4. 「作成」ボタンをクリック

### 特集の編集

1. 特集一覧から編集したい特集の「編集」ボタンをクリック
2. 内容を変更
3. 「更新」ボタンをクリック

### 特集の削除

1. 特集一覧から削除したい特集の「削除」ボタンをクリック
2. 確認ダイアログで「OK」をクリック

## API エンドポイント

### GET /api/features
全ての特集を取得

**クエリパラメータ**:
- `active_only=true`: 公開中の特集のみ取得

**レスポンス例**:
```json
[
  {
    "id": "uuid",
    "title": "タイムセール開催中！",
    "subtitle": "MAX50%オフ！10月26日(日)26時まで",
    "image_url": "https://...",
    "link_url": "/explore",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-26T00:00:00Z",
    "updated_at": "2025-10-26T00:00:00Z"
  }
]
```

### POST /api/features
新しい特集を作成

**リクエストボディ**:
```json
{
  "title": "新しい特集",
  "subtitle": "説明文",
  "image_url": "https://...",
  "link_url": "/explore",
  "display_order": 1,
  "is_active": true
}
```

### PUT /api/features
特集を更新

**リクエストボディ**:
```json
{
  "id": "uuid",
  "title": "更新後のタイトル",
  "is_active": false
}
```

### DELETE /api/features?id=uuid
特集を削除

## データベーススキーマ

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| title | TEXT | タイトル |
| subtitle | TEXT | サブタイトル・説明文 |
| image_url | TEXT | 画像URL |
| link_url | TEXT | リンク先URL |
| display_order | INTEGER | 表示順序 |
| is_active | BOOLEAN | 公開/非公開 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

## トラブルシューティング

### 画像が表示されない
- 画像URLが正しいか確認
- Cloudinaryにアップロードした画像を使用する場合は、CLOUDINARY環境変数が設定されているか確認

### 管理画面にアクセスできない
- 本番環境の場合、`NEXT_PUBLIC_ADMIN_PASSWORD` が設定されているか確認
- sessionStorageをクリアしてから再度ログイン

### 特集が表示されない
- `is_active` が `true` になっているか確認
- データベースにデータが存在するか確認
- ブラウザのコンソールでエラーが出ていないか確認

## セキュリティ

- 本番環境では必ず強力なパスワードを使用
- RLS（Row Level Security）ポリシーが有効になっているため、認証されたユーザーのみがデータを変更可能
- 画像アップロードはCloudinaryを使用し、セキュアに管理

## 推奨画像サイズ

- **幅**: 1400px
- **高さ**: 400px
- **アスペクト比**: 7:2
- **フォーマット**: JPG, PNG, WebP
- **サイズ**: 500KB以下推奨

