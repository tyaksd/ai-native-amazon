import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      brandName,
      brandConcept,
      designConcept,
      targetAudience,
      backgroundImageDescription,
      basePrompt
    } = await request.json();

    // OpenAI APIを使用してより詳細な映像プロンプトを生成
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `You are a professional video director and cinematographer specializing in brand storytelling. Your task is to create detailed, cinematic video prompts that bring brand concepts to life through visual storytelling.

Guidelines:
1. Focus on cinematic techniques: camera movements, lighting, composition, color grading
2. Create immersive worlds that reflect the brand's emotional core
3. Use specific technical terms for video production
4. Include details about atmosphere, mood, and visual style
5. Make the prompt production-ready for AI video generation
6. Keep the video length appropriate (5-10 seconds)
7. Ensure the prompt is specific enough to generate high-quality results`;

    const userPrompt = `Create a detailed video prompt for the brand "${brandName}".

Brand Information:
- Brand Concept: ${brandConcept}
- Design Philosophy: ${designConcept}
- Target Audience: ${targetAudience}
${backgroundImageDescription ? `- Background Image Context: ${backgroundImageDescription}` : ''}

Base Prompt: ${basePrompt}

Please create a detailed, cinematic video prompt that:
1. Translates the brand concept into visual storytelling
2. Uses specific camera techniques and movements
3. Includes lighting and atmosphere details
4. Reflects the brand's aesthetic and emotional tone
5. Is optimized for AI video generation
6. Creates an immersive brand world

The prompt should be 2-3 sentences long and highly specific about visual elements, camera work, and atmosphere.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    return NextResponse.json({
      prompt: generatedPrompt,
      success: true
    });

  } catch (error) {
    console.error('Error generating video prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate video prompt' },
      { status: 500 }
    );
  }
}
