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

// 画像URLを Cloudinary へアップロード
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

// dataURL(base64) を Cloudinary へアップロード
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

// Cloudinaryの secure_url から public_id を安全に抽出
function getPublicIdFromUrl(url: string): string | null {
  // 形式: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean) // ["<cloudinary>", "image", "upload", "v12345", "<public_id>.<ext>"]
    const last = parts[parts.length - 1] || ''
    const publicIdWithExt = decodeURIComponent(last)
    const withoutExt = publicIdWithExt.replace(/\.[a-z0-9]+$/i, '')
    // public_id がサブフォルダを含む場合は、"upload/" 以降〜末尾までをスライス
    const uploadIndex = parts.findIndex(p => p === 'upload')
    if (uploadIndex >= 0) {
      const pathAfterUpload = parts.slice(uploadIndex + 1) // ["v12345", "<public_id>.<ext>"] or ["v12345","folder","id.png"]
      // v<version> を除外
      const afterVersion = pathAfterUpload[0]?.startsWith('v') ? pathAfterUpload.slice(1) : pathAfterUpload
      // 末尾の <public_id>.<ext> を withoutExt に置き換え
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

// ----------------------------
// AI helpers
// ----------------------------

// 商品説明文からデザイン要素を抽出して商品名を生成
async function generateProductNameFromDescription(
  brandName: string,
  productType: string,
  productDescription: string,
  designElements: ReturnType<typeof extractDesignElementsFromDescription> | undefined,
  designStyle: string | undefined,
  gender: string,
  brandConcept: string,
  usedNames: string[] = []
): Promise<string> {
  // デザイン要素から商品名のキーワードを抽出（デザイン要素がない場合は空文字）
  const nameKeywords = designElements ? 'design keywords' : ''
  
  const usedNamesText = usedNames.length > 0 ? `\n# AVOID THESE USED NAMES:\n${usedNames.join(', ')}\n` : ''
  
  const prompt = `Create a compelling product name for a ${productType} from ${brandName} based on the design description.

# Product Context
Brand: ${brandName}
Product Type: ${productType}
Gender: ${gender}
Brand Concept: ${brandConcept}
${usedNamesText}
# Design Description Analysis
${productDescription}

# Extracted Design Elements
${designElements ? `
Mood & Energy: ${designElements.mood}
Design Style: ${designElements.style}
Graphic Elements: ${designElements.graphics}
Aesthetics: ${designElements.aesthetics}
Layout: ${designElements.layout}
Selected Design Style: ${designStyle || 'creative and original'}
` : 'Design elements will be interpreted from the description below.'}

# Name Generation Keywords
${nameKeywords}

# Requirements
- Return ONLY a 3-5 word English product name (minimum 3 words, maximum 5 words)
- No quotes, no punctuation, no extra text
- No brand name repetition (avoid using "${brandName}" in the product name)
- Must reflect the design mood, style, and visual elements
- Should capture the essence of the design description
- Make it unique, memorable, and brand-appropriate
- Focus on the visual/design concept, not just the product type
- IMPORTANT: Use exactly 3-5 words, not 2 words like "Urban Strike"
- CRITICAL: Do NOT use any of the previously used names listed above
- Create a completely unique name that has never been used before
- Think creatively and randomly - avoid predictable patterns
- Combine unexpected word combinations that feel fresh and original
- Let your imagination run wild while staying true to the design essence

Return ONLY the product name:`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 30,
    temperature: 0.8
  })

  console.log('Enhanced product name generation response:', {
    choices: response.choices,
    usage: response.usage,
    model: response.model
  })

  let productName = response.choices[0]?.message?.content?.trim()
  
  // 重複チェックとリトライ
  if (productName && usedNames.includes(productName)) {
    console.log(`[Product Name] Generated name "${productName}" is already used, retrying...`)
    
    // リトライ用のプロンプト
    const retryPrompt = `Generate a DIFFERENT product name for the same product. Avoid these used names: ${usedNames.join(', ')}. Create something completely unique. Return ONLY the product name:`
      
      const retryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: retryPrompt }],
      max_completion_tokens: 30,
      temperature: 0.9
    })
    
    productName = retryResponse.choices[0]?.message?.content?.trim()
  }
  
  if (!productName) {
    console.error('No enhanced product name generated, using fallback...')
    return generateFallbackProductName(designElements, designStyle, productType, usedNames)
  }
  
  return productName
}

