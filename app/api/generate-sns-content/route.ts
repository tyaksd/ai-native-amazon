import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getBrandById } from '@/lib/data'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform } = await request.json()
    
    if (!brandId) {
      return NextResponse.json({
        success: false,
        error: 'Brand ID is required'
      }, { status: 400 })
    }

    // Get brand information
    const brand = await getBrandById(brandId)
    if (!brand) {
      return NextResponse.json({
        success: false,
        error: 'Brand not found'
      }, { status: 404 })
    }

    // Generate platform-specific content
    const content = await generatePlatformContent(brand, platform)
    
    return NextResponse.json({
      success: true,
      content,
      brand: {
        id: brand.id,
        name: brand.name,
        description: brand.description,
        category: brand.category
      }
    })
    
  } catch (error) {
    console.error('SNS content generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generatePlatformContent(brand: { id: string; name: string; description: string | null; category: string | null; design_concept: string | null; target_audience: string | null }, platform: 'instagram' | 'x' | 'tiktok' | 'all'): Promise<{instagram?: string, x?: string, tiktok?: string}> {
  const result: {instagram?: string, x?: string, tiktok?: string} = {}
  
  if (platform === 'instagram' || platform === 'all') {
    result.instagram = await generateInstagramContent(brand)
  }
  
  if (platform === 'x' || platform === 'all') {
    result.x = await generateXContent(brand)
  }
  
  if (platform === 'tiktok' || platform === 'all') {
    result.tiktok = await generateTikTokContent(brand)
  }
  
  return result
}

async function generateInstagramContent(brand: { id: string; name: string; description: string | null; category: string | null; design_concept: string | null; target_audience: string | null }): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a social media marketing expert specializing in short-form video content for Instagram Reels and TikTok. Create VERY SHORT, punchy captions optimized for both platforms that drive engagement and brand awareness. Focus on driving traffic to the godship.io e-commerce store. Do NOT use emojis. IMPORTANT: Keep captions under 500 characters for better engagement.'
    },
    {
      role: 'user',
      content: `Create a VERY SHORT caption for the brand "${brand.name}" that works for both Instagram Reels and TikTok.

Brand Information:
- Name: ${brand.name}
- Description: ${brand.description || 'A unique fashion brand'}
- Category: ${brand.category || 'Fashion'}

Requirements:
- Write for short-form video content (Instagram Reels and TikTok compatible)
- Include 3-5 relevant hashtags maximum
- NO EMOJIS - keep it clean and professional
- Focus on viral potential and engagement
- Be extremely concise and punchy
- Include a call-to-action to visit godship.io
- Make it feel authentic and engaging
- Avoid generic marketing language
- CRITICAL: Keep under 500 characters total
- IMPORTANT: End with "https://godship.io" at the very end

Format the response as a complete short-form video caption ready to post.`
    }
  ]

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 150,
      temperature: 0.8
    })
    
    let content = response.choices?.[0]?.message?.content?.trim() || 'Failed to generate Instagram content'
    
    // Add godship.io brand page link at the end if not already present
    if (!content.toLowerCase().includes('godship.io')) {
      content += `\n\ngodship.io`
    }
    
    // Ensure content is under 500 characters
    if (content.length > 500) {
      return content.substring(0, 497) + '...'
    }
    
    return content
  } catch (error) {
    console.error('Instagram content generation error:', error)
    return `${brand.name}: ${brand.description || 'Unique fashion that stands out'}

Discover more brands on godship.io

#${brand.name.replace(/\s+/g, '')} #Fashion #Style

godship.io`
  }
}

async function generateXContent(brand: { id: string; name: string; description: string | null; category: string | null; design_concept: string | null; target_audience: string | null }): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a social media marketing expert specializing in X (Twitter) content. Create VERY SHORT, concise tweets that drive engagement and brand awareness. Focus on driving traffic to the godship.io e-commerce store. Do NOT use emojis. Use hashtags strategically and keep within character limits. CRITICAL: X has a strict 280 character limit. Be extremely concise.'
    },
    {
      role: 'user',
      content: `Create an X (Twitter) post for the brand "${brand.name}".

Brand Information:
- Name: ${brand.name}
- Description: ${brand.description || 'A unique fashion brand'}
- Category: ${brand.category || 'Fashion'}

Requirements:
- CRITICAL: Must be under 200 characters (leave room for godship.io)
- Include 1-2 relevant hashtags maximum
- NO EMOJIS - keep it clean and professional
- Make it engaging and shareable
- Be extremely concise and impactful
- Focus on the brand's unique value proposition
- Make it feel authentic and conversational
- IMPORTANT: End with "godship.io" at the very end

Format the response as a complete X post ready to tweet.`
    }
  ]

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 60,
      temperature: 0.8
    })
    
    let content = response.choices?.[0]?.message?.content?.trim() || 'Failed to generate X content'
    
    // Add godship.io brands page link at the end if not already present
    if (!content.toLowerCase().includes('godship.io')) {
      content += ` godship.io/brands`
    }
    
    // Ensure content is under 280 characters
    if (content.length > 280) {
      return content.substring(0, 277) + '...'
    }
    
    return content
  } catch (error) {
    console.error('X content generation error:', error)
    return `${brand.name}: ${brand.description || 'Unique fashion'} Available on godship.io #${brand.name.replace(/\s+/g, '')} godship.io/brands`
  }
}

async function generateTikTokContent(brand: { id: string; name: string; description: string | null; category: string | null; design_concept: string | null; target_audience: string | null }): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a social media marketing expert specializing in TikTok content. Create engaging, trend-focused captions that drive viral potential and brand awareness. Use trending hashtags and TikTok-specific language. IMPORTANT: TikTok has a 2,200 character limit for captions.'
    },
    {
      role: 'user',
      content: `Create a TikTok post caption for the brand "${brand.name}".

Brand Information:
- Name: ${brand.name}
- Description: ${brand.description || 'A unique fashion brand'}
- Category: ${brand.category || 'Fashion'}
- Design Concept: ${brand.design_concept || 'Modern, stylish design'}
- Target Audience: ${brand.target_audience || 'Fashion-forward individuals'}

Requirements:
- Write 1-2 engaging paragraphs (100-150 words)
- Include 5-10 trending hashtags
- Use emojis strategically (3-5 emojis)
- Focus on viral potential and trendiness
- Include a call-to-action
- Make it feel authentic and Gen Z friendly
- Use TikTok-specific language and trends
- Avoid generic marketing language
- CRITICAL: Stay under 2,200 characters total

Format the response as a complete TikTok caption ready to post.`
    }
  ]

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_completion_tokens: 300,
      temperature: 0.9
    })
    
    const content = response.choices?.[0]?.message?.content?.trim() || 'Failed to generate TikTok content'
    
    // Ensure content is under 2,200 characters
    if (content.length > 2200) {
      return content.substring(0, 2197) + '...'
    }
    
    return content
  } catch (error) {
    console.error('TikTok content generation error:', error)
    return `✨ POV: You just discovered ${brand.name} and your style is about to LEVEL UP! 🔥

${brand.description || 'This brand is literally changing the game'} with ${brand.design_concept || 'sick designs'} that speak to ${brand.target_audience || 'trendsetters like you'}.

Ready to turn heads? 👀

#${brand.name.replace(/\s+/g, '')} #FashionTok #Style #Trending #OOTD #Fashion #Viral #StyleTok #Fashionista #Trendy`
  }
}
