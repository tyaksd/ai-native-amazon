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
  productType?: string
): string {
  try {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloud) throw new Error('Cloudinary cloud name not set')

    const designPublicId = getPublicIdFromUrl(designPngUrl)
    const basePublicId = getPublicIdFromUrl(plainTshirtUrl)

    if (!designPublicId || !basePublicId) {
      throw new Error(`Failed to parse public_id. design=${designPublicId}, base=${basePublicId}`)
    }

    // フーディーの場合はデザイン位置をより上に、少し左に配置
    const isHoodie = productType === 'Hoodie' || productType?.toLowerCase() === 'hoodie'
    const isSweatshirt = productType === 'Sweatshirt' || productType?.toLowerCase() === 'sweatshirt'
    const yOffset = isHoodie ? '-0.12' : (isLongTee || isSweatshirt ? '-0.12' : '-0.05') // フーディーの場合はより上に、Long TeeとSweatshirtは少し上に
    const xOffset = isHoodie ? '-0.015' : '0' // フーディーの場合は少し左に

    // デザインサイズ: Long Teeは33%、その他は29.7%
    const designSize = isLongTee ? '0.33' : '0.297'

    // デザインを相対サイズで中央より僅かに上に配置
    // 注: l_<public_id> は同一Cloudアカウントのアセットを参照
    // Cloudinaryでは、g_パラメータを先に指定し、その後にx/yオフセットを指定する
    const overlayParams = isHoodie 
      ? `fl_relative,w_${designSize},h_${designSize},g_center,x_${xOffset},y_${yOffset}`
      : `fl_relative,w_${designSize},h_${designSize},g_center,y_${yOffset}`
    
    const compositeUrl =
      `https://res.cloudinary.com/${cloud}/image/upload` +
      `/w_800,h_800,c_fit` + // 出力サイズを小さくして処理を軽量化
      `/l_${encodeURIComponent(designPublicId)},${overlayParams}` + // オーバーレイ
      `/${encodeURIComponent(basePublicId)}`

    // 変換URLを直接返す（再アップロードを避けてタイムアウトを防ぐ）
    console.log(`[Composite] ProductType: ${productType}, isHoodie: ${isHoodie}, isLongTee: ${isLongTee}, isSweatshirt: ${isSweatshirt}, xOffset: ${xOffset}, yOffset: ${yOffset}`)
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
  'Black': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763186899/black-plain_eycevr.png',
  'White': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763186982/white-plain_ohzbni.png',
  'Navy': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187015/navy-plain_l6l4ky.png',
  'Grey': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187078/grey-plain_l4a4pj.png',
  'Dark Heather': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187206/dark-heather_iyj1xr.png',
  'Red': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187046/red-plain_i0lkag.png',
  'Blue': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763186952/blue-plain_no6w1x.png',
  'Sand': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187100/sand-plain_jr6tsc.png',
  'Natural': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187126/natural-plain_yaml1f.png',
  'Military Green': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763187145/military-green-plain_lwf2t9.png'
}

// 事前にCloudinaryにアップロードされたプレーンなLong Tee画像のURL
const plainLongTeeUrls: { [key: string]: string } = {
  'Black': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763886468/ChatGPT_Image_Nov_23_2025_05_27_41_PM_yasqda.png',
  'White': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763886432/ChatGPT_Image_Nov_23_2025_05_27_05_PM_drasrd.png',
  'Navy': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763886399/ChatGPT_Image_Nov_23_2025_05_26_32_PM_magpwm.png',
  'Grey': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763886347/ChatGPT_Image_Nov_23_2025_05_25_35_PM_dembcw.png',
  'Maroon': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763887850/ChatGPT_Image_Nov_23_2025_05_50_43_PM_lwotjm.png',
  'Military Green': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763888027/ChatGPT_Image_Nov_23_2025_05_53_40_PM_ezekfp.png'
}

// 事前にCloudinaryにアップロードされたプレーンなHoodie画像のURL
const plainHoodieUrls: { [key: string]: string } = {
  'Black': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763623805/blackhoodie_tegpra.png',
  'White': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763623805/whitehoodie_vg8e1y.png',
  'Navy': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763623808/navyhoodie_z6xhbq.png',
  'Grey': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763637373/greyhoodie_bgqpqe.png'
}

// 事前にCloudinaryにアップロードされたプレーンなSweatshirt画像のURL
const plainSweatshirtUrls: { [key: string]: string } = {
  'Black': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763610446/blacklong_nhzicq.png',
  'White': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763610433/whitelong_vdydvl.png',
  'Navy': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763610441/navylong_tisu5v.png',
  'Grey': 'https://res.cloudinary.com/dfb0jdntz/image/upload/v1763611931/ChatGPT_Image_Nov_20_2025_01_12_00_PM_eyl3kk.png'
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
    return 'Grey'
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
    const { designImageUrl, colors, productType } = await request.json()

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
        // productTypeを渡して、Hoodieの場合は位置調整を適用
        const compositeUrl = compositeDesignOnTshirt(baseImageUrl, designImageUrl, isLongTee, productType)
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

