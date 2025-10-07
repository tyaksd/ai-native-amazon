// app/api/generate-ai-product/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// このルートは Node.js ランタイムで実行（Edge だと Buffer 等で詰まりやすい）
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ----------------------------
// Cloudinary upload helpers
// ----------------------------

// 既存: 画像URLを Cloudinary へ
async function uploadToCloudinary(imageUrl: string, filename = 'product-image.png'): Promise<string> {
  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch image from URL: ${res.status} ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()

  const formData = new FormData()
  formData.append('file', new Blob([Buffer.from(arrayBuffer)]), filename)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  const uploadResult = await uploadResponse.json()
  if (!uploadResponse.ok) {
    throw new Error(`Cloudinary upload failed: ${uploadResult?.error?.message || uploadResponse.statusText}`)
  }
  return uploadResult.secure_url
}

// 追加: dataURL(base64) を Cloudinary へ
async function uploadToCloudinaryFromDataUrl(dataUrl: string, filename = 'image.png'): Promise<string> {
  const formData = new FormData()
  // Cloudinary は data URL をそのまま file に渡せる
  formData.append('file', dataUrl)
  formData.append('public_id', filename.replace(/\.(png|jpg|jpeg|webp)$/i, ''))
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${json?.error?.message || res.statusText}`)
  }
  return json.secure_url
}

// ----------------------------
// AI text helpers
// ----------------------------
async function generateProductName(
  brandName: string,
  productType: string,
  gender: string,
  brandDescription: string,
  brandConcept: string,
  targetAudience: string,
  colorList: string
): Promise<string> {
  // const genderContext =
  //   gender === 'Men'
  //     ? 'masculine, bold, strong'
  //     : gender === 'Women'
  //     ? 'feminine, elegant, stylish'
  //     : 'unisex, versatile, inclusive'

  const prompt = `Create a product name for ${productType} from ${brandName}.
Brand: ${brandDescription}
Gender: ${gender}
Colors: ${colorList}

Requirements:
- Return ONLY a 4-5 word English product name
- No quotes, no punctuation, no extra text
- No brand name repetition (avoid using "${brandName}" in the product name)
- Make it unique and creative
- Focus on the design concept or style, not the product type

Example format: "Urban Edge Classic" or "Street Essential"
Return ONLY the product name:`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 24,
  })

  console.log('Product name generation response:', {
    choices: response.choices,
    usage: response.usage,
    model: response.model
  })

  const productName = response.choices[0]?.message?.content?.trim()
  if (!productName) {
    console.error('No product name generated:', {
      choices: response.choices,
      firstChoice: response.choices[0],
      message: response.choices[0]?.message,
      content: response.choices[0]?.message?.content,
      finishReason: response.choices[0]?.finish_reason,
      usage: response.usage
    })
    
    // If the response was cut off due to length, try with a much shorter prompt
    if (response.choices[0]?.finish_reason === 'length') {
      console.log('Response was cut off due to length, trying with shorter prompt...')
      const shortPrompt = `Create a 4-5 word product name for ${productType}. No brand name, no quotes, no punctuation. Example: "Urban Edge Classic"`
      
      const retryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: shortPrompt }],
        max_completion_tokens: 20,
      })
      
      const retryName = retryResponse.choices[0]?.message?.content?.trim()
      if (retryName) {
        console.log('Retry successful, got product name:', retryName)
        return retryName
      }
    }
    
    // Final fallback - generate a simple name based on brand and product type
    console.log('All attempts failed, using fallback name generation...')
    const fallbackName = `${brandName} ${productType} ${gender === 'Men' ? 'Classic' : 'Essential'}`
    console.log('Using fallback name:', fallbackName)
    return fallbackName
  }
  return productName
}

// async function generateProductDescription(
//   brandName: string,
//   productName: string,
//   productType: string,
//   colors: string[],
//   gender: string,
//   brandDescription: string,
//   brandConcept: string,
//   targetAudience: string
// ): Promise<string> {
//   const colorList = colors.join(', ')
//   const genderContext =
//     gender === 'Men'
//       ? 'masculine style, bold design, strong silhouette'
//       : gender === 'Women'
//       ? 'feminine elegance, stylish cut, flattering fit'
//       : 'versatile design, inclusive fit, universal appeal'

//   const prompt = `You are a professional e-commerce copywriter. Write a compelling, SEO-optimized product description for a ${productType} called "${productName}" from the brand "${brandName}".

// Brand context: ${brandDescription}
// Brand concept: ${brandConcept}
// Target audience: ${targetAudience}
// Product colors: ${colorList}
// Target gender: ${gender}

// Requirements:
// - 150-200 words (comprehensive and detailed)
// - Must include keywords: ${productType.toLowerCase()}, streetwear, urban fashion, ${colorList.toLowerCase()}, ${gender.toLowerCase()}
// - Must highlight ${genderContext}
// - Must reflect the brand's identity and concept
// - Must mention quality, comfort, and durability
// - Must include detailed design features and materials
// - Must include a compelling call-to-action
// - Professional but engaging tone
// - Optimized for e-commerce SEO
// - Must appeal to ${gender.toLowerCase()} customers
// - Must include lifestyle and styling suggestions
// - Must mention care instructions and sizing information
// - Must be completely original and creative

// IMPORTANT: You must generate a unique, compelling description. Do not use generic descriptions.

// Write the product description now:`

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4o-mini',
//     messages: [{ role: 'user', content: prompt }],
//     max_completion_tokens: 1000,
//   })

//   console.log('Product description generation response:', {
//     choices: response.choices,
//     usage: response.usage,
//     model: response.model
//   })

//   const description = response.choices[0]?.message?.content?.trim()
//   if (!description) {
//     console.error('No product description generated:', {
//       choices: response.choices,
//       firstChoice: response.choices[0],
//       message: response.choices[0]?.message,
//       content: response.choices[0]?.message?.content,
//       finishReason: response.choices[0]?.finish_reason,
//       usage: response.usage
//     })
    
//     // If the response was cut off due to length, try with a shorter prompt
//     if (response.choices[0]?.finish_reason === 'length') {
//       console.log('Response was cut off due to length, trying with shorter prompt...')
//       const shortPrompt = `Write a product description for "${productName}" (${productType}) from "${brandName}".
//       Brand: ${brandDescription}
//       Gender: ${gender}
//       Colors: ${colorList}
      
//       Write a compelling 100-word description:`
      
//       const retryResponse = await openai.chat.completions.create({
//         model: 'gpt-5-mini',
//         messages: [{ role: 'user', content: shortPrompt }],
//         max_completion_tokens: 300,
//       })
      
//       const retryDescription = retryResponse.choices[0]?.message?.content?.trim()
//       if (retryDescription) {
//         console.log('Retry successful, got product description:', retryDescription.substring(0, 100) + '...')
//         return retryDescription
//       }
//     }
    
//     throw new Error('Failed to generate product description')
//   }
//   return description
// }

// ✅ Drop-in replacement: ブランド指定＋デザイン重視＋SEO配慮＋推論弱＆ノースロー
async function generateProductDescription(
  brandName: string,
  productName: string,
  productType: string,
  colors: string[],
  gender: string,
  brandDescription: string,
  brandConcept: string,
  targetAudience: string
): Promise<string> {
  const colorList = colors.join(', ')
  const baseKeywords = [
    productType.toLowerCase(),
    'streetwear',
    'urban fashion',
    colorList.toLowerCase(),
    gender.toLowerCase(),
    brandName.toLowerCase()
  ].filter(Boolean).join(', ')

  // ── プロンプト方針 ──
  // ・必ず「{brandName} の {productType}」であることを前置き
  // ・デザイン/イメージ（グラフィック、ムード、使用シーン）を中心に描写
  // ・素材/着心地、ケア、サイズ感、CTA を含める
  // ・SEOキーワードを自然に散りばめる（上記 baseKeywords）
  // ・見出しや箇条書きは使わず、プレーンテキスト 150–180語を目標

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are an e-commerce copywriter. Produce 70–80 words of plain text. No headings, no bullet lists, no markdown.'
    },
    {
      role: 'user',
      content:
`Write a compelling, SEO-aware product description in English.

Product must be explicitly described as an official ${productType} from the brand "${brandName}".
Use the brand context and concept faithfully: 
- Brand context: ${brandDescription}
- Brand concept: ${brandConcept}

Focus mainly on DESIGN & IMAGE:
- Describe the graphic/artwork and visual attitude (mood, vibe, where it stands out).
- Convey how it reflects ${brandName}'s identity and ${productType} use-cases for ${targetAudience}.
- Mention garment colors: ${colorList}. Keep it natural (no color spam).

Also include:
- comfort/durability and basic construction details.
- Care guidance and a short note on sizing/fit for ${gender}.
- A subtle call-to-action at the end.

IMPORTANT: Do NOT mention specific fabric materials, fabric composition, fabric details, or any material specifications since these are handled by Printful's manufacturing process. Focus only on design, style, and visual elements.

SEO:
- Naturally weave in these keywords (do not force): ${baseKeywords}.
- Keep tone professional yet energetic; avoid clichés and generic filler.

Return a single cohesive paragraph of ~70–80 words.`
    }
  ]

  // 1) gpt-4o-mini でまず生成（推論トークンを使いにくい）
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 380, // 150–180語に十分
      temperature: 0.8
    })
    const txt = res.choices?.[0]?.message?.content?.trim()
    if (txt) return txt
  } catch (e) {
    console.warn('[Desc main] gpt-4o-mini failed, falling back:', e)
  }

  // 2) セーフフォールバック（短文 ~100語）
  try {
    const res2 = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Write ~100 words. Plain text only.' },
        { 
          role: 'user',
          content:
`Write a concise product description for "${productName}" (${productType}) by ${brandName}. 
Focus on the design/artwork, the brand's attitude (${brandConcept}), comfort, care, fit, and a short CTA. 
Do NOT mention specific fabric materials, fabric composition, or any material specifications since these are handled by Printful's manufacturing process.
Include natural SEO hints: ${baseKeywords}.`
        }
      ],
      max_completion_tokens: 220,
      temperature: 0.8
    })
    const txt2 = res2.choices?.[0]?.message?.content?.trim()
    if (txt2) return txt2
  } catch (e) {
    console.warn('[Desc fallback] short fallback failed:', e)
  }

  // 3) 最終固定テンプレ（必ず返す）
  return `${productName} is an official ${productType} from ${brandName}, created for ${targetAudience} with a street-ready attitude. The design channels the brand's ${brandConcept.toLowerCase()}—bold graphic energy with urban fashion edge—so the artwork feels expressive and built to stand out in daily rotation. Cut for a comfortable ${gender.toLowerCase()} fit, it delivers reliable durability for long wear. Easy to style with denim or cargos from day to night. Machine wash cold and tumble dry low to preserve the print and color. True-to-size with room to move through the shoulders and chest. Add this essential to your streetwear lineup now. Keywords: ${baseKeywords}.`
}

