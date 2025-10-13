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
  designElements: ReturnType<typeof extractDesignElementsFromDescription>,
  designStyle: string,
  gender: string,
  brandConcept: string,
  usedNames: string[] = []
): Promise<string> {
  // デザイン要素から商品名のキーワードを抽出
  const nameKeywords = extractNameKeywordsFromDesignElements(designElements, designStyle)
  
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
Mood & Energy: ${designElements.mood}
Design Style: ${designElements.style}
Graphic Elements: ${designElements.graphics}
Aesthetics: ${designElements.aesthetics}
Layout: ${designElements.layout}
Selected Design Style: ${designStyle}

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

# Examples based on design elements (3-5 words):
- Bold/High-impact: "Strike Force Core", "Impact Bold Edge", "Power Strike Force"
- Clean/Minimalist: "Pure Essential Line", "Clean Minimal Form", "Essential Pure Core"
- Urban/Street: "Urban Street Code", "City Grid Pulse", "Street Urban Force"
- Elegant/Sophisticated: "Refined Grace Flow", "Elegant Sophisticated Edge", "Grace Refined Core"
- Vibrant/Energetic: "Energy Burst Core", "Vibrant Dynamic Flow", "Dynamic Energy Pulse"

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
function extractNameKeywordsFromDesignElements(
  designElements: ReturnType<typeof extractDesignElementsFromDescription>,
  designStyle: string
): string {
  const keywords: string[] = []
  
  // ムードからキーワードを抽出
  if (designElements.mood.includes('bold')) keywords.push('strike', 'impact', 'force', 'edge')
  if (designElements.mood.includes('clean')) keywords.push('pure', 'essential', 'core', 'line')
  if (designElements.mood.includes('edgy')) keywords.push('raw', 'grit', 'street', 'urban')
  if (designElements.mood.includes('elegant')) keywords.push('grace', 'refined', 'sophisticated', 'flow')
  if (designElements.mood.includes('vibrant')) keywords.push('energy', 'dynamic', 'burst', 'pulse')
  if (designElements.mood.includes('mysterious')) keywords.push('shadow', 'nocturnal', 'enigma', 'dark')
  
  // スタイルからキーワードを抽出
  if (designElements.style.includes('geometric')) keywords.push('grid', 'form', 'structure', 'angle')
  if (designElements.style.includes('organic')) keywords.push('flow', 'natural', 'curve', 'wave')
  if (designElements.style.includes('vintage')) keywords.push('classic', 'heritage', 'timeless', 'retro')
  if (designElements.style.includes('modern')) keywords.push('future', 'edge', 'cutting', 'new')
  if (designElements.style.includes('abstract')) keywords.push('art', 'creative', 'vision', 'concept')
  
  // グラフィック要素からキーワードを抽出
  if (designElements.graphics.includes('typography')) keywords.push('type', 'letter', 'word', 'text')
  if (designElements.graphics.includes('logo')) keywords.push('mark', 'symbol', 'emblem', 'sign')
  if (designElements.graphics.includes('pattern')) keywords.push('rhythm', 'repeat', 'motif', 'design')
  if (designElements.graphics.includes('illustration')) keywords.push('art', 'drawing', 'sketch', 'visual')
  if (designElements.graphics.includes('geometric')) keywords.push('shape', 'form', 'structure', 'angle')
  
  // 美学からキーワードを抽出
  if (designElements.aesthetics.includes('monochrome')) keywords.push('contrast', 'bold', 'stark', 'pure')
  if (designElements.aesthetics.includes('colorful')) keywords.push('vibrant', 'bright', 'color', 'hue')
  if (designElements.aesthetics.includes('muted')) keywords.push('subtle', 'soft', 'refined', 'gentle')
  if (designElements.aesthetics.includes('textured')) keywords.push('grit', 'raw', 'distressed', 'aged')
  
  // レイアウトからキーワードを抽出
  if (designElements.layout.includes('centered')) keywords.push('focus', 'core', 'center', 'hub')
  if (designElements.layout.includes('asymmetric')) keywords.push('dynamic', 'flow', 'movement', 'energy')
  if (designElements.layout.includes('balanced')) keywords.push('harmony', 'balance', 'equilibrium', 'zen')
  if (designElements.layout.includes('negative space')) keywords.push('breath', 'space', 'minimal', 'clean')
  
  // デザインスタイルからキーワードを抽出
  if (designStyle.includes('minimalist')) keywords.push('minimal', 'essential', 'pure', 'clean')
  if (designStyle.includes('bold')) keywords.push('strike', 'impact', 'force', 'power')
  if (designStyle.includes('abstract')) keywords.push('art', 'creative', 'vision', 'concept')
  if (designStyle.includes('vintage')) keywords.push('classic', 'heritage', 'timeless', 'retro')
  if (designStyle.includes('urban')) keywords.push('street', 'city', 'urban', 'grit')
  if (designStyle.includes('nature')) keywords.push('organic', 'natural', 'flow', 'earth')
  if (designStyle.includes('architectural')) keywords.push('structure', 'form', 'blueprint', 'design')
  if (designStyle.includes('pop')) keywords.push('vibrant', 'colorful', 'energy', 'dynamic')
  if (designStyle.includes('monochrome')) keywords.push('contrast', 'bold', 'stark', 'pure')
  if (designStyle.includes('cultural')) keywords.push('heritage', 'traditional', 'ethnic', 'cultural')
  if (designStyle.includes('industrial')) keywords.push('mechanical', 'technical', 'engineering', 'precision')
  if (designStyle.includes('psychedelic')) keywords.push('trippy', 'experimental', 'mind-bending', 'surreal')
  if (designStyle.includes('elegant')) keywords.push('sophisticated', 'refined', 'grace', 'luxury')
  if (designStyle.includes('grunge')) keywords.push('raw', 'distressed', 'authentic', 'underground')
  if (designStyle.includes('futuristic')) keywords.push('future', 'sci-fi', 'cyber', 'digital')
  if (designStyle.includes('hand-drawn')) keywords.push('sketch', 'artistic', 'drawn', 'illustration')
  if (designStyle.includes('collage')) keywords.push('layered', 'mixed', 'assemblage', 'composite')
  if (designStyle.includes('neon')) keywords.push('glow', 'luminous', 'electric', 'radiant')
  if (designStyle.includes('watercolor')) keywords.push('painted', 'brush', 'artistic', 'fluid')
  if (designStyle.includes('origami')) keywords.push('folded', 'dimensional', 'paper', 'craft')
  if (designStyle.includes('mandala')) keywords.push('sacred', 'spiritual', 'meditative', 'zen')
  
  // 重複を除去して上位10個を返す
  const uniqueKeywords = [...new Set(keywords)].slice(0, 10)
  
  return `Key design keywords: ${uniqueKeywords.join(', ')}`
}

// フォールバック商品名生成（3-5文字、重複回避）
function generateFallbackProductName(
  designElements: ReturnType<typeof extractDesignElementsFromDescription>,
  designStyle: string,
  productType: string,
  usedNames: string[] = []
): string {
  const styleWords = designStyle.split(' ').slice(0, 2)
  const moodWords = designElements.mood.split(', ')[0].split(' ').slice(0, 2)
  const graphicsWords = designElements.graphics.split(', ')[0].split(' ').slice(0, 1)
  
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

// 商品説明（ブランド公式・デザイン重視・SEO配慮・素材NG）
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
  designStyle?: string
): string {
  const genderContext = gender === 'Men' 
    ? 'masculine, bold, strong silhouette, tailored fit'
    : gender === 'Women'
    ? 'feminine, elegant, flattering silhouette, fitted cut'
    : 'unisex, versatile, inclusive silhouette, universal fit'

  const styleContext = designStyle ? `Primary design approach: ${designStyle}` : ''

  // デザインの詳細説明を生成
  const detailedDesignDescription = generateDetailedDesignDescription(designElements, brandConcept, targetAudience)

  // ユニークネスを高めるためのランダム要素
  const uniquenessElements = [
    'with unexpected visual twists',
    'featuring unconventional composition',
    'incorporating surprising design elements',
    'with innovative visual approaches',
    'featuring creative interpretation',
    'with distinctive artistic flair',
    'incorporating unique visual metaphors',
    'with original design concepts'
  ]
  const randomUniqueness = uniquenessElements[Math.floor(Math.random() * uniquenessElements.length)]

  return `Create a high-quality, production-ready design for a ${productType} from ${brandName}.

# Brand Foundation (must be honored)
Brand Identity: ${brandName}
Core Brand Concept: ${brandConcept}
Target Audience: ${targetAudience}
Gender Context: ${genderContext}
${styleContext}

# Detailed Visual Design Specifications
${detailedDesignDescription}

# Uniqueness & Diversity Requirements
- Create a design that is completely unique and has never been seen before
- ${randomUniqueness}
- Avoid common design clichés and overused visual elements
- Incorporate unexpected design choices that surprise and delight
- Use creative interpretation of the design brief
- Create visual elements that are distinctive and memorable
- Ensure this design stands out from all other similar products

# Technical Requirements
- Output ONLY the printed design (no garment, no mockup, no shadows, no textures)
- Preserve artwork precisely: same shapes, proportions, line weights, and colors
- Use neutral colors (black, white, or brand colors) that work well on any background color
- Edges clean and production-ready with comfortable transparent margin around the design
- The design should look realistic and natural, reflecting high-quality aesthetic of top-selling brands
- Make this design unique and distinct from other similar products
- Ensure visual variety and avoid repetitive patterns
- Including the brand name in the design is not required

# Brand-Specific Design Elements
- Draw inspiration from the brand's core concept: ${brandConcept}
- Create visual metaphors that represent the brand's philosophy
- Use design language that appeals specifically to ${targetAudience}
- Incorporate elements that reflect the brand's character
- Make the design feel authentic to ${brandName}'s unique voice and vision

# Creative Constraints for Uniqueness
- Avoid generic geometric patterns that are commonly used
- Create original visual compositions that haven't been seen before
- Use unexpected color combinations or design approaches
- Incorporate creative elements that make this design truly distinctive
- Think outside the box while staying true to the brand concept

Negative prompt: garment, T-shirt, fabric, mannequin, hanger, props, background, shadows, reflections, text overlay, watermark, CGI, 3D render, illustration, generic, common, overused, cliché`
}

// デザインの詳細説明を生成する関数
function generateDetailedDesignDescription(
  designElements: ReturnType<typeof extractDesignElementsFromDescription>,
  brandConcept: string,
  targetAudience: string
): string {
  const { mood, style, graphics, aesthetics, layout, brandIdentity } = designElements

  // ムード・雰囲気の詳細説明
  const moodDescription = generateMoodDescription(mood, brandConcept)
  
  // デザインスタイルの詳細説明
  const styleDescription = generateStyleDescription(style, targetAudience)
  
  // グラフィック要素の詳細説明
  const graphicsDescription = generateGraphicsDescription(graphics, brandIdentity)
  
  // 色・質感の詳細説明
  const aestheticsDescription = generateAestheticsDescription(aesthetics, mood)
  
  // レイアウト・構成の詳細説明
  const layoutDescription = generateLayoutDescription(layout, style)

  return `
## Mood & Energy
${moodDescription}

## Design Style & Approach
${styleDescription}

## Graphic Elements & Visual Components
${graphicsDescription}

## Color Palette & Aesthetics
${aestheticsDescription}

## Layout & Composition
${layoutDescription}

## Brand Character Integration
The design must authentically represent ${brandIdentity} while embodying the core concept: "${brandConcept}". Every visual element should speak directly to ${targetAudience} and create an immediate emotional connection that reflects the brand's unique voice and vision.`
}

// ムード・雰囲気の詳細説明を生成
function generateMoodDescription(mood: string, brandConcept: string): string {
  const moodKeywords = mood.split(', ').filter(Boolean)
  
  if (moodKeywords.includes('bold, high-impact')) {
    return `Create a design with commanding presence and strong visual impact. Use bold, assertive elements that demand attention while maintaining sophistication. The design should feel powerful and confident, with strong contrast and dynamic energy that reflects "${brandConcept}". Incorporate elements that convey strength and determination.`
  }
  
  if (moodKeywords.includes('clean, minimalist')) {
    return `Design with elegant simplicity and refined restraint. Focus on essential elements with plenty of breathing room and negative space. Every line and shape should have purpose, creating a sophisticated and timeless aesthetic that embodies "${brandConcept}". Use subtle details and precise execution.`
  }
  
  if (moodKeywords.includes('edgy, urban')) {
    return `Create a design with raw, authentic street energy and urban grit. Incorporate distressed textures, bold typography, and dynamic compositions that reflect the underground culture. The design should feel rebellious and authentic, with elements that speak to street culture and "${brandConcept}".`
  }
  
  if (moodKeywords.includes('elegant, sophisticated')) {
    return `Design with refined elegance and sophisticated aesthetics. Use graceful curves, balanced proportions, and premium visual elements that convey luxury and quality. The design should feel polished and upscale, perfectly representing "${brandConcept}" with understated confidence.`
  }
  
  if (moodKeywords.includes('vibrant, energetic')) {
    return `Create a design bursting with life and dynamic energy. Use bright, saturated colors and dynamic compositions that convey movement and excitement. The design should feel alive and engaging, with elements that capture the youthful spirit and "${brandConcept}".`
  }
  
  if (moodKeywords.includes('mysterious, nocturnal')) {
    return `Design with dark, enigmatic energy and nocturnal atmosphere. Use deep contrasts, shadowy elements, and mysterious visual metaphors that evoke night-time adventures. The design should feel intriguing and alluring, embodying the secretive nature of "${brandConcept}".`
  }
  
  return `Create a design that embodies ${mood} while authentically representing the brand concept: "${brandConcept}". The visual mood should immediately communicate the intended emotional response and brand personality.`
}

// デザインスタイルの詳細説明を生成
function generateStyleDescription(style: string, targetAudience: string): string {
  const styleKeywords = style.split(', ').filter(Boolean)
  
  if (styleKeywords.includes('geometric, structured')) {
    return `Use precise geometric forms, clean lines, and structured compositions. Incorporate angular shapes, grid-based layouts, and mathematical precision. The design should feel organized and systematic, with elements that create visual harmony through geometric relationships. Perfect for ${targetAudience} who appreciate order and clarity.`
  }
  
  if (styleKeywords.includes('organic, flowing')) {
    return `Design with natural, flowing forms and organic shapes. Use curved lines, fluid compositions, and nature-inspired elements. The design should feel alive and dynamic, with elements that suggest growth and movement. Ideal for ${targetAudience} who value authenticity and natural beauty.`
  }
  
  if (styleKeywords.includes('vintage, retro')) {
    return `Create a design with nostalgic charm and retro aesthetics. Use classic typography, vintage color palettes, and period-appropriate visual elements. The design should feel timeless and familiar, with elements that evoke specific eras and cultural moments. Perfect for ${targetAudience} who appreciate heritage and tradition.`
  }
  
  if (styleKeywords.includes('modern, contemporary')) {
    return `Design with cutting-edge aesthetics and contemporary visual language. Use current design trends, innovative compositions, and forward-thinking elements. The design should feel fresh and relevant, with elements that speak to today's culture and ${targetAudience}'s modern sensibilities.`
  }
  
  if (styleKeywords.includes('abstract, artistic')) {
    return `Create a design with artistic expression and abstract visual language. Use non-representational forms, creative interpretations, and expressive elements. The design should feel like wearable art, with elements that encourage interpretation and emotional response from ${targetAudience}.`
  }
  
  return `Design with ${style} approach, ensuring the visual style resonates with ${targetAudience} and creates an immediate visual impact that reflects the brand's unique character.`
}

// グラフィック要素の詳細説明を生成
function generateGraphicsDescription(graphics: string, brandIdentity: string): string {
  const graphicsKeywords = graphics.split(', ').filter(Boolean)
  
  if (graphicsKeywords.includes('typography, lettering')) {
    return `Incorporate sophisticated typography and custom lettering that becomes the primary design element. Use carefully selected fonts, custom letterforms, or hand-drawn text that reflects ${brandIdentity}. The typography should be legible yet artistic, with proper spacing and hierarchy that creates visual impact.`
  }
  
  if (graphicsKeywords.includes('logo, emblem')) {
    return `Feature a distinctive logo or emblem as the central design element. Create a memorable symbol that represents the brand's identity and ${brandIdentity}. The logo should be scalable, recognizable, and work effectively at various sizes. Consider incorporating subtle details that reward closer inspection.`
  }
  
  if (graphicsKeywords.includes('pattern, motif')) {
    return `Develop a repeating pattern or distinctive motif that creates visual rhythm and brand recognition. The pattern should be carefully balanced, not overwhelming, and work well across different garment colors. Consider how the motif relates to ${brandIdentity} and creates a cohesive brand experience.`
  }
  
  if (graphicsKeywords.includes('illustration, artwork')) {
    return `Create original artwork or illustration that tells a visual story. The artwork should be detailed enough to be interesting but simple enough to work as a garment print. Consider how the illustration relates to ${brandIdentity} and creates an emotional connection with the wearer.`
  }
  
  if (graphicsKeywords.includes('geometric shapes')) {
    return `Use geometric shapes and forms to create a structured, modern design. Combine different shapes, sizes, and orientations to create visual interest. The geometric elements should work together harmoniously and reflect the brand's ${brandIdentity} through their arrangement and relationships.`
  }
  
  return `Incorporate ${graphics} elements that authentically represent ${brandIdentity} and create a distinctive visual identity that sets the brand apart from competitors.`
}

// 色・質感の詳細説明を生成
function generateAestheticsDescription(aesthetics: string, mood: string): string {
  const aestheticsKeywords = aesthetics.split(', ').filter(Boolean)
  
  if (aestheticsKeywords.includes('monochrome, high contrast')) {
    return `Use a monochrome color palette with strong contrast between light and dark elements. Create visual impact through contrast rather than color, ensuring the design works effectively in black and white. The high contrast should enhance the ${mood} mood and create a bold, striking appearance.`
  }
  
  if (aestheticsKeywords.includes('colorful, vibrant')) {
    return `Employ a vibrant, colorful palette that creates energy and excitement. Use saturated colors that work well together and create visual harmony. The colors should enhance the ${mood} mood and create an optimistic, lively feeling that draws attention and creates positive associations.`
  }
  
  if (aestheticsKeywords.includes('muted, subtle')) {
    return `Use a refined, muted color palette with subtle variations and sophisticated tones. Create depth through color relationships rather than high contrast. The subtle colors should enhance the ${mood} mood and create an understated, elegant appearance that appeals to sophisticated tastes.`
  }
  
  if (aestheticsKeywords.includes('textured, distressed')) {
    return `Incorporate textured elements and distressed effects that add character and authenticity. Use visual textures that suggest wear, age, or artistic treatment. The textures should enhance the ${mood} mood and create a sense of history, authenticity, and artistic value.`
  }
  
  return `Create a color and aesthetic approach that uses ${aesthetics} to enhance the ${mood} mood and create a distinctive visual character that reflects the brand's unique identity.`
}

// レイアウト・構成の詳細説明を生成
function generateLayoutDescription(layout: string, style: string): string {
  const layoutKeywords = layout.split(', ').filter(Boolean)
  
  if (layoutKeywords.includes('centered, focal point')) {
    return `Create a centered composition with a strong focal point that draws immediate attention. Use symmetrical balance and clear hierarchy to guide the viewer's eye. The centered approach should work with the ${style} style to create a commanding presence and professional appearance.`
  }
  
  if (layoutKeywords.includes('asymmetric, dynamic')) {
    return `Design with asymmetric balance and dynamic composition that creates visual tension and movement. Use off-center elements and diagonal lines to create energy and interest. The asymmetric approach should enhance the ${style} style and create a modern, engaging appearance.`
  }
  
  if (layoutKeywords.includes('balanced, symmetrical')) {
    return `Create a balanced, symmetrical composition that feels stable and harmonious. Use equal visual weight on both sides and clear geometric relationships. The balanced approach should complement the ${style} style and create a sense of order and professionalism.`
  }
  
  if (layoutKeywords.includes('negative space, breathing room')) {
    return `Use generous negative space and breathing room to create a clean, uncluttered appearance. Allow the design to breathe and focus attention on key elements. The spacious approach should enhance the ${style} style and create a sophisticated, minimalist aesthetic.`
  }
  
  return `Create a layout that uses ${layout} principles to enhance the ${style} style and create a composition that effectively communicates the brand's message and visual identity.`
}

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
      `/w_1024,h_1024,c_fit` + // 出力の枠
      `/l_${encodeURIComponent(designPublicId)},fl_relative,w_0.33,h_0.33,y_-0.05,g_center` + // オーバーレイ
      `/${encodeURIComponent(basePublicId)}`

    // 変換URLを再アップロードして確定URLに
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
  brandConcept: string,
  targetAudience: string,
  gender: string,
  productDescription: string,          // ★ 新商品の説明文を追加
  designStyle?: string
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
    designStyle
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
        const compositeUrl = await compositeDesignOnTshirt(plainTshirtUrl, designPng, `${productName}-${color}`)
        productImages.push(compositeUrl)
        console.log(`[Composite:${color}] Design composited: ${compositeUrl}`)
      } catch (err) {
        console.error(`[Composite:${color}]`, JSON.stringify(err, null, 2))
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
    const designStyles = [
      // Minimalist & Clean
      'minimalist geometric patterns',
      'clean typography and lettering',
      'monochrome artistic compositions',
      'negative space focused designs',
      'ultra-minimalist line work',
      
      // Bold & Impact
      'bold typography and lettering',
      'high-contrast graphic elements',
      'striking geometric compositions',
      'powerful visual statements',
      'commanding presence designs',
      
      // Abstract & Artistic
      'abstract artistic illustrations',
      'surreal visual compositions',
      'non-representational art forms',
      'conceptual visual metaphors',
      'experimental artistic expressions',
      
      // Vintage & Retro
      'vintage retro graphics',
      'classic typography styles',
      'nostalgic design elements',
      'heritage-inspired motifs',
      'timeless aesthetic compositions',
      
      // Modern & Contemporary
      'modern line art and silhouettes',
      'contemporary graphic design',
      'cutting-edge visual elements',
      'futuristic design concepts',
      'innovative visual approaches',
      
      // Urban & Street
      'urban street art elements',
      'graffiti-inspired graphics',
      'underground culture motifs',
      'raw street aesthetics',
      'rebellious visual language',
      
      // Nature & Organic
      'nature-inspired organic shapes',
      'botanical design elements',
      'organic flowing compositions',
      'natural texture patterns',
      'earth-inspired visual themes',
      
      // Architectural & Structural
      'architectural and structural designs',
      'geometric precision patterns',
      'engineering-inspired graphics',
      'structural composition elements',
      'blueprint-style designs',
      
      // Pop & Vibrant
      'pop art and vibrant graphics',
      'colorful geometric patterns',
      'energetic visual compositions',
      'playful design elements',
      'dynamic color interactions',
      
      // Monochrome & Artistic
      'monochrome artistic compositions',
      'black and white photography style',
      'grayscale artistic elements',
      'high-contrast monochrome',
      'artistic shadow play',
      
      // Cultural & Ethnic
      'cultural pattern motifs',
      'ethnic design elements',
      'traditional art influences',
      'heritage visual symbols',
      'cultural identity graphics',
      
      // Industrial & Technical
      'industrial design aesthetics',
      'mechanical element graphics',
      'technical drawing styles',
      'engineering blueprint aesthetics',
      'industrial texture patterns',
      
      // Psychedelic & Experimental
      'psychedelic visual elements',
      'experimental color combinations',
      'trippy visual effects',
      'mind-bending compositions',
      'hallucinatory design patterns',
      
      // Elegant & Sophisticated
      'elegant sophisticated designs',
      'luxury brand aesthetics',
      'refined visual elements',
      'premium design language',
      'upscale artistic compositions',
      
      // Grunge & Distressed
      'grunge aesthetic elements',
      'distressed texture graphics',
      'worn vintage appearances',
      'raw authentic visuals',
      'underground culture aesthetics',
      
      // Futuristic & Sci-Fi
      'futuristic design concepts',
      'sci-fi inspired graphics',
      'cyberpunk visual elements',
      'digital age aesthetics',
      'technological design motifs',
      
      // Hand-drawn & Sketch
      'hand-drawn sketch styles',
      'artistic pencil work',
      'illustration-based designs',
      'sketchy artistic elements',
      'drawn art aesthetics',
      
      // Collage & Mixed Media
      'collage-style compositions',
      'mixed media elements',
      'layered visual designs',
      'assemblage art aesthetics',
      'multi-texture compositions',
      
      // Neon & Glow
      'neon glow effects',
      'luminous design elements',
      'glowing visual components',
      'electric color schemes',
      'radiant light aesthetics',
      
      // Watercolor & Paint
      'watercolor artistic styles',
      'painted design elements',
      'brush stroke aesthetics',
      'artistic paint effects',
      'painterly visual compositions',
      
      // Origami & Paper
      'origami-inspired designs',
      'paper craft aesthetics',
      'folded geometric patterns',
      'paper texture elements',
      'dimensional paper art',
      
      // Mandala & Sacred
      'mandala pattern designs',
      'sacred geometry elements',
      'spiritual visual symbols',
      'meditative compositions',
      'zen-inspired aesthetics'
    ]
    const usedStyles: string[] = []

     for (let i = 0; i < quantity; i++) {
       try {
         console.log(`[Product ${i + 1}/${quantity}] Starting generation...`)
         
         const productGender = gender || 'Unisex'
         console.log(`[Product ${i + 1}] Gender determined: ${productGender}`)

        // 先に説明文（コピー）を生成
        console.log(`[Product ${i + 1}] Generating description...`)
        const description = await generateProductDescription(
          brand.name,
          'Temporary Product Name', // 後で実名に更新
          productType,
          colors,
          productGender,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics',
          brand.target_audience || 'Fashion-forward individuals'
        )
        console.log(`[Product ${i + 1}] Description length: ${description.length} characters`)

        // デザインスタイル（重複完全回避システム）
        let selectedStyle: string
        
        // 未使用のスタイルから選択
        const availableStyles = designStyles.filter(style => !usedStyles.includes(style))
        
        if (availableStyles.length > 0) {
          // 未使用のスタイルからランダムに選択
          selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)]
          console.log(`[Product ${i + 1}] Available styles: ${availableStyles.length}, Selected: ${selectedStyle}`)
        } else {
          // 全て使用済みの場合は、ランダムに再選択
          selectedStyle = designStyles[Math.floor(Math.random() * designStyles.length)]
          console.log(`[Product ${i + 1}] All styles used, randomly selecting: ${selectedStyle}`)
        }
        
        usedStyles.push(selectedStyle)

        // 商品説明文からデザイン要素を抽出
        const designElements = extractDesignElementsFromDescription(description)
        
        // 次に商品名（商品説明文ベース、重複回避）
        console.log(`[Product ${i + 1}] Generating product name from description...`)
        const productName = await generateProductNameFromDescription(
          brand.name,
          productType,
          description,
          designElements,
          selectedStyle,
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
        
        console.log(`[Product ${i + 1}] Selected design style: ${selectedStyle}`)
        console.log(`[Product ${i + 1}] Generating images...`)

        // ★ 画像生成（ブランド + 新商品説明文）に統一
        const { productImages, designPng } = await generateProductImages(
          brand.name,
          productName,
          productType,
          colors,
          brand.description || 'A unique streetwear brand',
          brand.design_concept || 'Bold, edgy design with urban aesthetics', // brandConcept
          brand.target_audience || 'Fashion-forward individuals',
          productGender,
          description, // ← 新商品説明文を渡す
          selectedStyle
        )

        console.log(`[Product ${i + 1}] Generated ${productImages.length} product images, design PNG: ${designPng ? 'Yes' : 'No'}`)

        console.log(`[Product ${i + 1}] Saving to database...`)
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
