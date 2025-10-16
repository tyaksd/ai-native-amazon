import { NextResponse } from 'next/server';
import { generateVideoWithSora2 } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('Starting SIMPLE video generation test...');
    
    // 極めてシンプルなプロンプト
    const simplePrompt = `A red ball bouncing on a white background`;

    console.log('Simple prompt:', simplePrompt);

    // Sora2で映像生成をテスト
    const videoRequest = {
      prompt: simplePrompt,
      model: 'sora-2',
      seconds: 4,
      size: '1280x720'
    };

    console.log('Sending simple request to Sora2...');
    const result = await generateVideoWithSora2(videoRequest);
    
    console.log('Sora2 response:', result);

    return NextResponse.json({
      success: true,
      jobId: result.id,
      status: result.status,
      message: 'Simple video generation started',
      prompt: simplePrompt
    });

  } catch (error) {
    console.error('Error in simple video generation:', error);
    return NextResponse.json(
      { 
        error: 'Simple video generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
