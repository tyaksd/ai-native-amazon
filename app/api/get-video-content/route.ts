import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 正しい映像コンテンツ取得 ===');
    
    const jobId = 'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2';
    
    // 正しいエンドポイント: /videos/{video_id}/content
    const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
    
    console.log(`映像コンテンツ取得中: ${contentUrl}`);
    
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`レスポンスステータス: ${response.status}`);
    console.log(`レスポンスヘッダー:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      // 映像データを取得
      const videoBuffer = await response.arrayBuffer();
      const videoSize = videoBuffer.byteLength;
      
      // レスポンスヘッダーから情報を取得
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      return NextResponse.json({
        message: 'Video content retrieved successfully',
        jobId,
        videoSize,
        contentType,
        contentLength,
        status: 'success',
        note: 'Video content is available as binary data'
      });
    } else {
      const errorData = await response.text();
      return NextResponse.json({
        error: 'Failed to get video content',
        status: response.status,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

  } catch (error) {
    console.error('Error getting video content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get video content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
