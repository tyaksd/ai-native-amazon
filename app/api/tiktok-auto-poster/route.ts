import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, imageUrl, videoUrl, scheduledTime } = body;

    console.log('TikTok Auto Poster - Received data:', {
      text: text?.substring(0, 100) + '...',
      hasImage: !!imageUrl,
      hasVideo: !!videoUrl,
      scheduledTime
    });

    // TikTok API設定（実際のAPIキーは環境変数から取得）
    const TIKTOK_API_KEY = process.env.TIKTOK_API_KEY;
    const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

    if (!TIKTOK_API_KEY || !TIKTOK_ACCESS_TOKEN) {
      console.error('TikTok API credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'TikTok API credentials not configured'
      }, { status: 500 });
    }

    // TikTok投稿用のデータを準備
    const postData = {
      text: text || '',
      media: videoUrl || imageUrl, // TikTokは主に動画、画像も対応
      scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : undefined
    };

    // TikTok APIへの投稿リクエスト
    const tiktokResponse = await fetch('https://open-api.tiktok.com/v2/post/publish/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-TikTok-Api-Key': TIKTOK_API_KEY
      },
      body: JSON.stringify(postData)
    });

    const tiktokResult = await tiktokResponse.json();

    if (tiktokResponse.ok && tiktokResult.data) {
      console.log('TikTok post successful:', tiktokResult.data);
      
      return NextResponse.json({
        success: true,
        message: 'TikTok post published successfully',
        data: {
          postId: tiktokResult.data.id,
          url: tiktokResult.data.url,
          platform: 'tiktok'
        }
      });
    } else {
      console.error('TikTok API error:', tiktokResult);
      
      return NextResponse.json({
        success: false,
        error: tiktokResult.error?.message || 'Failed to post to TikTok',
        details: tiktokResult
      }, { status: 400 });
    }

  } catch (error) {
    console.error('TikTok Auto Poster Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
