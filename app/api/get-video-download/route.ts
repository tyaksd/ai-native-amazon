import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 映像ダウンロードURL取得 ===');
    
    const jobId = 'video_68ef5eb8294c8198a527f7da9cb3c6cb066b75c8f17ddfc2';
    
    // 映像ダウンロード用のエンドポイントを試す
    const downloadUrl = `https://api.openai.com/v1/videos/${jobId}/download`;
    
    console.log(`ダウンロードURL取得中: ${downloadUrl}`);
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`レスポンスステータス: ${response.status}`);
    console.log(`レスポンスヘッダー:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      // レスポンスがリダイレクトの場合
      if (response.status === 302 || response.status === 301) {
        const redirectUrl = response.headers.get('location');
        return NextResponse.json({
          message: 'Video download URL found',
          jobId,
          downloadUrl: redirectUrl,
          status: 'redirect',
          redirectLocation: redirectUrl
        });
      }
      
      // 直接URLが返される場合
      const responseText = await response.text();
      return NextResponse.json({
        message: 'Video download response received',
        jobId,
        responseText,
        status: 'success'
      });
    } else {
      const errorData = await response.text();
      return NextResponse.json({
        error: 'Failed to get download URL',
        status: response.status,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

  } catch (error) {
    console.error('Error getting video download URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get video download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
