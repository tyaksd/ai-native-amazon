import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 400 }
      );
    }

    // Test with a simple prompt and correct model name
    const testRequest = {
      model: 'sora-2',
      prompt: 'A simple test video of a red ball bouncing on a white background',
      seconds: '4',
      size: '1280x720'
    };

    console.log('Testing Sora2 API with:', testRequest);

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sora2 API Error:', errorData);
      return NextResponse.json(
        { 
          error: 'Sora2 API error',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Sora2 API Success:', data);

    return NextResponse.json({
      success: true,
      jobId: data.id,
      status: data.status,
      message: 'Sora2 API test successful'
    });

  } catch (error) {
    console.error('Error testing Sora2 API:', error);
    return NextResponse.json(
      { 
        error: 'Sora2 API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
