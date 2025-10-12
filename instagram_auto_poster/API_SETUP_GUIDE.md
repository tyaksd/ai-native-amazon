# Instagram API キー取得ガイド

## 1. instagrapiライブラリ（推奨：簡単）

### 必要な情報
- Instagramユーザー名
- Instagramパスワード
- 2要素認証コード（有効な場合）

### 設定方法
```env
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password
TWO_FACTOR_CODE=123456  # 2FAが有効な場合のみ
```

**メリット:**
- 外部APIキー不要
- 個人アカウントでも使用可能
- 設定が簡単

**デメリット:**
- 非公式ライブラリ
- Instagramの仕様変更で動作しなくなる可能性

## 2. Instagram Graph API（公式API）

### 必要なキー
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_ACCOUNT_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

### 取得手順

#### ステップ1: Facebook開発者アカウント作成
1. [Facebook Developers](https://developers.facebook.com/)にアクセス
2. 「開発者になる」をクリック
3. 必要事項を入力してアカウント作成

#### ステップ2: アプリの作成
1. 「アプリを作成」をクリック
2. アプリ名を入力（例：My Instagram Bot）
3. 連絡先メールアドレスを入力
4. アプリの目的を選択

#### ステップ3: Instagram Basic Display APIの設定
1. アプリダッシュボードで「Instagram Basic Display」を追加
2. 「Instagram Basic Display」をクリック
3. 「基本設定」で「Instagram App ID」をコピー（これが`FACEBOOK_APP_ID`）
4. 「Instagram App Secret」をコピー（これが`FACEBOOK_APP_SECRET`）

#### ステップ4: Instagramアカウントの接続
1. Instagramアカウントをビジネスアカウントに変更
2. FacebookページとInstagramアカウントを連携
3. Instagram Basic Display APIでアカウントを接続
4. アクセストークンを取得（これが`INSTAGRAM_ACCESS_TOKEN`）

#### ステップ5: Instagram Graph APIの設定
1. 「Instagram Graph API」を追加
2. ビジネスアカウントに接続
3. 必要な権限をリクエスト：
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`

#### ステップ6: アカウントIDの取得
1. Graph API Explorerで以下を実行：
   ```
   GET /me/accounts
   ```
2. レスポンスからInstagramアカウントのIDを取得（これが`INSTAGRAM_ACCOUNT_ID`）

### 設定ファイル例
```env
# Facebook/Instagram Graph API設定
INSTAGRAM_ACCESS_TOKEN=EAABwzLixnjYBO...
INSTAGRAM_ACCOUNT_ID=17841400000000000
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890

# 投稿設定
DEFAULT_CAPTION=#自動投稿 #Python
DEFAULT_HASHTAGS=#Python #自動化 #Instagram

# スケジュール設定
POST_INTERVAL_HOURS=24
MAX_POSTS_PER_DAY=3
```

## 3. 推奨設定

### 初心者向け
- **instagrapiライブラリ**を使用
- 外部APIキー不要
- 設定が簡単

### 本格運用向け
- **Instagram Graph API**を使用
- 公式APIで安定
- より多くの機能

## 4. トラブルシューティング

### よくあるエラー

#### アクセストークンエラー
```
Error: Invalid access token
```
**解決方法:**
- アクセストークンを再生成
- 権限を確認

#### アカウントIDエラー
```
Error: Invalid account ID
```
**解決方法:**
- ビジネスアカウントに変更
- Facebookページと連携

#### 権限エラー
```
Error: Insufficient permissions
```
**解決方法:**
- 必要な権限をリクエスト
- アプリの審査を通過

## 5. セキュリティ注意事項

- アクセストークンは絶対に公開しない
- `.env`ファイルは`.gitignore`に追加
- 本番環境では環境変数を使用
- 定期的にアクセストークンを更新

## 6. テスト方法

```bash
# システムテストを実行
python test_system.py

# 設定確認
python -c "from instagram_graph_api import InstagramGraphAPI; api = InstagramGraphAPI(); print('設定OK' if api.access_token else '設定NG')"
```
