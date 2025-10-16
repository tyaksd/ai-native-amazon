import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== ジョブキャンセル処理開始 ===');
    
    // 現在進行中のジョブID一覧
    const stuckJobs = [
      'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2', // 複雑プロンプト
      'video_68ef61bbdcb8819089929afff9428f3a04d8beb4732ec533', // 軽量プロンプト  
      'video_68ef61ea7c2c8190a3aedf4c1a2f09ca098f166f70d5a422'  // シンプルプロンプト
    ];
    
    const results = [];
    
    for (const jobId of stuckJobs) {
      console.log(`処理中のジョブ: ${jobId}`);
      
      try {
        // 最終ステータス確認
        const statusResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`ジョブ ${jobId} のステータス:`, statusData.status);
          
          results.push({
            jobId,
            status: statusData.status,
            message: statusData.status === 'processing' ? 'Still processing (cannot cancel)' : `Status: ${statusData.status}`
          });
        } else {
          results.push({
            jobId,
            status: 'error',
            message: 'Failed to check status'
          });
        }
      } catch (error) {
        console.error(`ジョブ ${jobId} の確認でエラー:`, error);
        results.push({
          jobId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('=== ジョブキャンセル処理完了 ===');
    
    return NextResponse.json({
      message: 'Job status check completed',
      results,
      note: 'OpenAI Sora2 API does not support job cancellation. Jobs will continue processing on OpenAI servers.'
    });

  } catch (error) {
    console.error('Error in job cancellation:', error);
    return NextResponse.json(
      { 
        error: 'Job cancellation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
