import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { uploadImage } from '@/lib/cloudinary-client'
import { createBrand } from '@/lib/data'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Starting AI brand generation...')
    const { brandStyle } = await request.json()
    console.log('Brand style:', brandStyle)

    if (!brandStyle || !['street', 'casual'].includes(brandStyle)) {
      return NextResponse.json({ error: 'Invalid brand style' }, { status: 400 })
    }

    // Generate brand content using GPT-5 mini
    console.log('Generating brand content with GPT-5 mini...')
    const prompt = `Role and Task: "Act as a creative ${brandStyle} brand strategist. Generate a Brand Name, Brand Concept (Key Phrase), Design Concept, Target Audience, Logo Design, and Background Image for a new ${brandStyle} brand that will launch on an e‑commerce platform."

IMPORTANT: Focus ONLY on brand identity, visual design, and aesthetic concepts. DO NOT include specific community activities, funding programs, workshops, or social impact initiatives that would require real-world implementation.

Incorporate winning patterns and conditions:

Brand Name: Give it an original name that is easy to remember and does not overlap with existing brands. Choose a word sound that suggests the brand's aesthetic and style. The name should be catchy and shareable, suitable for limited drops and collaboration strategies. ${brandStyle === 'casual' ? 'For casual brands, explore extremely diverse naming approaches: nature-inspired (Forest, Meadow, Ocean, River, Stone, Leaf), lifestyle concepts (Cozy, Comfort, Harmony, Bliss, Serene), abstract concepts (Zen, Flow, Balance, Pure, Essence), vintage-inspired (Heritage, Classic, Timeless, Vintage), modern minimal (Simple, Clean, Pure, Basic), artistic (Canvas, Palette, Muse, Studio), wellness (Wellness, Vital, Fresh, Renew), travel (Wander, Journey, Explore, Nomad), food-inspired (Honey, Spice, Sage, Olive), color-based (Azure, Sage, Rust, Pearl), emotion-based (Joy, Peace, Calm, Bliss), or creative word combinations. Each name should reflect a completely different casual lifestyle niche.' : ''}

Brand Concept: Base it on a compelling visual narrative or cultural aesthetic. Focus on style, attitude, and visual identity rather than specific social programs or community activities. ${brandStyle === 'casual' ? 'For casual brands, explore extremely diverse concepts across all lifestyle niches: minimalist Scandinavian style, bohemian lifestyle, vintage-inspired comfort, modern athleisure, sustainable fashion, cozy home lifestyle, outdoor adventure, artistic expression, wellness-focused aesthetics, urban professional casual, beach lifestyle, mountain retreat, coffee culture, book lover aesthetic, pet-friendly lifestyle, eco-conscious living, meditation and mindfulness, travel-inspired, food culture, music lover, gardening lifestyle, craft and DIY, photography enthusiast, yoga and fitness, vintage collector, modern family, student lifestyle, creative professional, home chef, nature enthusiast, city explorer, or any other specific casual lifestyle niche. Each brand should have a completely distinct personality and unique selling proposition that stands out from generic casual brands.' : ''}

Design Concept: ${brandStyle === 'street' 
  ? 'Emphasize bold graphics, urban aesthetics, street culture elements, and edgy visual identity. Focus on graffiti-inspired patterns, bold typography, and street art motifs that create strong brand recognition in urban environments.'
  : 'Explore extremely diverse casual design approaches across all lifestyle niches: minimalist Scandinavian aesthetics, bohemian patterns, vintage-inspired graphics, modern geometric designs, nature-inspired motifs, artistic illustrations, wellness-focused visual elements, urban professional graphics, beach lifestyle visuals, mountain retreat aesthetics, coffee culture imagery, book lover designs, pet-friendly graphics, eco-conscious visuals, meditation and mindfulness imagery, travel-inspired graphics, food culture visuals, music lover aesthetics, gardening lifestyle graphics, craft and DIY visuals, photography enthusiast designs, yoga and fitness graphics, vintage collector aesthetics, modern family visuals, student lifestyle graphics, creative professional designs, home chef aesthetics, nature enthusiast visuals, city explorer graphics, or any other specific casual lifestyle visual language. Each brand should have a completely unique design language that reflects its specific concept and target lifestyle.'
}

Target Audience: ${brandStyle === 'street'
  ? 'Identify streetwear enthusiasts, urban youth, skateboarders, hip-hop culture followers, and fashion-forward individuals who embrace edgy, bold street style and urban aesthetics.'
  : 'Identify extremely diverse casual lifestyle communities across all niches: minimalist enthusiasts, bohemian lifestyle followers, vintage fashion lovers, outdoor adventure seekers, wellness-focused individuals, home comfort seekers, artistic souls, sustainable fashion advocates, urban professionals, beach lifestyle enthusiasts, mountain retreat lovers, coffee culture followers, book lovers, pet owners, eco-conscious consumers, meditation practitioners, travel enthusiasts, food culture lovers, music enthusiasts, gardening hobbyists, craft and DIY enthusiasts, photography lovers, yoga practitioners, vintage collectors, modern families, students, creative professionals, home chefs, nature enthusiasts, city explorers, or any other specific casual lifestyle community. Each brand should target a completely specific niche within the broad casual lifestyle spectrum.'
}

Logo Design: Create a simple, iconic symbol that reflects the brand's visual identity and can adapt to collaborations. Focus on visual elements, shapes, and typography.　Generate a minimalist logo image with the emblem or symbol positioned precisely at the center of the canvas. Avoid any extraneous objects, backgrounds, or text; focus solely on the primary logo shape. Use crisp lines and balanced proportions so that the design remains clear when scaled down. The style should resemble vector art with high contrast and a limited color palette. The logo color should be the most representative color that reflects the brand concept - not necessarily black or white, but the color that best embodies the brand's identity and aesthetic. Leave generous white space around the logo to emphasize its central placement and ensure the overall composition feels uncluttered.

IMPORTANT: There is a 70% chance the logo should be text-based rather than a symbol/icon. If creating a text logo, use the brand name as the primary element and style the typography to perfectly reflect the brand concept. For street brands, use bold, edgy, graffiti-inspired fonts with urban aesthetics. For casual brands, use clean, friendly, approachable fonts with comfortable aesthetics. The text should be the main focus, positioned centrally with generous white space around it.

Background Image: ${brandStyle === 'street'
  ? 'Describe a header image that visually conveys urban street aesthetic with graffiti walls, cityscapes, urban textures, and street culture elements. Focus on bold colors, urban palettes, and edgy mood that represents street fashion.'
  : 'Describe extremely diverse casual lifestyle backgrounds across all niches: minimalist Scandinavian interiors, bohemian outdoor settings, vintage-inspired cozy spaces, modern wellness environments, artistic studio spaces, nature retreats, sustainable lifestyle scenes, urban professional workspaces, beach lifestyle settings, mountain retreat environments, coffee shop atmospheres, book lover spaces, pet-friendly environments, eco-conscious settings, meditation and mindfulness spaces, travel-inspired locations, food culture scenes, music lover environments, gardening spaces, craft and DIY workshops, photography studios, yoga and fitness spaces, vintage collector rooms, modern family homes, student living spaces, creative professional studios, home chef kitchens, nature enthusiast settings, city explorer locations, or any other specific casual lifestyle background. Each background should reflect the specific brand concept and create a completely unique visual atmosphere that distinguishes it from all other casual brands.'
}

Please provide the response in the following JSON format:
{
  "name": "Brand Name",
  "description": "Brand Concept/Description",
  "design_concept": "Design Concept",
  "target_audience": "Target Audience",
  "logo_design": "Logo Design Description",
  "background_image_description": "Background Image Description"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    })

    const responseContent = completion.choices[0].message.content || '{}'
    
    // Extract JSON from markdown if present
    let jsonContent = responseContent
    if (responseContent.includes('```json')) {
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }
    }
    
    const brandContent = JSON.parse(jsonContent)
    console.log('Brand content generated:', brandContent.name)

    // Generate logo image using DALL-E 3
    console.log('Generating logo with gpt-image-1...')
    let logoResponse
    try {
      logoResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: brandContent.logo_design + ", realistic brand logo, clean typography, professional corporate design, minimalist, modern, authentic, no AI art style, real brand aesthetic, 1024x1024, high quality",
        size: "1024x1024",
        quality: "low",
        n: 1,
      })
      console.log('Logo generated successfully')
      console.log('Logo response:', JSON.stringify(logoResponse, null, 2))
    } catch (error) {
      console.error('Error generating logo:', error)
      throw new Error(`Failed to generate logo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate background image using DALL-E 3
    console.log('Generating background image with gpt-image-1...')
    let backgroundResponse
    try {
      backgroundResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: brandContent.background_image_description + ", realistic photography, authentic street photography, natural lighting, real urban environment, no AI art style, professional fashion photography, authentic, genuine, 1024x1792, high quality",
        size: "1536x1024",
        quality: "medium",
        n: 1,
      })
      console.log('Background image generated successfully')
      console.log('Background response:', JSON.stringify(backgroundResponse, null, 2))
    } catch (error) {
      console.error('Error generating background image:', error)
      throw new Error(`Failed to generate background image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Upload images to Cloudinary
    console.log('Uploading images to Cloudinary...')
    
    // Check if we have URL or base64 data
    const logoUrl = logoResponse.data?.[0]?.url
    const backgroundUrl = backgroundResponse.data?.[0]?.url
    
    // If we have base64 data instead of URLs, we need to handle it differently
    const logoB64 = logoResponse.data?.[0]?.b64_json
    const backgroundB64 = backgroundResponse.data?.[0]?.b64_json

    console.log('Logo URL:', logoUrl)
    console.log('Background URL:', backgroundUrl)
    console.log('Logo B64 available:', !!logoB64)
    console.log('Background B64 available:', !!backgroundB64)

    if (!logoUrl && !logoB64) {
      console.error('No logo image data found')
      console.error('Logo response structure:', JSON.stringify(logoResponse, null, 2))
      throw new Error('Failed to generate logo image')
    }
    
    if (!backgroundUrl && !backgroundB64) {
      console.error('No background image data found')
      console.error('Background response structure:', JSON.stringify(backgroundResponse, null, 2))
      throw new Error('Failed to generate background image')
    }

    // Download and upload to Cloudinary
    let uploadedLogoUrl: string
    let uploadedBackgroundUrl: string
    
    if (logoUrl) {
      // Handle URL-based image
      const logoResponse_fetch = await fetch(logoUrl)
      const logoBuffer = await logoResponse_fetch.arrayBuffer()
      const logoBlob = new Blob([logoBuffer], { type: 'image/png' })
      const logoFile = new File([logoBlob], 'logo.png', { type: 'image/png' })
      uploadedLogoUrl = await uploadImage(logoFile)
    } else if (logoB64) {
      // Handle base64 image
      const logoBuffer = Buffer.from(logoB64, 'base64')
      const logoBlob = new Blob([logoBuffer], { type: 'image/png' })
      const logoFile = new File([logoBlob], 'logo.png', { type: 'image/png' })
      uploadedLogoUrl = await uploadImage(logoFile)
    } else {
      throw new Error('No logo image data available')
    }

    if (backgroundUrl) {
      // Handle URL-based image
      const backgroundResponse_fetch = await fetch(backgroundUrl)
      const backgroundBuffer = await backgroundResponse_fetch.arrayBuffer()
      const backgroundBlob = new Blob([backgroundBuffer], { type: 'image/png' })
      const backgroundFile = new File([backgroundBlob], 'background.png', { type: 'image/png' })
      uploadedBackgroundUrl = await uploadImage(backgroundFile)
    } else if (backgroundB64) {
      // Handle base64 image
      const backgroundBuffer = Buffer.from(backgroundB64, 'base64')
      const backgroundBlob = new Blob([backgroundBuffer], { type: 'image/png' })
      const backgroundFile = new File([backgroundBlob], 'background.png', { type: 'image/png' })
      uploadedBackgroundUrl = await uploadImage(backgroundFile)
    } else {
      throw new Error('No background image data available')
    }
    console.log('Images uploaded to Cloudinary successfully')

    // Create brand in database
    console.log('Creating brand in database...')
    const newBrand = await createBrand({
      name: brandContent.name,
      description: brandContent.description,
      icon: uploadedLogoUrl,
      background_image: uploadedBackgroundUrl,
      category: brandStyle === 'street' ? 'Streetwear' : 'Casual',
      design_concept: brandContent.design_concept,
      target_audience: brandContent.target_audience,
      logo_design: brandContent.logo_design,
    })

    if (!newBrand) {
      console.log('Failed to create brand in database')
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
    }

    console.log('Brand created successfully:', newBrand.name)
    return NextResponse.json({ 
      success: true, 
      brand: newBrand 
    })

  } catch (error) {
    console.error('Error generating AI brand:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to generate AI brand',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
