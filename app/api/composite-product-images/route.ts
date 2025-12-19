import { NextRequest, NextResponse } from 'next/server'

// Safely extract public_id from Cloudinary's secure_url
function getPublicIdFromUrl(url: string): string | null {
  // Format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean) // ["<cloudinary>", "image", "upload", "v12345", "<public_id>.<ext>"]
    const last = parts[parts.length - 1] || ''
    const publicIdWithExt = decodeURIComponent(last)
    const withoutExt = publicIdWithExt.replace(/\.[a-z0-9]+$/i, '')
    // If public_id contains subfolders, slice from after "upload/" to the end
    const uploadIndex = parts.findIndex(p => p === 'upload')
    if (uploadIndex >= 0) {
      const pathAfterUpload = parts.slice(uploadIndex + 1) // ["v12345", "<public_id>.<ext>"] or ["v12345","folder","id.png"]
      // Exclude v<version>
      const afterVersion = pathAfterUpload[0]?.startsWith('v') ? pathAfterUpload.slice(1) : pathAfterUpload
      // Replace trailing <public_id>.<ext> with withoutExt
      if (afterVersion.length > 0) {
        const lastIdx = afterVersion.length - 1
        afterVersion[lastIdx] = withoutExt
        return afterVersion.join('/')
      }
    }
    return withoutExt
  } catch {
    return null
  }
}

// Cloudinary 変換URLでプレーンTシャツにデザインを合成
function compositeDesignOnTshirt(
  plainTshirtUrl: string, 
  designPngUrl: string,
  isLongTee: boolean = false,
  productType?: string,
  isSmall: boolean = false
): string {
  try {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloud) throw new Error('Cloudinary cloud name not set')

    const designPublicId = getPublicIdFromUrl(designPngUrl)
    const basePublicId = getPublicIdFromUrl(plainTshirtUrl)

    if (!designPublicId || !basePublicId) {
      throw new Error(`Failed to parse public_id. design=${designPublicId}, base=${basePublicId}`)
    }

    // 製品タイプの判定
    const isHoodie = productType === 'Hoodie' || productType?.toLowerCase() === 'hoodie'
    const isSweatshirt = productType === 'Sweatshirt' || productType?.toLowerCase() === 'sweatshirt'
    const isTShirt = productType === 'T-Shirt' || productType?.toLowerCase() === 't-shirt' || (!isLongTee && !isHoodie && !isSweatshirt)
    
    console.log(`[Composite Debug] productType: ${productType}, isSmall: ${isSmall}, isTShirt: ${isTShirt}, isLongTee: ${isLongTee}`)
    
    // T-ShirtでSmallがチェックされている場合は、位置を右上に調整
    let yOffset: string
    let xOffset: string
    let designSize: string
    
    if (isTShirt && isSmall) {
      // T-ShirtでSmallの場合
      designSize = '0.09'
      yOffset = '-0.15' // より上に移動
      xOffset = '0.12' // 少し右に移動
      console.log(`[Composite Debug] Applying SMALL T-Shirt settings: size=${designSize}, x=${xOffset}, y=${yOffset}`)
    } else if (isLongTee && isSmall) {
      // Long TeeでSmallの場合
      designSize = '0.09'
      yOffset = '-0.20'
      xOffset = '0.12'
      console.log(`[Composite Debug] Applying SMALL Long Tee settings: size=${designSize}, x=${xOffset}, y=${yOffset}`)
    } else if (isLongTee) {
      // Long Teeの場合（通常）
      designSize = '0.28'
      yOffset = '-0.13'
      xOffset = '0'
    } else if (isHoodie && isSmall) {
      // HoodieでSmallの場合
      designSize = '0.09'
      yOffset = '-0.17'
      xOffset = '0.12'
      console.log(`[Composite Debug] Applying SMALL Hoodie settings: size=${designSize}, x=${xOffset}, y=${yOffset}`)
    } else if (isHoodie) {
      // Hoodieの場合（通常）
      designSize = '0.26'
      yOffset = '-0.12'
      xOffset = '0'
    } else if (isSweatshirt) {
      // Sweatshirtの場合
      designSize = '0.26'
      yOffset = '-0.12'
      xOffset = '0'
    } else {
      // 通常のT-Shirtの場合
      designSize = '0.297'
      yOffset = '-0.08'
      xOffset = '0'
    }

    // デザインを相対サイズで中央より僅かに上に配置
    // 注: l_<public_id> は同一Cloudアカウントのアセットを参照
    // Cloudinaryでは、g_パラメータを先に指定し、その後にx/yオフセットを指定する
    const overlayParams = (xOffset !== '0')
      ? `fl_relative,w_${designSize},h_${designSize},g_center,x_${xOffset},y_${yOffset}`
      : `fl_relative,w_${designSize},h_${designSize},g_center,y_${yOffset}`
    
    const compositeUrl =
      `https://res.cloudinary.com/${cloud}/image/upload` +
      `/w_800,h_800,c_fit` + // 出力サイズを小さくして処理を軽量化
      `/l_${encodeURIComponent(designPublicId)},${overlayParams}` + // オーバーレイ
      `/${encodeURIComponent(basePublicId)}`

    // 変換URLを直接返す（再アップロードを避けてタイムアウトを防ぐ）
    console.log(`[Composite] ProductType: ${productType}, isHoodie: ${isHoodie}, isLongTee: ${isLongTee}, isSweatshirt: ${isSweatshirt}, isSmall: ${isSmall}, designSize: ${designSize}, xOffset: ${xOffset}, yOffset: ${yOffset}`)
    console.log(`[Composite] Generated composite URL: ${compositeUrl}`)
    return compositeUrl
  } catch (error) {
    console.error('Error compositing images:', error)
    // エラー時はプレーンTシャツを返す
    console.log(`[Composite] Using plain t-shirt as fallback: ${plainTshirtUrl}`)
    return plainTshirtUrl
  }
}

