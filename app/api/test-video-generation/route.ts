import { NextResponse } from 'next/server';
import { generateVideoWithSora2 } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('Starting video generation test...');
    
    // 簡単なテスト用プロンプト
    const testPrompt = `A cinematic exploration of an urban street at night. The camera slowly approaches a dimly lit alley with flickering neon signs. Dust particles drift through the air as the camera pans past weathered brick walls and mysterious doorways. The scene has a gritty, atmospheric quality with deep shadows and bursts of artificial color.`;

    console.log('Test prompt:', testPrompt);

    // Sora2で映像生成をテスト
    const videoRequest = {
      prompt: testPrompt,
      model: 'sora-2',
      seconds: '4',
      size: '1280x720'
    };

    console.log('Sending request to Sora2...');
    const result = await generateVideoWithSora2(videoRequest);
    
    console.log('Sora2 response:', result);

    return NextResponse.json({
      success: true,
      jobId: result.id,
      status: result.status,
      message: 'Test video generation started',
      prompt: testPrompt
    });

  } catch (error) {
    console.error('Error in test video generation:', error);
    return NextResponse.json(
      { 
        error: 'Test video generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}