import { NextResponse } from 'next/server';
import { generateVideoWithSora2, checkVideoGenerationStatus } from '../../../lib/sora2/sora2-video-generator';

export async function POST() {
  try {
    console.log('Starting timeout-protected video generation...');
    
    // 軽量プロンプト
    const prompt = `A simple test video of a blue cube rotating slowly`;

    const videoRequest = {
      prompt: prompt,
      model: 'sora-2',
      seconds: '4',
      size: '1280x720'
    };

    console.log('Starting video generation...');
    const result = await generateVideoWithSora2(videoRequest);
    
    console.log('Video generation started:', result);

    // タイムアウト付きポーリング
    const maxAttempts = 20; // 10分間（30秒×20回）
    const pollInterval = 30000; // 30秒間隔
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt}/${maxAttempts}`);
      
      const status = await checkVideoGenerationStatus(result.id);
      console.log(`Status: ${status.status}`);
      
      if (status.status === 'succeeded') {
        return NextResponse.json({
          success: true,
          jobId: result.id,
          status: status.status,
          videoUrl: status.video_url,
          message: 'Video generation completed successfully',
          attempts: attempt,
          totalTime: attempt * 30
        });
      }
      
      if (status.status === 'failed') {
        return NextResponse.json({
          success: false,
          jobId: result.id,
          status: status.status,
          error: status.error,
          message: 'Video generation failed',
          attempts: attempt
        });
      }
      
      // まだ処理中の場合は待機
      if (attempt < maxAttempts) {
        console.log(`Waiting ${pollInterval/1000} seconds before next check...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // タイムアウト
    return NextResponse.json({
      success: false,
      jobId: result.id,
      status: 'timeout',
      message: 'Video generation timed out after 10 minutes',
      attempts: maxAttempts,
      totalTime: maxAttempts * 30
    });

  } catch (error) {
    console.error('Error in timeout-protected video generation:', error);
    return NextResponse.json(
      { 
        error: 'Timeout-protected video generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
