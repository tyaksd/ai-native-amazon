# Printful Integration Documentation

## 概要

このドキュメントでは、Stripe決済完了WebhookからPrintful APIへの自動発注フローの実装について説明します。

## 実装内容

### 1. Printful APIクライアント (`lib/printful.ts`)

- **PrintfulClient**: Printful APIとの通信を行うクライアントクラス
- **商品管理**: 商品の取得、バリアントの検索
- **ファイルアップロード**: デザインPNGファイルのアップロード
- **注文作成**: Printfulへの注文作成

### 2. 商品マッピング

商品の性別に応じて適切なTシャツモデルを選択：

- **Unisex/Men**: Unisex Basic Softstyle T-Shirt | Gildan 64000
- **Women**: Women's Relaxed T-Shirt | Bella + Canvas 6400

### 3. Stripe Webhook統合 (`app/api/stripe-webhook/route.ts`)

決済完了時に以下の処理を実行：

1. **注文データの保存**: Supabaseに注文情報を保存
2. **Printful発注**: 商品情報とデザインPNGをPrintfulに送信
3. **確認メール**: 顧客に注文確認メールを送信

### 4. データベーススキーマ

#### 必要なマイグレーション

```sql
-- ordersテーブルにPrintful関連フィールドを追加
ALTER TABLE orders 
ADD COLUMN printful_order_id VARCHAR(50),
ADD COLUMN printful_external_id VARCHAR(100);
```

#### 商品テーブルの要件

- `gender`: 商品の性別 (Men, Women, Unisex)
- `design_png`: デザインPNGファイルのURL配列
- `colors`: 利用可能なカラー
- `sizes`: 利用可能なサイズ

## 環境変数

```env
# Printful API設定
PRINTFUL_API_KEY=your_printful_api_key
```

## 使用方法

### 1. 環境設定

1. Printfulアカウントを作成
2. APIキーを取得
3. 環境変数に設定

### 2. データベースマイグレーション

```bash
# Supabaseマイグレーションを実行
supabase db push
```

### 3. テスト

```bash
# Printful API接続テスト
curl http://localhost:3000/api/printful-test
```

## フロー詳細

### 1. 決済完了時

1. **Stripe Webhook受信**: `checkout.session.completed`イベント
2. **注文データ抽出**: 商品、数量、配送先、顧客情報
3. **データベース保存**: 注文と注文アイテムをSupabaseに保存

### 2. Printful発注処理

1. **商品情報取得**: データベースから商品詳細を取得
2. **性別判定**: 商品の性別に基づいてTシャツモデルを選択
3. **デザインアップロード**: デザインPNGファイルをPrintfulにアップロード
4. **バリアント検索**: サイズとカラーに一致するバリアントを検索
5. **注文作成**: Printful APIで注文を作成

### 3. エラーハンドリング

- Printful APIエラーはログに記録
- Webhook処理は継続（注文は正常に保存される）
- 手動での再処理が可能

## 注意事項

### 1. 商品ID

- 現在はハードコードされた商品IDを使用
- 実際のPrintful商品IDに更新が必要
- `findTshirtProduct`関数で動的検索も可能

### 2. デザインファイル

- デザインPNGファイルは公開URLである必要がある
- CloudinaryなどのCDNを使用することを推奨

### 3. 配送先住所

- Stripeから取得した配送先住所をそのまま使用
- 国コードの形式に注意

## トラブルシューティング

### 1. Printful APIエラー

```bash
# ログを確認
tail -f logs/webhook.log
```

### 2. 商品が見つからない

```bash
# Printful商品一覧を確認
curl http://localhost:3000/api/printful-test
```

### 3. デザインファイルのアップロードエラー

- ファイルURLが有効か確認
- ファイルサイズと形式を確認
- Printful APIキーの権限を確認

## 今後の改善点

1. **商品IDの動的取得**: ハードコードされたIDを削除
2. **エラー通知**: Printful APIエラー時の管理者通知
3. **注文ステータス同期**: Printfulの注文ステータスをデータベースに反映
4. **バッチ処理**: 大量注文時の効率化
5. **テスト環境**: 本番環境でのテスト注文防止

## 関連ファイル

- `lib/printful.ts`: Printful APIクライアント
- `app/api/stripe-webhook/route.ts`: Stripe Webhook処理
- `app/api/printful-test/route.ts`: Printful APIテスト
- `supabase/migrations/028_add_printful_fields.sql`: データベースマイグレーション
