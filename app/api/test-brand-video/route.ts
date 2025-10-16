import { NextRequest, NextResponse } from 'next/server';
import { generateVideoWithSora2 } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('=== ブランド動画生成テスト ===');
    
    const testPrompt = `A cinematic exploration of a modern brand storefront. The camera slowly approaches a sleek glass building with elegant signage. The scene has a professional, sophisticated atmosphere with clean lines and contemporary design elements.`;
    console.log('ブランドテストプロンプト:', testPrompt);

    const videoRequest = {
      prompt: testPrompt,
      model: 'sora-2',
      seconds: '4',
      size: '1280x720'
    };

    console.log('ブランド動画生成リクエスト送信中...');
    const result = await generateVideoWithSora2(videoRequest);

    console.log('ブランド動画生成レスポンス:', result);

    return NextResponse.json({
      success: true,
      jobId: result.id,
      status: result.status,
      message: 'Brand video generation test started',
      prompt: testPrompt
    });

  } catch (error) {
    console.error('Error in brand video generation test:', error);
    return NextResponse.json(
      {
        error: 'Brand video generation test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
