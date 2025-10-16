# Sora2 Brand Video Generator

ブランドのコンセプトを元に世界観を映像化するシステムです。Sora2のAPIを使用して、ブランドの世界観を表現する映像を自動生成します。

## 機能

- **ブランドコンセプト分析**: ブランドの`design_concept`、`target_audience`、`background_image`を分析
- **AI映像プロンプト生成**: GPT-4を使用して映像プロンプトを最適化
- **Sora2映像生成**: Sora2 APIを使用して高品質な映像を生成
- **Cloudinary保存**: 生成された映像をCloudinaryに自動保存
- **リアルタイム進捗**: 映像生成の進捗をリアルタイムで表示

## セットアップ

### 1. 環境変数の設定

`.env.local`に以下の環境変数を追加してください：

```env
# Sora2 API
SORA2_API_KEY=your_sora2_api_key

# OpenAI API (映像プロンプト生成用)
OPENAI_API_KEY=your_openai_api_key

# Cloudinary (映像保存用)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. データベースマイグレーション

```bash
# Supabaseマイグレーションを実行
supabase db push
```

### 3. APIキーの取得

#### Sora2 API
1. [Sora2 API](https://sora2api.org/)でアカウントを作成
2. APIキーを取得して環境変数に設定

#### OpenAI API
1. [OpenAI Platform](https://platform.openai.com/)でアカウントを作成
2. APIキーを取得して環境変数に設定

#### Cloudinary
1. [Cloudinary](https://cloudinary.com/)でアカウントを作成
2. 認証情報を取得して環境変数に設定

## 使用方法

### 1. Sora2管理ページでの映像生成

`/sora`ページにアクセスして、ブランドを選択して映像生成を行います。

**主な機能:**
- ブランド一覧から選択
- リアルタイム映像生成
- 生成された映像の一覧表示
- 映像のダウンロード

### 2. ブランドページでの映像生成

```tsx
import VideoGenerator from '@/sora2/VideoGenerator';

<VideoGenerator
  brandId={brand.id}
  brandName={brand.name}
  brandConcept={brand.design_concept}
  designConcept={brand.design_concept}
  targetAudience={brand.target_audience}
  backgroundImage={brand.background_image}
  onVideoGenerated={(videoUrl) => console.log('Video generated:', videoUrl)}
/>
```

### 3. API経由での映像生成

```javascript
// 映像生成を開始
const response = await fetch('/api/generate-brand-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandId: 'brand-id',
    duration: 5,
    resolution: '1280x720',
    useBackgroundImage: true
  })
});

// ステータス確認
const status = await fetch(`/api/generate-brand-video?jobId=${jobId}`);
```

## アーキテクチャ

### ファイル構成

```
sora2/
├── sora2-video-generator.ts    # コアロジック
├── VideoGenerator.tsx          # Reactコンポーネント
└── README.md                   # このファイル

app/api/
├── generate-brand-video/       # 映像生成API
├── generate-video-prompt/     # プロンプト生成API
└── cloudinary-upload/         # Cloudinary保存API
```

### 処理フロー

1. **ブランドデータ取得**: Supabaseからブランド情報を取得
2. **プロンプト生成**: GPT-4で映像プロンプトを生成
3. **映像生成**: Sora2 APIで映像を生成
4. **進捗監視**: ポーリングで生成状況を監視
5. **保存**: Cloudinaryに映像を保存
6. **データベース更新**: ブランドテーブルに映像URLを保存

## 設定オプション

### 映像生成設定

- **Duration**: 3秒、5秒、10秒から選択
- **Resolution**: HD (1280x720) または Full HD (1920x1080)
- **Background Image**: 既存の背景画像を使用するかどうか

### プロンプト最適化

システムは以下の要素を考慮してプロンプトを生成します：

- ブランドのコンセプトと世界観
- デザイン哲学と色彩
- ターゲットオーディエンス
- 既存の背景画像（オプション）

## トラブルシューティング

### よくある問題

1. **APIキーエラー**: 環境変数が正しく設定されているか確認
2. **生成タイムアウト**: 映像生成には時間がかかる場合があります
3. **Cloudinaryエラー**: 認証情報とフォルダ設定を確認

### ログの確認

```bash
# アプリケーションログを確認
npm run dev

# Supabaseログを確認
supabase logs
```

## 料金

- **Sora2 API**: 使用量に応じた従量課金
- **OpenAI API**: GPT-4の使用量に応じた従量課金
- **Cloudinary**: ストレージと帯域幅に応じた従量課金

## 今後の拡張予定

- [ ] 複数の映像スタイルから選択
- [ ] カスタムプロンプトの入力
- [ ] 映像の編集機能
- [ ] バッチ処理での一括生成
- [ ] 映像の品質向上オプション