// デザイン要素から商品名のキーワードを抽出
// function extractNameKeywordsFromDesignElements(
//   _designElements: ReturnType<typeof extractDesignElementsFromDescription>,
//   _designStyle: string | undefined
// ): string {
//   const keywords: string[] = []
//   
//   
//   // 重複を除去して上位10個を返す
//   const uniqueKeywords = [...new Set(keywords)].slice(0, 10)

//   return `Key design keywords: ${uniqueKeywords.join(', ')}`
// }

// フォールバック商品名生成（3-5文字、重複回避）
function generateFallbackProductName(
  designElements: ReturnType<typeof extractDesignElementsFromDescription> | undefined,
  designStyle: string | undefined,
  productType: string,
  usedNames: string[] = []
): string {
  const styleWords = designStyle ? designStyle.split(' ').slice(0, 2) : []
  const moodWords = designElements ? designElements.mood.split(', ')[0].split(' ').slice(0, 2) : []
  const graphicsWords = designElements ? designElements.graphics.split(', ')[0].split(' ').slice(0, 1) : []
  
  // 追加のユニークな単語を生成
  const uniqueWords = ['Dynamic', 'Core', 'Edge', 'Force', 'Pulse', 'Flow', 'Grid', 'Form', 'Line', 'Mark']
  
  const nameParts = [
    ...styleWords,
    ...moodWords,
    ...graphicsWords,
    ...uniqueWords,
    productType === 'T-shirt' ? 'Essential' : 'Core'
  ]
  
  // 3-5文字になるように調整
  let finalParts = nameParts.slice(0, Math.min(5, Math.max(3, nameParts.length)))
  
  // 重複回避のためのリトライ
  let attempts = 0
  let generatedName = finalParts.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  while (usedNames.includes(generatedName) && attempts < 10) {
    attempts++
    // 異なる組み合わせを試す
    const shuffledParts = [...nameParts].sort(() => Math.random() - 0.5)
    finalParts = shuffledParts.slice(0, Math.min(5, Math.max(3, shuffledParts.length)))
    generatedName = finalParts.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  
  return generatedName
}

// 詳細なデザイン説明文を生成（150字程度、SEO無視、デザインのみ）
async function generateDetailedDesignDescription(
  brandName: string,
  productName: string,
  productType: string,
  colors: string[],
  gender: string,
  brandDescription: string,
  brandConcept: string,
  targetAudience: string,
  productIndex?: number // 商品のインデックスを追加
): Promise<string> {
  const colorList = colors.join(', ')

  // ユニークネスを高めるためのランダム要素を追加
  const randomElements = [
    'with unexpected geometric patterns',
    'featuring organic flowing forms',
    'incorporating bold typography elements',
    'with abstract artistic expressions',
    'featuring minimalist clean lines',
    'incorporating vibrant color blocking',
    'with distressed urban textures',
    'featuring futuristic digital aesthetics',
    'incorporating vintage retro influences',
    'with contemporary street art vibes',
    'featuring nature-inspired motifs',
    'incorporating architectural elements',
    'with psychedelic color combinations',
    'featuring industrial design influences',
    'incorporating hand-drawn artistic touches'
  ]
  
  const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)]
  
  // 商品インデックスに基づくユニークな要素
  const indexBasedElements = [
    'dynamic energy and movement',
    'sophisticated elegance and refinement',
    'raw authenticity and street edge',
    'innovative technology integration',
    'artistic expression and creativity',
    'minimalist precision and clarity',
    'bold statement and impact',
    'subtle sophistication and charm',
    'experimental boundary-pushing',
    'timeless classic appeal'
  ]
  
  const indexElement = indexBasedElements[(productIndex || 0) % indexBasedElements.length]

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a creative fashion designer working for this brand. Create innovative, unique design concepts that push creative boundaries while staying true to the brand identity. Think like a designer who wants to surprise and delight customers with fresh, unexpected approaches. Each design must be completely unique and different from any previous designs.'
    },
    {
      role: 'user',
      content: `
As a designer for ${brandName}, create a completely new and innovative design concept for a ${productType}.

# Brand DNA
Brand: ${brandName}
Core Concept: ${brandConcept}
Target Audience: ${targetAudience}
Gender: ${gender}
Available Colors: ${colorList}

# Design Challenge
Create a design that:
- Pushes creative boundaries while honoring the brand essence
- Offers something completely fresh and unexpected
- Balances innovation with brand authenticity
- Creates visual impact that stops people in their tracks
- Incorporates unique design elements, patterns, or compositions
- Uses color in surprising but harmonious ways
- Tells a visual story that connects with the target audience
- ${randomElement}
- Embodies ${indexElement}

# Important Design Notes
- The brand name does NOT need to be included in the design
- Focus on visual concepts, patterns, and artistic elements
- Create a design that represents the brand's essence without text
- Let the visual design speak for itself

# Requirements
- Write approximately 150 words
- Think like a designer exploring new creative territories
- Focus on innovative visual concepts, unique compositions, and artistic approaches
- Describe specific design elements, patterns, textures, and visual relationships
- Include color psychology and visual storytelling
- Consider how the design would stand out in a crowded marketplace
- NO generic descriptions - be specific and creative
- NO SEO or marketing language - pure design innovation
- Make this design completely unique and different from any other design
- Incorporate the random element: ${randomElement}
- Embody the character: ${indexElement}

Return ONLY the creative design concept:`
    }
  ]

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 200,
      temperature: 0.9 // 温度を上げてより多様性を確保
    })
    const txt = res.choices?.[0]?.message?.content?.trim()
    if (txt) return txt
  } catch (e) {
    console.warn('[Design Description] Generation failed, using fallback:', e)
  }

  // フォールバック（商品インデックスに基づいてユニークにする）
  const fallbackElements = [
    'Bold geometric composition with asymmetric layout',
    'Organic flowing forms with dynamic movement',
    'Minimalist precision with clean typography',
    'Urban street art with raw authenticity',
    'Futuristic digital aesthetics with innovation',
    'Vintage retro influences with timeless appeal',
    'Abstract artistic expression with creativity',
    'Industrial design with architectural elements',
    'Nature-inspired motifs with organic beauty',
    'Contemporary street vibes with modern edge'
  ]
  
  const fallbackElement = fallbackElements[(productIndex || 0) % fallbackElements.length]
  return `${fallbackElement} featuring ${brandConcept.toLowerCase()} elements. High contrast palette with dynamic energy and structured composition. ${randomElement}.`
}

