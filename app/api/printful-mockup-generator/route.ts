import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Printful Mockup Generator の使用方法を説明
    const instructions = {
      title: "Printful Mockup Generator でTシャツ上での配置を確認する方法",
      steps: [
        {
          step: 1,
          title: "Printful Mockup Generator にアクセス",
          url: "https://www.printful.com/mockup-generator",
          description: "ブラウザでPrintful Mockup Generatorを開く"
        },
        {
          step: 2,
          title: "Tシャツ商品を選択",
          description: "Gildan 64000 (Unisex Basic Softstyle T-Shirt) または Bella + Canvas 6400 (Women's Relaxed T-Shirt) を選択"
        },
        {
          step: 3,
          title: "デザインファイルをアップロード",
          description: "以下のURLからデザインファイルをアップロード:",
          designUrl: "https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png"
        },
        {
          step: 4,
          title: "位置とサイズを調整",
          description: "デザインの位置とサイズを調整して、Tシャツ上での見た目を確認"
        },
        {
          step: 5,
          title: "プレビューを確認",
          description: "実際のTシャツ上での配置を確認し、必要に応じて位置を調整"
        }
      ],
      designInfo: {
        originalUrl: "https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png",
        dimensions: "1000x1000 pixels",
        position: {
          unisex: "中央配置 (1500, 1500) in 3000x3000 area",
          women: "中央配置 (1400, 1400) in 2800x2800 area"
        }
      },
      alternativeMethods: [
        {
          method: "Printful API を使用したプレビュー生成",
          description: "API経由でプレビュー画像を生成する方法（より高度）",
          note: "現在の実装では、位置計算のみを行い、実際のプレビュー生成は行っていません"
        },
        {
          method: "テスト注文を作成",
          description: "実際のテスト注文を作成してPrintfulダッシュボードで確認",
          warning: "⚠️ 注意: 実際の注文が作成され、費用が発生する可能性があります"
        }
      ]
    }
    
    return NextResponse.json({
      success: true,
      message: "Tシャツ上での配置確認方法",
      instructions,
      quickStart: {
        url: "https://www.printful.com/mockup-generator",
        designUrl: "https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png",
        recommendedProducts: [
          "Gildan 64000 (Unisex Basic Softstyle T-Shirt)",
          "Bella + Canvas 6400 (Women's Relaxed T-Shirt)"
        ]
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
