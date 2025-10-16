import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== 生成された映像URLを直接取得 ===');
    
    // 完了したジョブID一覧
    const completedJobs = [
      'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2', // 複雑プロンプト
      'video_68ef61bbdcb8819089929afff9428f3a04d8beb4732ec533', // 軽量プロンプト  
      'video_68ef61ea7c2c8190a3aedf4c1a2f09ca098f166f70d5a422'  // シンプルプロンプト
    ];
    
    const results = [];
    
    for (const jobId of completedJobs) {
      console.log(`映像URL取得中: ${jobId}`);
      
      try {
        // OpenAI APIから直接映像情報を取得
        const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const videoData = await response.json();
          console.log(`ジョブ ${jobId} の詳細:`, {
            status: videoData.status,
            hasVideoUrl: !!videoData.video_url,
            duration: videoData.seconds,
            size: videoData.size
          });
          
          results.push({
            jobId,
            status: videoData.status,
            videoUrl: videoData.video_url,
            duration: videoData.seconds,
            size: videoData.size,
            model: videoData.model,
            createdAt: videoData.created_at,
            completedAt: videoData.completed_at,
            error: videoData.error
          });
        } else {
          const errorData = await response.json();
          console.error(`ジョブ ${jobId} の取得でエラー:`, errorData);
          results.push({
            jobId,
            status: 'error',
            error: errorData.error?.message || 'Failed to fetch video data'
          });
        }
      } catch (error) {
        console.error(`ジョブ ${jobId} の取得でエラー:`, error);
        results.push({
          jobId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('=== 映像URL取得完了 ===');
    
    return NextResponse.json({
      message: 'Video URLs retrieved successfully',
      results,
      summary: {
        total: results.length,
        completed: results.filter(r => r.status === 'completed').length,
        withVideoUrl: results.filter(r => r.videoUrl).length,
        errors: results.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    console.error('Error fetching video URLs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch video URLs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
