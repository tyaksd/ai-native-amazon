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
    const prompt = `Role and Task: "Act as an avant-garde street fashion brand strategist. Generate a Brand Name, Brand Concept (Key Phrase), Design Concept, Target Audience, Logo Design, and Background Image for a new streetwear brand launching on an e-commerce platform."

IMPORTANT: Focus ONLY on brand identity, visual design, and aesthetic concepts. DO NOT include real-world actions such as community events, funding, or workshops.

— Diversity Directive —
Every brand you generate must represent a *different subculture, emotion, or visual philosophy.* 
Explore contrasting tones: futuristic vs nostalgic, digital vs analog, luxury street vs underground DIY, poetic vs aggressive, local vs global, Eastern vs Western, dystopian vs utopian, etc.
Each brand should feel as if it belongs to a *unique micro-universe* within street culture.

— Brand Name —
Invent an original, memorable word or phrase that captures the brand’s distinct tone and emotion.
Avoid generic streetwear words like “urban”, “graffiti”, or “vibe.”
Draw from unexpected sources: 
  - subcultures (cyberpunk, vaporwave, skater, retro-futurism, glitch, 90s nostalgia, neo-tokyo, artcore)
  - languages (mix English, Japanese, Latin, or invented syllables)
  - emotion or philosophy (rage, calm, decay, rebirth, silence, freedom)
  - material or texture (steel, ash, neon, dust, void, chrome)
The name should feel *fresh, ownable, and globally distinctive.*

— Brand Concept —
Write a detailed and emotionally resonant description of around **70 words** that captures the brand’s worldview, visual philosophy, and emotional tone.
It should describe how the brand *feels* — its rhythm, aesthetic, and underlying story — not just what it sells.
Blend poetic abstraction with visual precision.
Examples of archetypes: “Rebellion through silence,” “Digital melancholy,” “Post-industrial elegance,” “Youth in decay,” “Neon resilience,” “Mechanical spirituality.”
Avoid clichés and create a fresh, vivid image that feels cinematic and conceptually bold.

— Design Concept —
Describe the visual DNA of the brand: color schemes, shapes, typography, and motifs.
Blend unexpected design schools (brutalism × calligraphy, street punk × minimalism, cyberwave × traditional textile, etc.)
Encourage unusual materials, hybrid inspirations, and experimental layout approaches.
Focus on originality and sensory impact.

— Target Audience —
Define the subculture or mindset of the audience. 
They can be: experimental fashion followers, digital natives, art students, skaters, club culture, underground creators, or philosophical outsiders.
Each audience description must sound culturally distinct and emotionally resonant.

— Logo Design —
Create a simple, iconic symbol that reflects the brand's visual identity and can adapt to collaborations. 
Focus on visual elements, shapes, and typography. 
Generate a minimalist logo image with the emblem or symbol positioned precisely at the center of the canvas. 
Avoid any extraneous objects, backgrounds, or text; focus solely on the primary logo shape. 
Use crisp lines and balanced proportions so that the design remains clear when scaled down. 
The style should resemble vector art with high contrast and a limited color palette. 
The logo color should be the most representative color that reflects the brand concept — not necessarily black or white, but the color that best embodies the brand's identity and aesthetic. 
Leave generous white space around the logo to emphasize its central placement and ensure the overall composition feels uncluttered.

IMPORTANT: There is a 70% chance the logo should be text-based rather than a symbol/icon. 
If creating a text logo, use the brand name as the primary element and style the typography to perfectly reflect the brand concept. 
For street brands, use bold, edgy, graffiti-inspired fonts with urban aesthetics. 
For casual brands, use clean, friendly, approachable fonts with comfortable aesthetics. 
The text should be the main focus, positioned centrally with generous white space around it.

- Background Image —
Describe a striking header background that embodies the brand’s atmosphere and emotional tone.
The scene should visually translate the brand concept into space, light, and texture, rather than rely on typical street settings.
The image must feel like an immersive world where the brand lives — poetic, cinematic, and conceptually aligned with its design DNA.
Go beyond repetition of neon, darkness, or city imagery.
Explore diverse environments that reflect contrasting moods and philosophies, such as:
-futuristic or utopian landscapes filled with light and clarity
-quiet minimal spaces with soft daylight and architectural purit
-organic environments blending nature, mist, or sand with fashion surrealism
-dreamlike rooms filled with texture, reflection, or nostalgic warmth
-abstract digital spaces expressing geometry, rhythm, or movement
-post-industrial or decayed textures symbolizing rebirth and transformation
-spiritual or symbolic compositions evoking calm, silence, or transcendence
The image should be high-resolution, visually sharp, and production-ready — suitable for use as a large-scale e-commerce header.
It must directly reflect the essence of the specific brand concept, not a generic “streetwear” tone.


Please provide the response in the following JSON format:
{
  "name": "Brand Name",
  "description": "Brand Concept/Description (~70 words)",
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
        quality: "low",
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
