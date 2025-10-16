import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== 映像レスポンスの詳細デバッグ ===');
    
    // 最初のジョブの詳細レスポンスを確認
    const jobId = 'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2';
    
    console.log(`詳細レスポンス取得中: ${jobId}`);
    
    const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const videoData = await response.json();
      console.log('完全なレスポンス:', JSON.stringify(videoData, null, 2));
      
      return NextResponse.json({
        message: 'Video response debug completed',
        jobId,
        fullResponse: videoData,
        availableFields: Object.keys(videoData),
        hasVideoUrl: 'video_url' in videoData,
        hasVideoUrlField: videoData.video_url !== undefined,
        videoUrlValue: videoData.video_url
      });
    } else {
      const errorData = await response.json();
      return NextResponse.json({
        error: 'Failed to fetch video data',
        status: response.status,
        errorData
      });
    }

  } catch (error) {
    console.error('Error in video response debug:', error);
    return NextResponse.json(
      { 
        error: 'Video response debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
