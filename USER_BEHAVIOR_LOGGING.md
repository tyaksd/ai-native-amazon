# ユーザー行動ログシステム

このシステムは、ホームページに訪れたユーザーの詳細な行動を学習するための包括的なログシステムです。

## 機能概要

### 1. 自動追跡される行動
- **ページビュー**: ページ訪問、滞在時間、スクロール深度
- **クリックイベント**: ボタン、リンク、商品のクリック
- **検索行動**: 検索クエリ、フィルター使用
- **商品インタラクション**: 商品表示、お気に入り追加
- **ナビゲーション**: ページ遷移、戻る/進む
- **エラー**: JavaScript エラー、API エラー
- **パフォーマンス**: ページ読み込み時間、Core Web Vitals

### 2. データベーステーブル

#### `user_sessions`
ユーザーセッション情報を保存
- セッションID、ユーザーエージェント、IPアドレス
- UTMパラメータ、デバイス情報、ブラウザ情報
- セッション開始・終了時間

#### `page_views`
ページビュー情報を保存
- ページURL、タイトル、パス
- ビューポートサイズ、スクロール深度
- 滞在時間

#### `user_interactions`
ユーザーインタラクションを保存
- クリック、ホバー、スクロール、フォーカス
- 要素の種類、ID、クラス、テキスト
- クリック位置

#### `search_behavior`
検索行動を保存
- 検索クエリ、検索タイプ
- 適用されたフィルター
- 検索結果数、クリックされた結果

#### `product_interactions`
商品インタラクションを保存
- 商品ID、ブランドID
- インタラクションタイプ（表示、クリック、お気に入り等）
- 商品情報、価格、カテゴリ
- リスト内の位置

#### `navigation_behavior`
ナビゲーション行動を保存
- 遷移元・先ページ
- ナビゲーションタイプ（直接、戻る、進む等）
- ページ間の時間

#### `error_logs`
エラー情報を保存
- エラータイプ、メッセージ、スタックトレース
- 発生ページ、ブラウザ情報

#### `performance_metrics`
パフォーマンス指標を保存
- ページ読み込み時間
- Core Web Vitals
- ネットワーク情報

## 使用方法

### 1. 基本的な初期化
```typescript
import analytics from '@/lib/analytics'

// ページ読み込み時に自動初期化
useEffect(() => {
  analytics.initialize()
}, [])
```

### 2. 手動での追跡

#### 検索行動の追跡
```typescript
// 検索実行時
analytics.trackSearch(
  '検索クエリ',
  'product', // 検索タイプ
  { category: 'T-Shirts' }, // フィルター
  25 // 結果数
)

// 検索結果クリック時
analytics.trackSearchResultClick(
  'product-id',
  'product',
  '検索クエリ'
)
```

#### 商品インタラクションの追跡
```typescript
// 商品クリック時
analytics.trackProductInteraction(
  'product-id',
  'click',
  {
    brandId: 'brand-id',
    productName: '商品名',
    productPrice: 29.99,
    productCategory: 'T-Shirts',
    positionInList: 1
  }
)

// お気に入り追加時
analytics.trackProductInteraction(
  'product-id',
  'favorite',
  { brandId: 'brand-id' }
)
```

#### ナビゲーションの追跡
```typescript
// ページ遷移時
analytics.trackPageNavigation(
  '/new-page',
  'link_click'
)
```

### 3. データの分析

#### セッション統計の取得
```sql
SELECT * FROM get_session_stats('session-id');
```

#### 人気商品の分析
```sql
SELECT 
  product_id,
  product_name,
  COUNT(*) as view_count,
  AVG(time_on_product) as avg_time
FROM product_interactions 
WHERE interaction_type = 'view'
GROUP BY product_id, product_name
ORDER BY view_count DESC;
```

#### 検索行動の分析
```sql
SELECT 
  search_query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  COUNT(CASE WHEN clicked_result_id IS NOT NULL THEN 1 END) as click_count
FROM search_behavior
GROUP BY search_query
ORDER BY search_count DESC;
```

#### ユーザージャーニーの分析
```sql
SELECT 
  pv.page_path,
  pv.time_on_page,
  pv.scroll_depth,
  COUNT(ui.id) as interaction_count
FROM page_views pv
LEFT JOIN user_interactions ui ON pv.session_id = ui.session_id
WHERE pv.session_id = 'session-id'
GROUP BY pv.id, pv.page_path, pv.time_on_page, pv.scroll_depth
ORDER BY pv.created_at;
```

## 設定とカスタマイズ

### 1. 追跡するイベントのカスタマイズ
`lib/analytics.ts`の`setupEventListeners()`メソッドを編集して、追跡するイベントを追加・削除できます。

### 2. データの保持期間
デフォルトでは30日間のデータを保持します。`cleanup_old_sessions()`関数を編集して変更できます。

### 3. プライバシー設定
ユーザーのプライバシーを保護するため、以下の設定を確認してください：
- IPアドレスの匿名化
- 個人情報の除外
- データの暗号化

## パフォーマンス考慮事項

### 1. バッチ送信
大量のイベントを効率的に送信するため、バッチ送信機能を実装することを推奨します。

### 2. エラーハンドリング
ネットワークエラーやAPIエラーに対して適切なフォールバック機能を実装しています。

### 3. データベース最適化
適切なインデックスを設定して、クエリパフォーマンスを最適化しています。

## セキュリティ

### 1. データ検証
すべての入力データは適切に検証・サニタイズされます。

### 2. レート制限
APIエンドポイントにレート制限を実装することを推奨します。

### 3. アクセス制御
ログデータへのアクセスは適切に制限してください。

## トラブルシューティング

### 1. ログが記録されない場合
- ブラウザのコンソールでエラーを確認
- ネットワークタブでAPIリクエストを確認
- データベース接続を確認

### 2. パフォーマンスの問題
- データベースのインデックスを確認
- 不要なイベントの追跡を停止
- バッチ送信の実装を検討

## 今後の拡張

### 1. 機械学習統合
収集されたデータを機械学習アルゴリズムで分析し、ユーザー行動の予測やパーソナライゼーションに活用できます。

### 2. リアルタイム分析
WebSocketを使用してリアルタイムでのユーザー行動分析を実装できます。

### 3. A/Bテスト統合
ユーザー行動データをA/Bテストの結果分析に活用できます。