// 商品説明（ブランド公式・SEO配慮・購入意欲向上）
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

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are an e-commerce copywriter. Produce 100–120 words of plain text. No headings, no bullet lists, no markdown.'
    },
    {
      role: 'user',
content: `
Write a compelling, SEO-aware, and highly visual product description in English.

The product must be clearly described as an official ${productType} from the brand "${brandName}".
Use the brand context and concept faithfully:
- Brand context: ${brandDescription}
- Brand concept: ${brandConcept}

FOCUS ON DESIGN & VISUAL IMAGERY (be concrete and non-generic):
- State the PRIMARY motif (e.g., emblem/sigil/icon/typographic mark) and 1–2 SECONDARY accents (e.g., grid lines, geometric fragments, brushstrokes).
- Specify composition and alignment (centered/asymmetric/diagonal), approximate scale (e.g., “occupies ~35–45% of the front area”), and orientation/rotation cues.
- Describe line quality (fine/bold), edge treatment (crisp/rough), negative space usage, and perceived depth (without referencing physical materials).
- Name WHICH colors from (${colorList}) dominate vs. accent; keep it natural—no color spam.
- Evoke mood/atmosphere (lighting vibe, energy, motion) and where it visually stands out (street/nightlife/creative workspace).

ALSO INCLUDE (brief):
- Comfort/durability and basic construction cues WITHOUT any fabric names or material specs.
- Simple care guidance and a short sizing/fit note for ${gender}.
- End with a subtle, natural call-to-action.

SEO:
- Weave these keywords naturally (no stuffing): ${baseKeywords}.
- Tone: professional, energetic, authentic to ${brandName}; avoid clichés and filler.

OUTPUT:
- Return ONE cohesive paragraph of ~100–140 words that feels lifelike and brand-specific (not templated).
`

    }
  ]

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 380,
      temperature: 0.8
    })
    const txt = res.choices?.[0]?.message?.content?.trim()
    if (txt) return txt
  } catch (e) {
    console.warn('[Desc main] gpt-4o-mini failed, falling back:', e)
  }

  // フォールバック
  return `${productName} is an official ${productType} from ${brandName}, created for ${targetAudience} with a street-ready attitude. The design channels the brand's ${brandConcept.toLowerCase()}—bold graphic energy with urban fashion edge—so the artwork feels expressive and built to stand out in daily rotation. Cut for a comfortable ${gender.toLowerCase()} fit, it delivers reliable durability for long wear. Easy to style from day to night. Machine wash cold; tumble dry low. True-to-size through the shoulders and chest. Discover the look and make it yours.`
}