// 事前にCloudinaryにアップロードされたプレーンなTシャツ画像のURL
const plainTshirtUrls: { [key: string]: string } = {
  'BLACK': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647344/Screenshot_2025-12-02_at_11.47.35_ewk2zg.png',
  'WHITE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647344/Screenshot_2025-12-02_at_11.46.17_xaklmu.png',
  'NAVY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647344/Screenshot_2025-12-02_at_11.48.41_vmnxma.png',
  'GREY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647346/Screenshot_2025-12-02_at_11.49.59_p3k5bx.png',
  'DARK HEATHER': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647346/Screenshot_2025-12-02_at_11.59.37_lynxnv.png',
  'SAND': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647345/Screenshot_2025-12-02_at_11.53.05_udd0fv.png',
  'SKY BLUE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647344/Screenshot_2025-12-02_at_11.56.11_gefija.png',
  'MILITARY GREEN': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764647347/Screenshot_2025-12-02_at_11.54.49_ddodoq.png'
}

// 事前にCloudinaryにアップロードされたプレーンなLong Tee画像のURL
const plainLongTeeUrls: { [key: string]: string } = {
  'BLACK': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656270/Screenshot_2025-12-02_at_13.20.53_d4xbhj.png',
  'WHITE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656269/Screenshot_2025-12-02_at_13.20.00_ybyrun.png',
  'NAVY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656269/Screenshot_2025-12-02_at_13.22.09_bvjxvj.png',
  'GREY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656272/ChatGPT_Image_Dec_2_2025_02_25_15_PM_sq9vk7.png',
  'MAROON': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656272/ChatGPT_Image_Dec_2_2025_02_14_21_PM_vndyax.png',
  'MILITARY GREEN': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656270/Screenshot_2025-12-02_at_13.29.10_uolb5c.png',
  'SAND': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656270/ChatGPT_Image_Dec_2_2025_02_38_24_PM_yvmaa9.png',
  'SKY BLUE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764656272/ChatGPT_Image_Dec_2_2025_03_15_23_PM_imw58j.png'
}

// 事前にCloudinaryにアップロードされたプレーンなHoodie画像のURL
const plainHoodieUrls: { [key: string]: string } = {
  'BLACK': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662501/Screenshot_2025-12-02_at_15.45.58_b200qi.png',
  'WHITE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662502/Screenshot_2025-12-02_at_15.45.17_fgxnwg.png',
  'NAVY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662503/Screenshot_2025-12-02_at_15.47.07_nrzjcn.png',
  'GREY': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662504/Screenshot_2025-12-02_at_16.57.32_wztmcn.png',
  'SKY BLUE': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662503/Screenshot_2025-12-02_at_15.51.24_er921r.png',
  'MILITARY GREEN': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662504/Screenshot_2025-12-02_at_16.29.02_wvcvhd.png',
  'MAROON': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662503/Screenshot_2025-12-02_at_16.25.38_brmvra.png',
  'CREAM': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764662502/Screenshot_2025-12-02_at_16.32.53_vmoyvd.png'
}

