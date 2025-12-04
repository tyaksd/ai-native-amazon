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
    const { brandStyle, quantity = 1, customDescription } = await request.json()
    console.log('Brand style:', brandStyle, 'Quantity:', quantity, 'Custom description:', customDescription ? 'provided' : 'not provided')

    // If customDescription is provided, ignore brandStyle validation
    if (!customDescription) {
      if (!brandStyle || !['street', 'casual'].includes(brandStyle)) {
        return NextResponse.json({ error: 'Invalid brand style' }, { status: 400 })
      }
    }

    const quantityNum = Number(quantity)
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 10) {
      return NextResponse.json({ error: 'Invalid quantity. Must be between 1 and 10.' }, { status: 400 })
    }

    // Generate multiple unique brands
    const styleLabel = customDescription ? 'custom' : brandStyle
    console.log(`Generating ${quantityNum} unique ${styleLabel} brands...`)
    
    const generatedBrands = []
    
    for (let i = 0; i < quantityNum; i++) {
      console.log(`Generating brand ${i + 1}/${quantityNum}...`)
      
      // Create style-specific prompts - completely separate for each style
      let basePrompt: string
      
      if (customDescription) {
        // Custom description provided - use it to generate brand, ignoring any predefined brand style concepts
        basePrompt = `Role and Task: "Act as an avant-garde fashion brand strategist. Generate a Brand Name, Brand Concept (Key Phrase), Design Concept, Target Audience, Logo Design, and Background Image for a new fashion brand launching on an e-commerce platform.

CRITICAL: The following custom description is the PRIMARY and ONLY source for the brand concept. IGNORE any predefined brand style categories (streetwear, casual, etc.) and focus EXCLUSIVELY on expanding and developing the custom description provided below:

CUSTOM DESCRIPTION:
${customDescription}

Your task is to take this custom description and expand it into a complete brand identity. Use the custom description as the foundation and build upon it creatively. Do not apply any generic brand style templates or categories.

CRITICAL UNIQUENESS REQUIREMENT: This is brand ${i + 1} of ${quantityNum} brands being generated. Each brand must be COMPLETELY UNIQUE and DIFFERENT from all others. Avoid any similarities in names, concepts, colors, or aesthetics.`
      } else if (brandStyle === 'street') {
        basePrompt = `Role and Task: "Act as an avant-garde street fashion brand strategist. Generate a Brand Name, Brand Concept (Key Phrase), Design Concept, Target Audience, Logo Design, and Background Image for a new streetwear brand launching on an e-commerce platform."

STREETWEAR FOCUS: Create bold, edgy, urban-inspired brands that embody rebellion, youth culture, and underground aesthetics. Think graffiti, skate culture, hip-hop, punk, and urban subcultures.

CRITICAL UNIQUENESS REQUIREMENT: This is brand ${i + 1} of ${quantityNum} brands being generated. Each brand must be COMPLETELY UNIQUE and DIFFERENT from all others. Avoid any similarities in names, concepts, colors, or aesthetics.`
      } else if (brandStyle === 'casual') {
        basePrompt = `Role and Task: "Act as a contemporary casual fashion brand strategist. Generate a Brand Name, Brand Concept (Key Phrase), Design Concept, Target Audience, Logo Design, and Background Image for a new casual lifestyle brand launching on an e-commerce platform."

CASUAL FOCUS: Create approachable, comfortable, lifestyle-focused brands that embody everyday style, comfort, and modern living. Think minimalism, comfort, sustainability, and contemporary lifestyle aesthetics.

CRITICAL UNIQUENESS REQUIREMENT: This is brand ${i + 1} of ${quantityNum} brands being generated. Each brand must be COMPLETELY UNIQUE and DIFFERENT from all others. Avoid any similarities in names, concepts, colors, or aesthetics.`
      } else {
        throw new Error(`Invalid brand style: ${brandStyle}`)
      }
      
      // Create the complete prompt with style-specific content
      let prompt: string
      
      if (customDescription) {
        // Custom description prompt - expand the custom description exclusively
        prompt = basePrompt + `

IMPORTANT: Focus ONLY on brand identity, visual design, and aesthetic concepts. DO NOT include real-world actions such as community events, funding, or workshops.

REMEMBER: The custom description above is your PRIMARY source. Expand and develop it creatively. Do NOT apply any predefined brand style categories or templates.

— Brand Name —
Invent an original, memorable word or phrase that directly reflects and expands upon the custom description provided above.
The name should emerge naturally from the custom description's essence, tone, and vision.
Avoid generic words. Draw from the specific elements, emotions, and concepts mentioned in the custom description.
The name should feel fresh, ownable, and globally distinctive.
→ Be spontaneous, experimental, and let the custom description guide your intuition.
The name should feel like a natural extension of the custom description's core concept.

— Brand Concept —
Write a detailed and emotionally resonant description of around **90 words** that EXPANDS and DEVELOPS the custom description provided above.
Take the custom description as your starting point and build upon it to create a complete brand worldview.
It should describe how the brand *feels* — its rhythm, aesthetic, and underlying story — directly derived from the custom description.
Blend poetic abstraction with visual precision, staying true to the custom description's essence.
Avoid clichés and create a fresh, vivid image that feels cinematic and conceptually bold.
The brand concept should feel like a natural evolution and expansion of the custom description.

— Design Concept —
Describe the visual DNA of the brand: color schemes, shapes, typography, and motifs that directly translate the custom description into visual elements.
Extract visual concepts from the custom description and develop them into a cohesive design language.
Blend unexpected design schools that align with the custom description.
Encourage unusual materials, hybrid inspirations, and experimental layout approaches that reflect the custom description.
Focus on originality and sensory impact that stems from the custom description's unique vision.

— Target Audience —
Define the subculture or mindset of the audience that would naturally connect with the brand described in the custom description.
The audience should be derived directly from the custom description's vision, values, and aesthetic.
They can be any relevant audience that aligns with the custom description's specific concept and philosophy.
Each audience description must sound culturally distinct and emotionally resonant, reflecting the unique nature of the custom description.

— Logo Design —
Create a simple, iconic symbol that visually represents the brand concept derived from the custom description.
The logo should directly reflect the visual identity and aesthetic philosophy described in the custom description.
Focus on visual elements, shapes, and typography that translate the custom description into a logo form.
Generate a minimalist logo image with the emblem or symbol positioned precisely at the center of the canvas.
Avoid any extraneous objects, backgrounds, or text; focus solely on the primary logo shape.
Use crisp lines and balanced proportions so that the design remains clear when scaled down.
The style should resemble vector art with high contrast and a limited color palette.
The logo color should be the most representative color that reflects the brand concept from the custom description — not necessarily black or white, but the color that best embodies the custom description's identity and aesthetic.
Leave generous white space around the logo to emphasize its central placement and ensure the overall composition feels uncluttered.

IMPORTANT: There is a 70% chance the logo should be text-based rather than a symbol/icon.
If creating a text logo, use the brand name as the primary element and style the typography to perfectly reflect the brand concept derived from the custom description.
The text should be the main focus, positioned centrally with generous white space around it.

— Background Image —
Describe a striking header background that visually embodies the custom description's atmosphere and emotional tone.
The scene should directly translate the custom description into space, light, and texture.
The image must feel like an immersive world where the brand described in the custom description lives — poetic, cinematic, and conceptually aligned with the custom description's design DNA.
The image should be high-resolution, visually sharp, and production-ready, suitable for use as a large-scale e-commerce header.
It must directly reflect the unique emotional core and aesthetic philosophy of the custom description provided above.`
      } else if (brandStyle === 'street') {
        prompt = basePrompt + `

IMPORTANT: Focus ONLY on brand identity, visual design, and aesthetic concepts. DO NOT include real-world actions such as community events, funding, or workshops.

— STREETWEAR Diversity Directive —
Every brand you generate must represent a *different subculture, emotion, or visual philosophy* within street culture.
Explore contrasting tones
Each brand should feel as if it belongs to a *unique micro-universe* within street culture.

— Brand Name —
Invent an original, memorable word or phrase that captures the brand's distinct tone and emotion.
Avoid generic streetwear words like "urban," "graffiti," or "vibe."
Draw from unexpected cultural or emotional sources such as:
Subcultures — youth movements, digital aesthetics, underground art, or futuristic styles
Languages — blend sounds or fragments from multiple languages, or create new invented syllables
Emotion or Philosophy — express a mood, state of mind, or existential theme rather than a literal word
Material or Texture — evoke a physical or sensory quality (something that can be felt rather than described)
The name should feel fresh, ownable, and globally distinctive.
→ Be more spontaneous, experimental, and even chaotic.
Let intuition override logic.
Embrace imperfection, randomness, and subconscious inspiration — the name can sound irrational, misspelled, or strangely beautiful.
Sometimes the best names are born from accidents, rhythm, or visual noise.
It's okay if it feels improvised, like a word you might discover by accident on a wall, a sound, or a glitch.
Focus on raw emotion over reason.


— Brand Concept —
Write a detailed and emotionally resonant description of around **90 words** that captures the brand's worldview, visual philosophy, and emotional tone.
It should describe how the brand *feels* — its rhythm, aesthetic, and underlying story — not just what it sells.
Blend poetic abstraction with visual precision.
Avoid clichés and create a fresh, vivid image that feels cinematic and conceptually bold.

— Design Concept —
Describe the visual DNA of the brand: color schemes, shapes, typography, and motifs.
Blend unexpected design schools 
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
For street brands, use bold, edgy, graffiti-inspired fonts with urban aesthetics, sharp angles, and rebellious energy.
The text should be the main focus, positioned centrally with generous white space around it.

— Background Image —
Describe a striking header background that embodies the brand's atmosphere and emotional tone.
The scene should visually translate the brand concept into space, light, and texture, rather than rely on typical street settings.
The image must feel like an immersive world where the brand lives — poetic, cinematic, and conceptually aligned with its design DNA.
For street brands, you may explore a wide range of environments and moods, not limited to neon or dark cityscapes.
Think of the background as a visual metaphor for the brand's soul — each one a distinct world with its own texture, rhythm, and emotion.
Go beyond repetition of neon, darkness, or city imagery.
Explore diverse, contrasting settings that reflect different philosophies, aesthetics, and emotions.
The image should be high-resolution, visually sharp, and production-ready, suitable for use as a large-scale e-commerce header.
It must directly reflect the unique emotional core and aesthetic philosophy of the specific brand concept —
not a generic "streetwear" tone, but a distinct visual world that could only belong to that brand.`
      } else {
        // Casual brand prompt
        prompt = basePrompt + `

IMPORTANT: Focus ONLY on brand identity, visual design, and aesthetic concepts. DO NOT include real-world actions such as community events, funding, or workshops.

— CASUAL LIFESTYLE Diversity Directive —
Every brand you generate must represent a different lifestyle philosophy, comfort aesthetic, or modern living approach.
Explore contrasting tones.
Each brand should feel as if it belongs to a unique micro-universe within casual lifestyle culture.
→ Be less literal and more instinctive.
Do not imitate or rely too closely on the given examples — use them only as loose inspiration.
Let randomness, emotion, and unexpected combinations guide creativity.
Surprise yourself.

— Brand Name —
Invent an original, memorable word or phrase that captures the brand's distinct tone and emotion.
Avoid generic casual words like "comfort," "lifestyle," or "modern."
Draw from unexpected cultural or emotional sources such as:
Lifestyle Philosophies — mindfulness, sustainability, minimalism, or contemporary living
Languages — blend sounds or fragments from multiple languages, or create new invented syllables
Emotion or Philosophy — express a mood, state of mind, or living philosophy rather than a literal word
Material or Texture — evoke a physical or sensory quality (something that can be felt rather than described)
The name should feel fresh, ownable, and globally distinctive.

→ Be spontaneous, experimental, and random.
Let the name emerge from intuition, rhythm, or even accidental wordplay.
It's fine if it feels irrational, nonsensical, or improvised — embrace playfulness, imperfection, and unpredictability.
Use the examples only as distant references, not as rules.

— Brand Concept —
Write a detailed and emotionally resonant description of around 80 words that captures the brand's worldview, visual philosophy, and emotional tone.
Describe how the brand feels — its rhythm, aesthetic, and underlying story — not just what it sells.
Blend poetic abstraction with visual precision.
→ Avoid structured or formulaic writing.
Let the tone flow naturally — poetic, dreamy, or fragmented.
The description can sound like a short film scene, a feeling, or a piece of abstract poetry.
It doesn't need to follow the examples; randomness and intuition are encouraged.

— Design Concept —
Describe the visual DNA of the brand: color schemes, shapes, typography, and motifs.
Blend unexpected design schools 
Encourage unusual materials, hybrid inspirations, and experimental layout approaches.
Focus on originality and sensory impact.
→ You don't need to adhere to logic.
Colors, textures, and materials can contradict or clash — that's fine.
Allow some chaos and imperfection; the goal is feeling, not harmony.

— Target Audience —
Define the lifestyle or mindset of the audience.
They can be: conscious consumers, minimalists, sustainability advocates, comfort seekers, modern professionals, or lifestyle enthusiasts.
→ Feel free to invent entirely new archetypes or imaginary lifestyles.
The "audience" could be poetic, absurd, or metaphorical — even imaginary tribes or emotional identities.
Make it vivid, unique, and emotionally specific, not demographic.

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
For casual brands, use clean, friendly, approachable fonts with comfortable aesthetics, rounded edges, and welcoming warmth.
The text should be the main focus, positioned centrally with generous white space around it.
→ The logo doesn't need to be perfect or balanced.
Slight asymmetry, rough edges, or experimental letterforms can express personality and authenticity.
Let it feel human, not mechanical.

— Background Image —
Describe a striking header background that embodies the brand's atmosphere and emotional tone.
The scene should visually translate the brand concept into space, light, and texture, rather than rely on typical casual settings.
The image must feel like an immersive world where the brand lives — poetic, cinematic, and conceptually aligned with its design DNA.
→ Avoid being bound by the examples.
You can imagine any world — surreal, dreamlike, digital, nostalgic, or abstract.
Think freely: from warm kitchens and paper textures to foggy forests, sunset rooms, or floating architecture.
Explore diverse environments that reflect contrasting moods and philosophies, can be anything.
The image should be high-resolution, visually sharp, and production-ready — suitable for use as a large-scale e-commerce header.
It must directly reflect the essence of the specific brand concept, not a generic "casual lifestyle" tone.
→ Allow visual serendipity: the result can be dreamy, abstract, or strangely beautiful.`
      }

      // Add JSON format instructions to the prompt
      prompt += `

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
      console.log(`Brand ${i + 1} content generated:`, brandContent.name)

      // Generate logo image using DALL-E 3
      console.log(`Generating logo ${i + 1} with gpt-image-1...`)
      let logoResponse
      try {
        logoResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: brandContent.logo_design + ", realistic brand logo, clean typography, professional corporate design, minimalist, modern, authentic, no AI art style, real brand aesthetic, 1024x1024, high quality",
          size: "1024x1024",
          quality: "low",
          n: 1,
        })
        console.log(`Logo ${i + 1} generated successfully`)
      } catch (error) {
        console.error(`Error generating logo ${i + 1}:`, error)
        throw new Error(`Failed to generate logo ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Generate background image using DALL-E 3
      console.log(`Generating background image ${i + 1} with gpt-image-1...`)
      let backgroundResponse
      try {
        backgroundResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: brandContent.background_image_description + ", realistic photography, authentic street photography, natural lighting, real urban environment, no AI art style, professional fashion photography, authentic, genuine, 1024x1792, high quality",
          size: "1536x1024",
          quality: "low",
          n: 1,
        })
        console.log(`Background image ${i + 1} generated successfully`)
      } catch (error) {
        console.error(`Error generating background image ${i + 1}:`, error)
        throw new Error(`Failed to generate background image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Upload images to Cloudinary
      console.log(`Uploading images ${i + 1} to Cloudinary...`)
      
      // Check if we have URL or base64 data
      const logoUrl = logoResponse.data?.[0]?.url
      const backgroundUrl = backgroundResponse.data?.[0]?.url
      
      // If we have base64 data instead of URLs, we need to handle it differently
      const logoB64 = logoResponse.data?.[0]?.b64_json
      const backgroundB64 = backgroundResponse.data?.[0]?.b64_json

      if (!logoUrl && !logoB64) {
        console.error(`No logo image data found for brand ${i + 1}`)
        throw new Error(`Failed to generate logo image for brand ${i + 1}`)
      }
      
      if (!backgroundUrl && !backgroundB64) {
        console.error(`No background image data found for brand ${i + 1}`)
        throw new Error(`Failed to generate background image for brand ${i + 1}`)
      }

      // Download and upload to Cloudinary
      let uploadedLogoUrl: string
      let uploadedBackgroundUrl: string
      
      if (logoUrl) {
        // Handle URL-based image
        const logoResponse_fetch = await fetch(logoUrl)
        const logoBuffer = await logoResponse_fetch.arrayBuffer()
        const logoBlob = new Blob([logoBuffer], { type: 'image/png' })
        const logoFile = new File([logoBlob], `logo-${i + 1}.png`, { type: 'image/png' })
        uploadedLogoUrl = await uploadImage(logoFile)
      } else if (logoB64) {
        // Handle base64 image
        const logoBuffer = Buffer.from(logoB64, 'base64')
        const logoBlob = new Blob([logoBuffer], { type: 'image/png' })
        const logoFile = new File([logoBlob], `logo-${i + 1}.png`, { type: 'image/png' })
        uploadedLogoUrl = await uploadImage(logoFile)
      } else {
        throw new Error(`No logo image data available for brand ${i + 1}`)
      }

      if (backgroundUrl) {
        // Handle URL-based image
        const backgroundResponse_fetch = await fetch(backgroundUrl)
        const backgroundBuffer = await backgroundResponse_fetch.arrayBuffer()
        const backgroundBlob = new Blob([backgroundBuffer], { type: 'image/png' })
        const backgroundFile = new File([backgroundBlob], `background-${i + 1}.png`, { type: 'image/png' })
        uploadedBackgroundUrl = await uploadImage(backgroundFile)
      } else if (backgroundB64) {
        // Handle base64 image
        const backgroundBuffer = Buffer.from(backgroundB64, 'base64')
        const backgroundBlob = new Blob([backgroundBuffer], { type: 'image/png' })
        const backgroundFile = new File([backgroundBlob], `background-${i + 1}.png`, { type: 'image/png' })
        uploadedBackgroundUrl = await uploadImage(backgroundFile)
      } else {
        throw new Error(`No background image data available for brand ${i + 1}`)
      }
      console.log(`Images ${i + 1} uploaded to Cloudinary successfully`)

      // Create brand in database
      console.log(`Creating brand ${i + 1} in database...`)
      // Determine category based on custom description or brandStyle
      // Note: Database only allows 'Clothing', 'Accessories', 'Hats', 'Others'
      const category = 'Clothing'
      
      const newBrand = await createBrand({
        name: brandContent.name,
        description: brandContent.description,
        icon: uploadedLogoUrl,
        background_image: uploadedBackgroundUrl,
        category: category,
        design_concept: brandContent.design_concept,
        target_audience: brandContent.target_audience,
        logo_design: brandContent.logo_design,
        style: brandStyle === 'street' ? 'Street' : 'Casual',
        is_hot: false,
        is_new: false,
      })

      if (!newBrand) {
        console.log(`Failed to create brand ${i + 1} in database`)
        throw new Error(`Failed to create brand ${i + 1}`)
      }

      console.log(`Brand ${i + 1} created successfully:`, newBrand.name)
      generatedBrands.push(newBrand)
    }

    console.log(`All ${quantityNum} brands created successfully`)
    return NextResponse.json({ 
      success: true, 
      brands: generatedBrands 
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
