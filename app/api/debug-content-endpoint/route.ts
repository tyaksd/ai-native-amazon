import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== /content エンドポイントの詳細デバッグ ===');
    
    const jobId = 'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2';
    const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
    
    console.log(`コンテンツエンドポイント: ${contentUrl}`);
    
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    
    console.log(`レスポンスステータス: ${response.status}`);
    console.log(`レスポンスヘッダー:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      // レスポンスの内容を確認
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const location = response.headers.get('location');
      
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength}`);
      console.log(`Location: ${location}`);
      
      if (contentType && contentType.includes('video')) {
        // 映像データの場合
        return NextResponse.json({
          message: 'Video content detected',
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
          message: 'Redirect URL found',
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
          message: 'Text response received',
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
        error: 'Failed to get content',
        status: response.status,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

  } catch (error) {
    console.error('Error in content endpoint debug:', error);
    return NextResponse.json(
      { 
        error: 'Content endpoint debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
