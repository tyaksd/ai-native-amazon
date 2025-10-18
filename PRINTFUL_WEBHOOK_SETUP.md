# Printful Webhook Setup Guide

## 概要

PrintfulのWebhookを使用して、注文状態の変更をリアルタイムでデータベースに反映する設定方法を説明します。

## 必要な環境変数

### 1. Printful API Key
```env
PRINTFUL_API_KEY=your_printful_api_key_here
```

### 2. Printful Webhook Secret
```env
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret_here
```

## Printful側の設定

### 1. Webhook URLの設定
Printfulのダッシュボードで以下のURLを設定：
```
https://your-domain.com/api/printful-webhook
```

### 2. 有効化するWebhookイベント
以下のイベントを有効化してください：

- ✅ **Order Updated** - 注文が更新された時
- ✅ **Order Failed** - 注文が失敗した時
- ✅ **Order Fulfilled** - 注文が履行された時
- ✅ **Order Shipped** - 注文が配送された時
- ✅ **Order Returned** - 注文が返品された時

### 3. Webhook Secretの設定
PrintfulのWebhook設定で、セキュリティのためのシークレットキーを設定してください。

## 動作フロー

### 1. 注文作成時
1. 手動でPrintfulに注文を作成
2. `external_id`として`order_items.id`を使用
3. 注文が作成されると、PrintfulからWebhookが送信される

### 2. 状態変更時
1. Printfulで注文状態が変更される
2. PrintfulからWebhookが送信される
3. アプリケーションがWebhookを受信
4. データベースの`order_items`テーブルを更新
5. `/user`ページで最新状態が表示される

## 対応するWebhookイベント

| イベント | 説明 | データベース更新 |
|---------|------|-----------------|
| `order_updated` | 注文が更新された | ステータス、履行状況を更新 |
| `order_failed` | 注文が失敗した | エラーメッセージを記録 |
| `order_fulfilled` | 注文が履行された | ステータスを`fulfilled`に更新 |
| `order_shipped` | 注文が配送された | 追跡番号、配送状況を更新 |
| `order_returned` | 注文が返品された | 返品状況を記録 |

## セキュリティ

- Webhookの署名検証により、正当なPrintfulからのリクエストのみを処理
- 環境変数でWebhookシークレットを管理
- エラーハンドリングにより、不正なリクエストを拒否

## テスト方法

### 1. Webhook URLのテスト
```bash
curl -X POST https://your-domain.com/api/printful-webhook \
  -H "Content-Type: application/json" \
  -H "x-printful-signature: your_signature" \
  -d '{"type": "order_updated", "data": {"external_id": "test-id", "status": "inprocess"}}'
```

### 2. ログの確認
Webhookの処理状況は、アプリケーションのログで確認できます。

## トラブルシューティング

### 1. Webhookが受信されない
- PrintfulのWebhook URLが正しく設定されているか確認
- 環境変数`PRINTFUL_WEBHOOK_SECRET`が設定されているか確認

### 2. 署名検証エラー
- `PRINTFUL_WEBHOOK_SECRET`がPrintfulの設定と一致しているか確認

### 3. データベース更新エラー
- `order_items`テーブルの`id`と`external_id`が一致しているか確認
- Supabaseの接続設定を確認