// async function determineGender(
//   brandName: string,
//   productType: string,
//   brandDescription: string,
//   targetAudience: string
// ): Promise<string> {
//   const prompt = `Based on the brand "${brandName}" and product type "${productType}", determine the most appropriate gender category:
//
// Brand context: ${brandDescription}
// Target audience: ${targetAudience}
//
// Options: Men, Women, Unisex, Null
//
// Return only the gender category, nothing else.`
//
//   const response = await openai.chat.completions.create({
//     model: 'gpt-4o-mini',
//     messages: [{ role: 'user', content: prompt }],
//     max_completion_tokens: 50,
//   })
//
//   console.log('Gender determination response:', {
//     choices: response.choices,
//     usage: response.usage,
//     model: response.model
//   })
//
//   const gender = response.choices[0]?.message?.content?.trim()
//   console.log('Raw gender response:', gender)
//   
//   // If no gender was returned or response was cut off, try with a shorter prompt
//   if (!gender || response.choices[0]?.finish_reason === 'length') {
//     console.log('Gender response was empty or cut off, trying with shorter prompt...')
//     const shortPrompt = `Brand: "${brandName}" 
//     Product: ${productType}
//     Audience: ${targetAudience}
//     
//     Choose: Men, Women, Unisex, or Null`
//     
//     const retryResponse = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [{ role: 'user', content: shortPrompt }],
//       max_completion_tokens: 20,
//     })
//     
//     const retryGender = retryResponse.choices[0]?.message?.content?.trim()
//     if (retryGender) {
//       console.log('Retry successful, got gender:', retryGender)
//       const validRetryGender = ['Men', 'Women', 'Unisex', 'Null'].includes(retryGender) ? retryGender : 'Unisex'
//       console.log('Final gender (retry):', validRetryGender)
//       return validRetryGender
//     }
//   }
//   
//   const validGender = ['Men', 'Women', 'Unisex', 'Null'].includes(gender || '') ? (gender as string) : 'Unisex'
//   console.log('Final gender:', validGender)
//   
//   return validGender
// }