function generateRandomPrice(): number {
  const prices = [29.90, 34.90]
  const randomIndex = Math.floor(Math.random() * prices.length)
  return prices[randomIndex]
}

// 商品説明文からデザイン・ビジュアル要素のみを抽出（SEO要素を除外）
function extractDesignElementsFromDescription(description: string) {
  const lower = description.toLowerCase()
  
  // デザイン・ビジュアル関連のキーワードを抽出
  const visualElements = {
    // ムード・雰囲気
    mood: [] as string[],
    // デザインスタイル
    style: [] as string[],
    // グラフィック要素
    graphics: [] as string[],
    // 色・質感
    aesthetics: [] as string[],
    // レイアウト・配置
    layout: [] as string[],
    // ブランドの特徴
    brandIdentity: [] as string[]
  }

  // ムード・雰囲気の抽出
  if (/(bold|striking|impact|loud|powerful)/.test(lower)) visualElements.mood.push('bold, high-impact')
  if (/(clean|minimal|simple|crisp|refined)/.test(lower)) visualElements.mood.push('clean, minimalist')
  if (/(edgy|raw|gritty|distressed|urban)/.test(lower)) visualElements.mood.push('edgy, urban')
  if (/(elegant|sophisticated|refined|polished)/.test(lower)) visualElements.mood.push('elegant, sophisticated')
  if (/(vibrant|energetic|dynamic|lively)/.test(lower)) visualElements.mood.push('vibrant, energetic')
  if (/(mysterious|dark|nocturnal|night)/.test(lower)) visualElements.mood.push('mysterious, nocturnal')

  // デザインスタイルの抽出
  if (/(geometric|angular|structured|precise)/.test(lower)) visualElements.style.push('geometric, structured')
  if (/(organic|flowing|curved|fluid)/.test(lower)) visualElements.style.push('organic, flowing')
  if (/(vintage|retro|classic|timeless)/.test(lower)) visualElements.style.push('vintage, retro')
  if (/(modern|contemporary|futuristic|cutting-edge)/.test(lower)) visualElements.style.push('modern, contemporary')
  if (/(abstract|artistic|creative|unique)/.test(lower)) visualElements.style.push('abstract, artistic')

  // グラフィック要素の抽出
  if (/(typography|lettering|text|wordmark|font)/.test(lower)) visualElements.graphics.push('typography, lettering')
  if (/(logo|emblem|symbol|mark|icon)/.test(lower)) visualElements.graphics.push('logo, emblem')
  if (/(pattern|motif|design|graphic)/.test(lower)) visualElements.graphics.push('pattern, motif')
  if (/(illustration|artwork|drawing|sketch)/.test(lower)) visualElements.graphics.push('illustration, artwork')
  if (/(geometric|shapes|lines|forms)/.test(lower)) visualElements.graphics.push('geometric shapes')

  // 色・質感の抽出
  if (/(monochrome|black|white|grayscale)/.test(lower)) visualElements.aesthetics.push('monochrome, high contrast')
  if (/(colorful|vibrant|bright|saturated)/.test(lower)) visualElements.aesthetics.push('colorful, vibrant')
  if (/(muted|subtle|soft|pastel)/.test(lower)) visualElements.aesthetics.push('muted, subtle')
  if (/(textured|distressed|worn|aged)/.test(lower)) visualElements.aesthetics.push('textured, distressed')

  // レイアウト・配置の抽出
  if (/(centered|focal|focus|prominent)/.test(lower)) visualElements.layout.push('centered, focal point')
  if (/(asymmetric|offset|dynamic|unbalanced)/.test(lower)) visualElements.layout.push('asymmetric, dynamic')
  if (/(balanced|symmetrical|harmonious)/.test(lower)) visualElements.layout.push('balanced, symmetrical')
  if (/(negative space|breathing room|minimal)/.test(lower)) visualElements.layout.push('negative space, breathing room')

  // ブランドアイデンティティの抽出
  if (/(streetwear|urban|street|city)/.test(lower)) visualElements.brandIdentity.push('streetwear, urban')
  if (/(fashion|style|trendy|chic)/.test(lower)) visualElements.brandIdentity.push('fashion-forward, trendy')
  if (/(artistic|creative|unique|distinctive)/.test(lower)) visualElements.brandIdentity.push('artistic, creative')
  if (/(premium|quality|luxury|exclusive)/.test(lower)) visualElements.brandIdentity.push('premium, quality')

  return {
    mood: visualElements.mood.join(', ') || 'confident, contemporary',
    style: visualElements.style.join(', ') || 'modern, clean',
    graphics: visualElements.graphics.join(', ') || 'signature emblem',
    aesthetics: visualElements.aesthetics.join(', ') || 'high contrast, bold',
    layout: visualElements.layout.join(', ') || 'centered, balanced',
    brandIdentity: visualElements.brandIdentity.join(', ') || 'streetwear, urban'
  }
}