// 事前にCloudinaryにアップロードされたプレーンなSweatshirt画像のURL
const plainSweatshirtUrls: { [key: string]: string } = {
  'Black': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764586785/blacklong_ylhrme.png',
  'White': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764586803/whitelong_smrprv.png',
  'Navy': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764587232/navylong_offe72.png',
  'Grey': 'https://res.cloudinary.com/dczsafftw/image/upload/v1764587338/ChatGPT_Image_Nov_20_2025_01_12_00_PM_bjz3tg.png'
}




// カラー名を正規化して定義済みカラー名にマッピング
function normalizeColorName(color: string, colorMap: { [key: string]: string }): string | null {
  const normalized = color.trim()
  
  // 完全一致をチェック
  if (colorMap[normalized]) {
    return normalized
  }
  
  // 大文字小文字を無視してチェック
  const lowerColor = normalized.toLowerCase()
  for (const [key] of Object.entries(colorMap)) {
    if (key.toLowerCase() === lowerColor) {
      return key
    }
  }
  
  // Grey/Grayの特殊マッピング
  if (lowerColor === 'gray') {
    // 大文字のキーを探す
    for (const [key] of Object.entries(colorMap)) {
      if (key.toUpperCase() === 'GREY') {
        return key
      }
    }
    return 'GREY'
  }
  
  // 部分一致をチェック（例: "dark heather" → "Dark Heather"）
  for (const [key] of Object.entries(colorMap)) {
    if (key.toLowerCase().includes(lowerColor) || lowerColor.includes(key.toLowerCase())) {
      return key
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { designImageUrl, colors, productType, isSmall } = await request.json()

    console.log(`[Composite API] Received request - productType: ${productType}, isSmall: ${isSmall}, colors: ${colors.length}`)

    if (!designImageUrl || !colors || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: designImageUrl and colors array' },
        { status: 400 }
      )
    }

    // Product Typeに応じて適切なベース画像マップを選択
    const isLongTee = productType === 'Long Tee'
    const isHoodie = productType === 'Hoodie' || productType?.toLowerCase() === 'hoodie'
    const isSweatshirt = productType === 'Sweatshirt' || productType?.toLowerCase() === 'sweatshirt'
    let baseImageMap: { [key: string]: string }
    let productTypeName: string
    
    if (isLongTee) {
      baseImageMap = plainLongTeeUrls
      productTypeName = 'Long Tee'
    } else if (isHoodie) {
      baseImageMap = plainHoodieUrls
      productTypeName = 'Hoodie'
    } else if (isSweatshirt) {
      baseImageMap = plainSweatshirtUrls
      productTypeName = 'Sweatshirt'
    } else {
      baseImageMap = plainTshirtUrls
      productTypeName = 'T-Shirt'
    }

    const compositeImages: string[] = []

    for (const color of colors) {
      // カラー名を正規化
      const normalizedColor = normalizeColorName(color, baseImageMap)
      if (!normalizedColor) {
        console.warn(`[Composite:${color}] Color not found in available colors for ${productTypeName}, using original design image`)
        // カラーが見つからない場合は、元のデザイン画像を使用
        compositeImages.push(designImageUrl)
        continue
      }

      const baseImageUrl = baseImageMap[normalizedColor]
      if (!baseImageUrl) {
        console.error(`[Composite:${normalizedColor}] No plain ${productTypeName.toLowerCase()} image found for color: ${normalizedColor}`)
        // カラーが見つからない場合は、元のデザイン画像を使用
        compositeImages.push(designImageUrl)
        continue
      }

      console.log(`[Composite:${normalizedColor}] Compositing design onto ${normalizedColor} ${productTypeName.toLowerCase()}...`)
      try {
        // productTypeとisSmallを渡して、位置調整を適用
        const compositeUrl = compositeDesignOnTshirt(baseImageUrl, designImageUrl, isLongTee, productType, isSmall || false)
        compositeImages.push(compositeUrl)
        console.log(`[Composite:${normalizedColor}] Design composited: ${compositeUrl}`)
      } catch (err) {
        console.error(`[Composite:${normalizedColor}] Composite failed, using plain ${productTypeName.toLowerCase()}:`, err instanceof Error ? err.message : 'Unknown error')
        compositeImages.push(baseImageUrl)
        console.log(`[Composite:${normalizedColor}] Using plain ${productTypeName.toLowerCase()}: ${baseImageUrl}`)
      }
    }

    return NextResponse.json({
      success: true,
      images: compositeImages
    })
  } catch (error) {
    console.error('Error in composite-product-images API:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