function generateRandomPrice(): number {
  // Generate random price from $29.90, $35.90, $39.90
  const prices = [29.90, 35.90, 39.90]
  const randomIndex = Math.floor(Math.random() * prices.length)
  return prices[randomIndex]
}

// ----------------------------
// Image generation (Design First → Apply to Products)
// 1. Generate design PNG first
// 2. Apply that design to each color variant
// ----------------------------

// 画像合成処理：プレーンなTシャツにデザインを合成
async function compositeDesignOnTshirt(
  plainTshirtUrl: string, 
  designPngUrl: string, 
  outputName: string
): Promise<string> {
  try {
    // プレーンなTシャツとデザインPNGのIDを取得
    const designId = designPngUrl.split('/').pop()?.split('.')[0]
    const baseId = plainTshirtUrl.split('/').pop()?.split('.')[0]
    
    // Cloudinaryの画像合成APIを使用（デザインサイズを調整し、中央より僅かに上に配置）
    const compositeUrl = `https://res.cloudinary.com/dmoyeva1q/image/upload/w_1024,h_1024,c_fit,fl_layer_apply,g_center,l_${designId},fl_relative,w_0.33,h_0.33,y_-0.05/${baseId}`
    
    // 合成された画像をCloudinaryにアップロード
    const finalUrl = await uploadToCloudinary(compositeUrl, `${outputName}-composite.png`)
    return finalUrl
  } catch (error) {
    console.error('Error compositing images:', error)
    throw error
  }
}
async function generateProductImages(
  brandName: string,
  productName: string,
  productType: string,
  colors: string[],
  brandDescription: string,
  designConcept: string,
  targetAudience: string,
  gender: string,
  designStyle?: string
): Promise<{ productImages: string[]; designPng: string }> {
  const productImages: string[] = []
  let designPng = ''
  // let designDescription = ''

  // ステップ1: まず共通のデザインPNGを生成
  const genderContext =
    gender === 'Men'
      ? 'masculine design, bold graphics, strong silhouette, tailored fit'
      : gender === 'Women'
      ? 'feminine design, elegant graphics, flattering silhouette, fitted cut'
      : 'unisex design, versatile graphics, inclusive silhouette, universal fit'

  // デザインスタイルをプロンプトに組み込む
  const styleContext = designStyle ? `Focus on ${designStyle} as the primary design approach.` : ''
  
  // 一意性を高めるためのランダム要素
  const uniqueElements = [
    'with subtle asymmetrical balance',
    'featuring dynamic composition',
    'with organic flowing lines',
    'incorporating geometric precision',
    'with bold contrast elements',
    'featuring minimalist elegance',
    'with artistic texture details',
    'incorporating modern aesthetics'
  ]
  const randomElement = uniqueElements[Math.floor(Math.random() * uniqueElements.length)]
  
  const designPngPrompt = `Create a high-quality, production-ready design for a ${productType} from ${brandName}.

Brand Identity: ${brandDescription}
Core Design Concept: ${designConcept}
Target Audience: ${targetAudience}
Style Direction: ${genderContext}
${styleContext}
Design Approach: ${randomElement}

CRITICAL DESIGN REQUIREMENTS:
- The design MUST deeply embody and express the brand's core concept: "${designConcept}"
- Create a design that is unmistakably unique to ${brandName}'s identity and philosophy
- The artwork should tell a visual story that resonates with ${targetAudience}
- Incorporate design elements that reflect the brand's ${brandDescription.toLowerCase()} aesthetic
- Make the design so distinctive that it could only come from ${brandName}
- Ensure the visual language speaks directly to the brand's target demographic

Technical Requirements:
- Output ONLY the printed design (no garment, no mockup, no shadows, no textures).
- Preserve artwork precisely: same shapes, proportions, line weights, and colors.
- Use neutral colors (black, white, or brand colors) that work well on any background color.
- Edges clean and production-ready. Include a comfortable transparent margin around the design (bleed-safe).
- If the design includes distressed ink textures, preserve them faithfully without adding noise.
- The final result should look realistic and natural — as if it were designed by a human, and should reflect the high-quality aesthetic of popular, top-selling brands.
- Including the brand name in the design is not required
- Make this design unique and distinct from other similar products
- Ensure visual variety and avoid repetitive patterns

Brand-Specific Design Elements:
- Draw inspiration from the brand's core concept: ${designConcept}
- Create visual metaphors that represent the brand's philosophy
- Use design language that appeals specifically to ${targetAudience}
- Incorporate elements that reflect the brand's ${brandDescription.toLowerCase()} character
- Make the design feel authentic to ${brandName}'s unique voice and vision

Negative prompt: garment, T-shirt, fabric, mannequin, hanger, props, background, shadows, reflections, text overlay, watermark, CGI, 3D render, illustration
`.trim()

  console.log(`[DesignPNG] Generating design for ${productName}...`)
  try {
    const designRes = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: designPngPrompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    })

    const d1 = designRes.data?.[0]
    if (!d1) throw new Error('No image data for design PNG')

    if (d1.url) {
      designPng = await uploadToCloudinary(d1.url, `${productName}-design.png`)
    } else if (d1.b64_json) {
      const dataUrl = `data:image/png;base64,${d1.b64_json}`
      designPng = await uploadToCloudinaryFromDataUrl(dataUrl, `${productName}-design.png`)
    } else {
      throw new Error('Image response missing url and b64_json for design PNG')
    }
    
    // デザインの詳細説明を生成（商品写真生成時に使用）
    // designDescription = `A ${designConcept.toLowerCase()} design featuring ${genderContext.toLowerCase()} elements, created for ${targetAudience.toLowerCase()}. The design should be centered on the chest area and maintain consistent visual elements across all color variants.`
    
    console.log(`[DesignPNG] Generated common design for all colors: ${designPng}`)
  } catch (err) {
    console.error('[DesignPNG]', JSON.stringify(err, null, 2))
    // デザインPNGが作れない場合は、デザインなしの商品写真を生成
  }

  // ステップ2: 事前に用意したプレーンなTシャツ画像にデザインを合成
  for (const color of colors) {
    // 色名からhexコードへのマッピング
    // const colorHexMap: { [key: string]: string } = {
    //   'Black': '#0e0e0e',
    //   'White': '#ffffff', 
    //   'Navy': '#0f1830',
    //   'Grey': '#d1d2d6',
    //   'Dark Heather': '#424848',
    //   'Red': '#FF1B2B',
    //   'Blue': '#2665CC',
    //   'Sand': '#d8c5a9',
    //   'Natural': '#fff6ea',
    //   'Military Green': '#686f54'
    // }
    
    // const hexColor = colorHexMap[color] || color

    // 事前にCloudinaryにアップロードされたプレーンなTシャツ画像のURL
    const plainTshirtUrls: { [key: string]: string } = {
      'Black': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810178/hpkljewf536be7jxngaa.png',
      'White': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810191/zkpqbj8tsq1mqh7wckqc.png',
      'Navy': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810267/i5l0zsvfzvgfljjubxss.png',
      'Grey': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810276/npsmoouflrbceq85of2w.png',
      'Dark Heather': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810353/iubtkqcerwt5kgqbno6i.png',
      'Red': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810325/z0yegssta7nhanoklrwe.png',
      'Blue': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810315/ztu5e1sefadfrzmzmfdt.png',
      'Sand': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810357/xdmbcpynuufwqetvcdza.png',
      'Natural': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810398/ejx2nl18fr5vkps0menf.png',
      'Military Green': 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759810402/aujulswo5bjdf8pshilu.png'
    }

    const plainTshirtUrl = plainTshirtUrls[color]
    
    if (!plainTshirtUrl) {
      console.error(`[PlainTshirt:${color}] No plain t-shirt image found for color: ${color}`)
      continue
    }

    console.log(`[PlainTshirt:${color}] Using pre-made plain ${color} t-shirt: ${plainTshirtUrl}`)

    // デザインPNGが生成されている場合、プレーンなTシャツにデザインを合成
    if (designPng) {
      console.log(`[Composite:${color}] Compositing design onto ${color} t-shirt...`)
      try {
        // 画像合成処理を実装
        const compositeUrl = await compositeDesignOnTshirt(plainTshirtUrl, designPng, `${productName}-${color}`)
        productImages.push(compositeUrl)
        console.log(`[Composite:${color}] Design composited: ${compositeUrl}`)
      } catch (err) {
        console.error(`[Composite:${color}]`, JSON.stringify(err, null, 2))
        // 合成に失敗した場合はプレーンなTシャツをそのまま使用
        productImages.push(plainTshirtUrl)
        console.log(`[Composite:${color}] Using plain t-shirt: ${plainTshirtUrl}`)
      }
    } else {
      // デザインPNGがない場合はプレーンなTシャツをそのまま使用
      productImages.push(plainTshirtUrl)
      console.log(`[PlainTshirt:${color}] Using plain t-shirt: ${plainTshirtUrl}`)
    }
    
    console.log(`[ProductPhoto:${color}] Generated: ${productImages[productImages.length - 1]}`)

  }

  return { productImages, designPng }
}