// 画像生成に特化した詳細プロンプトを生成
function generateImageSpecificPrompt(
  brandName: string,
  productType: string,
  brandConcept: string,
  targetAudience: string,
  gender: string,
  designElements: ReturnType<typeof extractDesignElementsFromDescription>,
  designStyle?: string,
  productIndex?: number // 商品インデックスを追加
): string {
  const genderContext = gender === 'Men' 
    ? 'masculine, bold, strong silhouette, tailored fit'
    : gender === 'Women'
    ? 'feminine, elegant, flattering silhouette, fitted cut'
    : 'unisex, versatile, inclusive silhouette, universal fit'

  // const styleContext = designStyle ? `Primary design approach: ${designStyle}` : ''

  // デザインの詳細説明を生成
  // const detailedDesignDescription = generateDesignElementsDescription(designElements, brandConcept, targetAudience)

  // ユニークネスを高めるためのランダム要素（より多様性を追加）
  const uniquenessElements = [
    'with unexpected visual twists and surprising elements',
    'featuring unconventional composition and bold layouts',
    'incorporating surprising design elements and unique patterns',
    'with innovative visual approaches and creative techniques',
    'featuring creative interpretation and artistic expression',
    'with distinctive artistic flair and original concepts',
    'incorporating unique visual metaphors and symbolic elements',
    'with original design concepts and fresh perspectives',
    'featuring experimental techniques and boundary-pushing aesthetics',
    'incorporating unexpected color combinations and visual contrasts',
    'with dynamic movement and energetic compositions',
    'featuring sophisticated details and refined craftsmanship',
    'incorporating raw authenticity and street-inspired elements',
    'with futuristic aesthetics and cutting-edge design',
    'featuring vintage influences and timeless appeal'
  ]
  const randomUniqueness = uniquenessElements[Math.floor(Math.random() * uniquenessElements.length)]

  // 商品インデックスに基づく追加のユニーク要素
  const indexBasedUniqueness = [
    'dynamic energy and movement',
    'sophisticated elegance and refinement',
    'raw authenticity and street edge',
    'innovative technology integration',
    'artistic expression and creativity',
    'minimalist precision and clarity',
    'bold statement and impact',
    'subtle sophistication and charm',
    'experimental boundary-pushing',
    'timeless classic appeal'
  ]
  
  const indexUniqueness = indexBasedUniqueness[(productIndex || 0) % indexBasedUniqueness.length]

  return `Create a unique, high-quality design for ${brandName} that embodies the brand concept: "${brandConcept}".

# Core Requirements
- Brand Concept: ${brandConcept}
- Target Audience: ${targetAudience}
- Gender: ${genderContext}
- Design Style: ${designStyle || 'creative and original'}

# Design Approach
- Think freely and creatively about what "${brandConcept}" means visually
- Create something completely original that hasn't been seen before
- Let your imagination run wild while staying true to the brand essence
- Avoid generic, common, or overused design patterns
- Make it distinctive and memorable
- ${randomUniqueness}
- Embody ${indexUniqueness}

# Technical Specs
- Output ONLY the design artwork (no garment, no background, no shadows)
- Clean, production-ready with transparent margins
- Use colors that work on any background
- High-quality, professional appearance

# Creative Freedom
- Don't follow any specific design rules or patterns
- Be experimental and unexpected
- Create visual metaphors that represent the brand concept
- Think outside conventional design boundaries
- Make it uniquely yours
- Incorporate the random element: ${randomUniqueness}
- Embody the character: ${indexUniqueness}

# Important Design Notes
- The brand name does NOT need to be included in the design
- Focus on visual concepts, patterns, and artistic elements
- Create a design that represents the brand's essence without text
- Let the visual design speak for itself

Negative: garment, T-shirt, fabric, mannequin, background, shadows, generic, common, overused, cliché, predictable, brand name, text, typography, words`
}

// デザイン要素の詳細説明を生成する関数
// function generateDesignElementsDescription(
//   designElements: ReturnType<typeof extractDesignElementsFromDescription>,
//   brandConcept: string,
//   targetAudience: string
// ): string {
//   const { mood, style, graphics, aesthetics, layout, brandIdentity } = designElements

