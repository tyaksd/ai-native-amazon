import { NextRequest, NextResponse } from 'next/server';
import { checkVideoGenerationStatus } from '../../../lib/sora2/sora2-video-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 新しい映像のURL取得テスト ===');
    
    const jobId = 'video_68ef7211b81c8193b6fbd4b94438994a00e0e1c2947d2d39';
    
    console.log(`新しい映像URL取得テスト: ${jobId}`);
    
    const result = await checkVideoGenerationStatus(jobId);
    
    console.log('結果:', result);
    
    return NextResponse.json({
      message: 'New video URL test completed',
      jobId,
      result,
      hasVideoUrl: !!result.video_url,
      videoUrl: result.video_url
    });

  } catch (error) {
    console.error('Error in new video URL test:', error);
    return NextResponse.json(
      { 
        error: 'New video URL test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
