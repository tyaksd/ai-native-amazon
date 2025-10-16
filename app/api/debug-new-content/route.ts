import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== 新しい映像の/content エンドポイントデバッグ ===');
    
    const jobId = 'video_68ef7211b81c8193b6fbd4b94438994a00e0e1c2947d2d39';
    const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
    
    console.log(`新しい映像のコンテンツエンドポイント: ${contentUrl}`);
    
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    
    console.log(`レスポンスステータス: ${response.status}`);
    console.log(`レスポンスヘッダー:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const location = response.headers.get('location');
      
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength}`);
      console.log(`Location: ${location}`);
      
      if (contentType && contentType.includes('video')) {
        // 映像データの場合
        return NextResponse.json({
          message: 'New video content detected',
          jobId,
          contentType,
          contentLength,
          location,
          status: 'video_data',
          note: 'This is binary video data, not a URL'
        });
      } else if (location) {
        // リダイレクトURLの場合
        return NextResponse.json({
          message: 'New video redirect URL found',
          jobId,
          videoUrl: location,
          status: 'redirect',
          contentType,
          contentLength
        });
      } else {
        // テキストレスポンスの場合
        const textResponse = await response.text();
        return NextResponse.json({
          message: 'New video text response received',
          jobId,
          responseText: textResponse,
          status: 'text',
          contentType,
          contentLength
        });
      }
    } else {
      const errorData = await response.text();
      return NextResponse.json({
        error: 'Failed to get new video content',
        status: response.status,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

  } catch (error) {
    console.error('Error in new video content debug:', error);
    return NextResponse.json(
      { 
        error: 'New video content debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
