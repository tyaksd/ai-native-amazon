import { NextRequest, NextResponse } from 'next/server';
import { checkVideoGenerationStatus } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('=== Cloudinaryアップロードテスト ===');
    
    const jobId = 'video_68ef73acf09081939dc801e278cd79f10bcac515bff3e169';
    
    console.log(`映像URL取得テスト: ${jobId}`);
    
    const result = await checkVideoGenerationStatus(jobId);
    
    console.log('結果:', result);
    
    return NextResponse.json({
      message: 'Cloudinary upload test completed',
      jobId,
      result,
      hasVideoUrl: !!result.video_url,
      videoUrl: result.video_url,
      isCloudinaryUrl: result.video_url?.startsWith('https://res.cloudinary.com')
    });

  } catch (error) {
    console.error('Error in Cloudinary upload test:', error);
    return NextResponse.json(
      { 
        error: 'Cloudinary upload test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