//   // ムード・雰囲気の詳細説明
//   const moodDescription = generateMoodDescription(mood, brandConcept)
//   
//   // デザインスタイルの詳細説明
//   const styleDescription = generateStyleDescription(style, targetAudience)
//   
//   // グラフィック要素の詳細説明
//   const graphicsDescription = generateGraphicsDescription(graphics, brandIdentity)
//   
//   // 色・質感の詳細説明
//   const aestheticsDescription = generateAestheticsDescription(aesthetics, mood)
//   
//   // レイアウト・構成の詳細説明
//   const layoutDescription = generateLayoutDescription(layout, style)

//   return `
// ## Mood & Energy
// ${moodDescription}

// ## Design Style & Approach
// ${styleDescription}

// ## Graphic Elements & Visual Components
// ${graphicsDescription}

// ## Color Palette & Aesthetics
// ${aestheticsDescription}

// ## Layout & Composition
// ${layoutDescription}

// ## Brand Character Integration
// The design must authentically represent ${brandIdentity} while embodying the core concept: "${brandConcept}". Every visual element should speak directly to ${targetAudience} and create an immediate emotional connection that reflects the brand's unique voice and vision.`
// }

// ムード・雰囲気の詳細説明を生成
// function generateMoodDescription(mood: string, brandConcept: string): string {
//   const moodKeywords = mood.split(', ').filter(Boolean)
  
//   if (moodKeywords.includes('bold, high-impact')) {
//     return `Create a design with commanding presence and strong visual impact. Use bold, assertive elements that demand attention while maintaining sophistication. The design should feel powerful and confident, with strong contrast and dynamic energy that reflects "${brandConcept}". Incorporate elements that convey strength and determination.`
//   }
//   
//   if (moodKeywords.includes('clean, minimalist')) {
//     return `Design with elegant simplicity and refined restraint. Focus on essential elements with plenty of breathing room and negative space. Every line and shape should have purpose, creating a sophisticated and timeless aesthetic that embodies "${brandConcept}". Use subtle details and precise execution.`
//   }
//   
//   if (moodKeywords.includes('edgy, urban')) {
//     return `Create a design with raw, authentic street energy and urban grit. Incorporate distressed textures, bold typography, and dynamic compositions that reflect the underground culture. The design should feel rebellious and authentic, with elements that speak to street culture and "${brandConcept}".`
//   }
//   
//   if (moodKeywords.includes('elegant, sophisticated')) {
//     return `Design with refined elegance and sophisticated aesthetics. Use graceful curves, balanced proportions, and premium visual elements that convey luxury and quality. The design should feel polished and upscale, perfectly representing "${brandConcept}" with understated confidence.`
//   }
//   
//   if (moodKeywords.includes('vibrant, energetic')) {
//     return `Create a design bursting with life and dynamic energy. Use bright, saturated colors and dynamic compositions that convey movement and excitement. The design should feel alive and engaging, with elements that capture the youthful spirit and "${brandConcept}".`
//   }
//   
//   if (moodKeywords.includes('mysterious, nocturnal')) {
//     return `Design with dark, enigmatic energy and nocturnal atmosphere. Use deep contrasts, shadowy elements, and mysterious visual metaphors that evoke night-time adventures. The design should feel intriguing and alluring, embodying the secretive nature of "${brandConcept}".`
//   }
//   
//   return `Create a design that embodies ${mood} while authentically representing the brand concept: "${brandConcept}". The visual mood should immediately communicate the intended emotional response and brand personality.`
// }

// デザインスタイルの詳細説明を生成
// function generateStyleDescription(style: string, targetAudience: string): string {
//   const styleKeywords = style.split(', ').filter(Boolean)
  