// ----------------------------
// Route handler
// ----------------------------
export async function POST(request: NextRequest) {
  try {
    const { brandId, productType, colors, quantity } = await request.json()

    if (!brandId || !productType || !colors || !Array.isArray(colors) || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // ブランド情報
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    const createdProducts: unknown[] = []
    const designStyles = [
      'minimalist geometric patterns',
      'bold typography and lettering',
      'abstract artistic illustrations',
      'vintage retro graphics',
      'modern line art and silhouettes',
      'urban street art elements',
      'nature-inspired organic shapes',
      'architectural and structural designs',
      'pop art and vibrant graphics',
      'monochrome artistic compositions'
    ]
    const usedStyles: string[] = []

     for (let i = 0; i < quantity; i++) {
       try {
         console.log(`[Product ${i + 1}/${quantity}] Starting generation...`)
         
         // 性別をMenとWomenで交互に選択
         const gender = i % 2 === 0 ? 'Men' : 'Women'
         console.log(`[Product ${i + 1}] Gender determined: ${gender}`)

        console.log(`[Product ${i + 1}] Generating description...`)
        const description = await generateProductDescription(
          brand.name,
          'Temporary Product Name', // 一時的な名前（後で更新）
          productType,
          colors,
          gender,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Fashion-forward individuals'
        )
        console.log(`[Product ${i + 1}] Description length: ${description.length} characters`)

        console.log(`[Product ${i + 1}] Generating product name...`)
        const productName = await generateProductName(
          brand.name,
          productType,
          gender,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Young adults and fashion enthusiasts',
          colors.join(', ')
        )
        console.log(`[Product ${i + 1}] Product name: ${productName}`)

         const price =
           productType.toLowerCase().includes('t-shirt') ? generateRandomPrice() : 35

        // デザインスタイルを選択（重複を避ける）
        let selectedStyle = designStyles[i % designStyles.length]
        if (usedStyles.includes(selectedStyle)) {
          // 使用済みのスタイルを避けて、未使用のスタイルを選択
          const availableStyles = designStyles.filter(style => !usedStyles.includes(style))
          if (availableStyles.length > 0) {
            selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)]
          }
        }
        usedStyles.push(selectedStyle)
        
        console.log(`[Product ${i + 1}] Selected design style: ${selectedStyle}`)
        console.log(`[Product ${i + 1}] Generating images...`)
        // 画像生成（A: 商品写真 → B: デザインPNG）
        const { productImages, designPng } = await generateProductImages(
          brand.name,
          productName,
          productType,
          colors,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Fashion-forward individuals',
          gender,
          selectedStyle
        )
        console.log(`[Product ${i + 1}] Generated ${productImages.length} product images, design PNG: ${designPng ? 'Yes' : 'No'}`)

        console.log(`[Product ${i + 1}] Saving to database...`)
        // DB登録
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: productName,
            description,
            price,
            brand_id: brandId,
            category: 'Clothing',
            type: productType,
            colors,
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
            gender,
            images: productImages,
            design_png: designPng ? [designPng] : null,
          })
          .select()
          .single()

        if (productError) {
          console.error(`[Product ${i + 1}] Error creating product:`, JSON.stringify(productError, null, 2))
          continue
        }

        console.log(`[Product ${i + 1}] Successfully created: ${productName}`)
        createdProducts.push(product)
       } catch (err) {
         console.error('Error in product generation loop:', {
           error: err,
           message: err instanceof Error ? err.message : 'Unknown error',
           stack: err instanceof Error ? err.stack : undefined,
           productIndex: i,
           brandId,
           productType,
           colors
         })
         continue
       }
    }

    return NextResponse.json({
      success: true,
      products: createdProducts,
      message: `Successfully generated ${createdProducts.length} products`,
    })
  } catch (error) {
    console.error('Error in generate-ai-product API:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
