import { NextResponse } from 'next/server';
import { checkVideoGenerationStatus } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('=== 修正されたcheckVideoGenerationStatus関数をテスト ===');
    
    const jobId = 'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2';
    
    console.log(`映像URL取得テスト: ${jobId}`);
    
    const result = await checkVideoGenerationStatus(jobId);
    
    console.log('結果:', result);
    
    return NextResponse.json({
      message: 'Video URL test completed',
      jobId,
      result,
      hasVideoUrl: !!result.video_url,
      videoUrl: result.video_url
    });

  } catch (error) {
    console.error('Error in video URL test:', error);
    return NextResponse.json(
      { 
        error: 'Video URL test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