//   if (styleKeywords.includes('geometric, structured')) {
//     return `Use precise geometric forms, clean lines, and structured compositions. Incorporate angular shapes, grid-based layouts, and mathematical precision. The design should feel organized and systematic, with elements that create visual harmony through geometric relationships. Perfect for ${targetAudience} who appreciate order and clarity.`
//   }
//   
//   if (styleKeywords.includes('organic, flowing')) {
//     return `Design with natural, flowing forms and organic shapes. Use curved lines, fluid compositions, and nature-inspired elements. The design should feel alive and dynamic, with elements that suggest growth and movement. Ideal for ${targetAudience} who value authenticity and natural beauty.`
//   }
//   
//   if (styleKeywords.includes('vintage, retro')) {
//     return `Create a design with nostalgic charm and retro aesthetics. Use classic typography, vintage color palettes, and period-appropriate visual elements. The design should feel timeless and familiar, with elements that evoke specific eras and cultural moments. Perfect for ${targetAudience} who appreciate heritage and tradition.`
//   }
//   
//   if (styleKeywords.includes('modern, contemporary')) {
//     return `Design with cutting-edge aesthetics and contemporary visual language. Use current design trends, innovative compositions, and forward-thinking elements. The design should feel fresh and relevant, with elements that speak to today's culture and ${targetAudience}'s modern sensibilities.`
//   }
//   
//   if (styleKeywords.includes('abstract, artistic')) {
//     return `Create a design with artistic expression and abstract visual language. Use non-representational forms, creative interpretations, and expressive elements. The design should feel like wearable art, with elements that encourage interpretation and emotional response from ${targetAudience}.`
//   }
//   
//   return `Design with ${style} approach, ensuring the visual style resonates with ${targetAudience} and creates an immediate visual impact that reflects the brand's unique character.`
// }

// グラフィック要素の詳細説明を生成
// function generateGraphicsDescription(graphics: string, brandIdentity: string): string {
//   const graphicsKeywords = graphics.split(', ').filter(Boolean)
  

// 色・質感の詳細説明を生成
// function generateAestheticsDescription(aesthetics: string, mood: string): string {
//   const aestheticsKeywords = aesthetics.split(', ').filter(Boolean)
  

// レイアウト・構成の詳細説明を生成
// function generateLayoutDescription(layout: string, style: string): string {
//   const layoutKeywords = layout.split(', ').filter(Boolean)
  

// ----------------------------
// Image generation (Design First → Apply to Products)
// 1. Generate design PNG first (uses brandConcept + productDescription)
// 2. Apply that design to each color variant
// ----------------------------

// Cloudinary 変換URLでプレーンTシャツにデザインを合成
async function compositeDesignOnTshirt(
  plainTshirtUrl: string, 
  designPngUrl: string, 
  outputName: string
): Promise<string> {
  try {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloud) throw new Error('Cloudinary cloud name not set')

    const designPublicId = getPublicIdFromUrl(designPngUrl)
    const basePublicId = getPublicIdFromUrl(plainTshirtUrl)

    if (!designPublicId || !basePublicId) {
      throw new Error(`Failed to parse public_id. design=${designPublicId}, base=${basePublicId}`)
    }

    // デザインを相対 33% で中央より僅かに上に配置
    // 注: l_<public_id> は同一Cloudアカウントのアセットを参照
    const compositeUrl =
      `https://res.cloudinary.com/${cloud}/image/upload` +
      `/w_800,h_800,c_fit` + // 出力サイズを小さくして処理を軽量化
      `/l_${encodeURIComponent(designPublicId)},fl_relative,w_0.33,h_0.33,y_-0.05,g_center` + // オーバーレイ
      `/${encodeURIComponent(basePublicId)}`

    // 変換URLを直接返す（再アップロードを避けてタイムアウトを防ぐ）
    console.log(`[Composite] Generated composite URL: ${compositeUrl}`)
    return compositeUrl
  } catch (error) {
    console.error('Error compositing images:', error)
    // エラー時はプレーンTシャツを返す
    console.log(`[Composite] Using plain t-shirt as fallback: ${plainTshirtUrl}`)
    return plainTshirtUrl
  }
}

