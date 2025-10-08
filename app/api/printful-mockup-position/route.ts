import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const mockupPositionScript = `
// Printful Mockup Generator専用の位置情報取得スクリプト
(function() {
  console.log('=== Printful Mockup Generator 位置情報取得 ===');
  
  // 1. デザイン要素を探す（複数の可能性を試す）
  const possibleSelectors = [
    '[data-testid*="design"]',
    '[data-testid*="print"]',
    '[data-testid*="file"]',
    '.design-element',
    '.print-element',
    '.file-element',
    '[class*="design"]',
    '[class*="print"]',
    '[class*="file"]',
    '[style*="transform"]',
    '[style*="position"]',
    'img[src*="design"]',
    'img[src*="print"]',
    'canvas',
    'svg'
  ];
  
  let designElement = null;
  let selector = '';
  
  for (const sel of possibleSelectors) {
    const element = document.querySelector(sel);
    if (element) {
      designElement = element;
      selector = sel;
      break;
    }
  }
  
  if (designElement) {
    console.log('✅ デザイン要素を発見:', selector);
    
    // 2. 位置情報を取得
    const rect = designElement.getBoundingClientRect();
    const style = window.getComputedStyle(designElement);
    const computedStyle = window.getComputedStyle(designElement);
    
    // 3. Printful API形式の位置情報を計算
    const mockupContainer = document.querySelector('[data-testid*="mockup"]') || 
                          document.querySelector('.mockup-container') ||
                          document.querySelector('[class*="mockup"]');
    
    let containerRect = { width: 3000, height: 3000 }; // デフォルト値
    if (mockupContainer) {
      containerRect = mockupContainer.getBoundingClientRect();
    }
    
    // 4. 相対位置を計算（Printful API形式）
    const relativeTop = Math.round((rect.top / containerRect.height) * 3000);
    const relativeLeft = Math.round((rect.left / containerRect.width) * 3000);
    const relativeWidth = Math.round((rect.width / containerRect.width) * 3000);
    const relativeHeight = Math.round((rect.height / containerRect.height) * 3000);
    
    const positionInfo = {
      // DOM位置情報
      dom: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        transform: style.transform,
        position: style.position
      },
      // Printful API形式の位置情報
      printful: {
        area_width: 3000,
        area_height: 3000,
        width: relativeWidth,
        height: relativeHeight,
        top: relativeTop,
        left: relativeLeft
      },
      // メタ情報
      meta: {
        selector: selector,
        containerSize: {
          width: containerRect.width,
          height: containerRect.height
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('🎯 デザイン位置情報:', positionInfo);
    console.log('📋 Printful API用の位置情報:');
    console.log(JSON.stringify(positionInfo.printful, null, 2));
    
    // 5. クリップボードにコピー
    const printfulPosition = JSON.stringify(positionInfo.printful, null, 2);
    navigator.clipboard.writeText(printfulPosition).then(() => {
      console.log('📋 Printful位置情報をクリップボードにコピーしました');
    }).catch(() => {
      console.log('📋 クリップボードコピーに失敗しました');
    });
    
    return positionInfo;
    
  } else {
    console.log('❌ デザイン要素が見つかりません');
    console.log('🔍 利用可能な要素を検索中...');
    
    // デバッグ用: 全ての要素をリストアップ
    const allElements = document.querySelectorAll('*');
    const elementsWithStyle = Array.from(allElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.position !== 'static' || 
             style.transform !== 'none' || 
             el.tagName === 'IMG' || 
             el.tagName === 'CANVAS' ||
             el.tagName === 'SVG';
    });
    
    console.log('🔍 位置関連要素:', elementsWithStyle.map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      style: el.style.cssText
    })));
    
    return null;
  }
})();
    `;
    
    return NextResponse.json({
      success: true,
      message: "Printful Mockup Generator専用の位置情報取得スクリプト",
      script: mockupPositionScript,
      instructions: [
        "1. Mockup Generatorを開く: https://www.printful.com/mockup-generator",
        "2. デザインをアップロードして位置を調整",
        "3. 開発者ツール（F12）のConsoleタブを開く",
        "4. 上記のスクリプトをコピー&ペーストして実行",
        "5. コンソールに表示される位置情報を確認",
        "6. クリップボードにコピーされた位置情報をコードに反映"
      ],
      features: [
        "✅ デザイン要素の自動検出",
        "✅ DOM位置情報の取得",
        "✅ Printful API形式への変換",
        "✅ クリップボードへの自動コピー",
        "✅ デバッグ情報の表示"
      ],
      expectedOutput: {
        dom: "DOM要素の位置情報",
        printful: "Printful API用の位置情報（area_width, area_height, width, height, top, left）",
        meta: "メタ情報（セレクタ、コンテナサイズ、タイムスタンプ）"
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
