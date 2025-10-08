import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const instructions = {
      title: "Mockup Generatorで位置情報を取得する方法",
      methods: [
        {
          method: "開発者ツールを使用",
          steps: [
            "1. Mockup Generatorを開く: https://www.printful.com/mockup-generator",
            "2. Tシャツ商品を選択（Gildan 64000など）",
            "3. デザインファイルをアップロード",
            "4. デザインの位置を手動で調整",
            "5. ブラウザの開発者ツールを開く（F12）",
            "6. Consoleタブを選択",
            "7. 以下のJavaScriptコードを実行:",
            "",
            "// デザイン要素の位置情報を取得",
            "const designElement = document.querySelector('[data-testid=\"design-element\"]') || document.querySelector('.design-element') || document.querySelector('[style*=\"position\"]')",
            "if (designElement) {",
            "  const rect = designElement.getBoundingClientRect()",
            "  const style = window.getComputedStyle(designElement)",
            "  console.log('Design position:', {",
            "    top: rect.top,",
            "    left: rect.left,",
            "    width: rect.width,",
            "    height: rect.height,",
            "    transform: style.transform,",
            "    position: style.position",
            "  })",
            "} else {",
            "  console.log('Design element not found. Try different selectors.')",
            "}"
          ]
        },
        {
          method: "ネットワークタブでAPI呼び出しを確認",
          steps: [
            "1. 開発者ツールのNetworkタブを開く",
            "2. デザインの位置を調整する",
            "3. API呼び出しを確認（通常は /api/ で始まる）",
            "4. リクエストボディに位置情報が含まれている",
            "5. position や coordinates などのキーを探す"
          ]
        },
        {
          method: "Printful APIの直接確認",
          steps: [
            "1. 調整後に商品を保存",
            "2. Printfulダッシュボードで商品を確認",
            "3. 商品の詳細で位置情報を確認",
            "4. または、作成した商品のAPIレスポンスを確認"
          ]
        }
      ],
      alternativeMethods: [
        {
          method: "手動で座標を記録",
          description: "Mockup Generatorで目視で位置を確認し、座標を手動で記録",
          steps: [
            "1. デザインを最適な位置に配置",
            "2. スクリーンショットを撮影",
            "3. 座標を手動で記録",
            "4. コードに反映"
          ]
        },
        {
          method: "Printful APIで商品情報を取得",
          description: "作成した商品の詳細情報から位置を取得",
          steps: [
            "1. 商品IDを取得",
            "2. Printful APIで商品詳細を取得",
            "3. files配列のposition情報を確認"
          ]
        }
      ],
      codeExample: {
        title: "位置情報をコードに反映する例",
        code: `
// Mockup Generatorで取得した位置情報を反映
export function calculateDesignPosition(
  designWidth: number,
  designHeight: number,
  tshirtType: 'unisex' | 'women' = 'unisex'
) {
  // Mockup Generatorで手動調整した最適な位置
  const manualPositions = {
    unisex: {
      area_width: 3000,
      area_height: 3000,
      width: 1000,
      height: 1000,
      top: 1200,    // Mockup Generatorで調整した値
      left: 1000   // Mockup Generatorで調整した値
    },
    women: {
      area_width: 2800,
      area_height: 2800,
      width: 1000,
      height: 1000,
      top: 1100,   // Mockup Generatorで調整した値
      left: 900    // Mockup Generatorで調整した値
    }
  }
  
  return manualPositions[tshirtType]
}
        `
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Mockup Generatorでの位置情報取得方法",
      instructions,
      quickStart: {
        url: "https://www.printful.com/mockup-generator",
        designUrl: "https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png",
        steps: [
          "1. Mockup Generatorにアクセス",
          "2. デザインをアップロード",
          "3. 位置を手動調整",
          "4. 開発者ツールで位置情報を取得",
          "5. コードに反映"
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