async function generateProductImages(
  brandName: string,
  productName: string,
  productType: string,
  colors: string[],
  brandDescription: string,
  brandConcept: string,
  targetAudience: string,
  gender: string,
  productDescription: string,          // ★ 新商品の説明文を追加
  designStyle?: string,
  productIndex?: number // 商品インデックスを追加
): Promise<{ productImages: string[]; designPng: string }> {
  const productImages: string[] = []
  let designPng = ''

  // 商品説明文からデザイン・ビジュアル要素を抽出（SEO要素を除外）
  const designElements = extractDesignElementsFromDescription(productDescription)
  
  // 画像生成に特化した詳細プロンプトを生成
  const designPngPrompt = generateImageSpecificPrompt(
    brandName,
    productType,
    brandConcept,
    targetAudience,
    gender,
    designElements,
    designStyle,
    productIndex
  )

  console.log(`[DesignPNG] Generating design for ${productName}...`)
  try {
    const designRes = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: designPngPrompt,
      size: '1024x1024',
      quality: 'low',
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
    
    console.log(`[DesignPNG] Generated common design for all colors: ${designPng}`)
  } catch (err) {
    console.error('[DesignPNG]', JSON.stringify(err, null, 2))
    // デザインPNGが作れない場合は以下でプレーン画像を採用
  }

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

  for (const color of colors) {
    const plainTshirtUrl = plainTshirtUrls[color]
    if (!plainTshirtUrl) {
      console.error(`[PlainTshirt:${color}] No plain t-shirt image found for color: ${color}`)
      continue
    }

    console.log(`[PlainTshirt:${color}] Using pre-made plain ${color} t-shirt: ${plainTshirtUrl}`)

    if (designPng) {
      console.log(`[Composite:${color}] Compositing design onto ${color} t-shirt...`)
      try {
        // タイムアウトを設定して合成処理を実行
        const compositeUrl = await Promise.race([
          compositeDesignOnTshirt(plainTshirtUrl, designPng, `${productName}-${color}`),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Composite timeout')), 30000) // 30秒タイムアウト
          )
        ])
        productImages.push(compositeUrl)
        console.log(`[Composite:${color}] Design composited: ${compositeUrl}`)
      } catch (err) {
        console.error(`[Composite:${color}] Composite failed, using plain t-shirt:`, err instanceof Error ? err.message : 'Unknown error')
        productImages.push(plainTshirtUrl)
        console.log(`[Composite:${color}] Using plain t-shirt: ${plainTshirtUrl}`)
      }
    } else {
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
    const { brandId, productType, colors, gender, quantity } = await request.json()

    if (!brandId || !productType || !colors || !Array.isArray(colors) || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // ブランド情報取得
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
    const usedProductNames: string[] = []
    // デザインスタイルの事前定義を削除 - ブランドコンセプトに基づいて自由に発想

     for (let i = 0; i < quantity; i++) {
       try {
         console.log(`[Product ${i + 1}/${quantity}] Starting generation...`)
         
         const productGender = gender || 'Unisex'
         console.log(`[Product ${i + 1}] Gender determined: ${productGender}`)

        // 先に詳細デザイン説明文を生成（画像生成用）
        console.log(`[Product ${i + 1}] Generating detailed design description...`)
        const designDescription = await generateDetailedDesignDescription(
          brand.name,
          'Temporary Product Name', // 後で実名に更新
          productType,
          colors,
          productGender,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Fashion-forward individuals',
          i // 商品インデックスを追加
        )
        console.log(`[Product ${i + 1}] Design description length: ${designDescription.length} characters`)

        // デザインスタイルを事前定義せず、ブランドコンセプトに基づいて自由に発想

        // 次に商品名（詳細デザイン説明文ベース、重複回避）
        console.log(`[Product ${i + 1}] Generating product name from design description...`)
        const productName = await generateProductNameFromDescription(
          brand.name,
          productType,
          designDescription,
          undefined, // デザイン要素抽出を削除
          undefined, // デザインスタイルを事前定義しない
          productGender,
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          usedProductNames
        )
        console.log(`[Product ${i + 1}] Product name: ${productName}`)

        // 使用済み商品名に追加
        usedProductNames.push(productName)

        // 価格ロジック
         const price = productGender === 'Women' 
           ? 39.90 
           : productType.toLowerCase().includes('t-shirt') 
             ? generateRandomPrice() 
             : 35
        
        // SEO用の商品説明文を生成（商品ページ表示用）
        console.log(`[Product ${i + 1}] Generating SEO product description...`)
        const seoDescription = await generateProductDescription(
          brand.name,
          productName,
          productType,
          colors,
          productGender,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Fashion-forward individuals'
        )
        console.log(`[Product ${i + 1}] SEO description length: ${seoDescription.length} characters`)

        console.log(`[Product ${i + 1}] Generating images...`)

        // ★ 画像生成（詳細デザイン説明文を使用）
        const { productImages, designPng } = await generateProductImages(
          brand.name,
          productName,
          productType,
          colors,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics', // brandConcept
          brand.target_audience || 'Fashion-forward individuals',
          productGender,
          designDescription, // ← 詳細デザイン説明文を渡す
          undefined, // デザインスタイルを事前定義しない
          i // 商品インデックスを追加
        )

        console.log(`[Product ${i + 1}] Generated ${productImages.length} product images, design PNG: ${designPng ? 'Yes' : 'No'}`)

        console.log(`[Product ${i + 1}] Saving to database...`)
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: productName,
            description: seoDescription, // SEO用の商品説明文
            design_description: designDescription, // 詳細デザイン説明文
            price,
            brand_id: brandId,
            category: 'Clothing',
            type: productType,
            colors,
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
            gender: productGender,
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
