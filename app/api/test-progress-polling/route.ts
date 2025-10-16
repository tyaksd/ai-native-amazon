import { NextRequest, NextResponse } from 'next/server';
import { pollVideoGenerationWithProgress } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('=== 進捗表示付きポーリングテスト ===');
    
    const jobId = 'video_68ef73acf09081939dc801e278cd79f10bcac515bff3e169';
    
    console.log(`進捗ポーリング開始: ${jobId}`);
    
    // 進捗コールバック関数
    const onProgress = (progress: number, status: string) => {
      console.log(`進捗更新: ${status} - ${progress}%`);
    };
    
    const result = await pollVideoGenerationWithProgress(jobId, onProgress);
    
    console.log('ポーリング結果:', result);
    
    return NextResponse.json({
      message: 'Progress polling test completed',
      jobId,
      result,
      hasVideoUrl: !!result.video_url,
      videoUrl: result.video_url,
      progress: result.progress
    });

  } catch (error) {
    console.error('Error in progress polling test:', error);
    return NextResponse.json(
      { 
        error: 'Progress polling test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
