import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ブランド映像ファイル取得 ===');
    
    const body = await request.json();
    const jobId = body.jobId;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
    
    console.log(`ブランド映像コンテンツ取得: ${contentUrl}`);
    
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    
    console.log(`レスポンスステータス: ${response.status}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength}`);
      
      if (contentType && contentType.includes('video/mp4')) {
        // MP4ファイルを取得
        const videoBuffer = await response.arrayBuffer();
        const videoSize = videoBuffer.byteLength;
        
        console.log(`ブランドMP4ファイル取得成功: ${videoSize} bytes`);
        
        // Base64エンコードしてレスポンスに含める
        const base64Data = Buffer.from(videoBuffer).toString('base64');
        const dataUrl = `data:video/mp4;base64,${base64Data}`;
        
        return NextResponse.json({
          message: 'Brand video file retrieved successfully',
          jobId,
          videoSize,
          contentType,
          dataUrl: dataUrl,
          note: 'Use the dataUrl to view the video in browser'
        });
      } else {
        return NextResponse.json({
          error: 'Unexpected content type',
          contentType,
          status: response.status
        });
      }
    } else {
      const errorData = await response.text();
      return NextResponse.json({
        error: 'Failed to get brand video content',
        status: response.status,
        errorData
      });
    }

  } catch (error) {
    console.error('Error getting brand video file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get brand video file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
