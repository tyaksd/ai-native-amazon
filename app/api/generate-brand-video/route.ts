import { NextRequest, NextResponse } from 'next/server';
import { generateBrandVideo, checkVideoGenerationStatus, saveVideoToCloudinary } from '../../../lib/sora2/sora2-video-generator';

export async function POST(request: NextRequest) {
  try {
    const {
      brandId,
      duration = 5,
      resolution = '1280x720',
      useBackgroundImage = false
    } = await request.json();

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // ブランドの映像生成を開始
    const result = await generateBrandVideo({
      brandId,
      duration,
      resolution,
      useBackgroundImage
    });

    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      message: 'Video generation started successfully'
    });

  } catch (error) {
    console.error('Error starting video generation:', error);
    
    // Check for moderation errors specifically
    if (error instanceof Error && error.message.includes('moderation_blocked')) {
      return NextResponse.json(
        { 
          error: 'Content blocked by moderation system',
          details: 'The video generation request was blocked by content moderation. Please try with different content or a simpler prompt.',
          code: 'moderation_blocked'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to start video generation',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    console.log(`ブランド動画ステータス確認: ${jobId}`);

    // 映像生成ステータスを確認（テストと同じ仕組み）
    const status = await checkVideoGenerationStatus(jobId);

    console.log(`ブランド動画結果:`, {
      jobId: status.id,
      status: status.status,
      hasVideoUrl: !!status.video_url,
      videoUrlType: status.video_url?.substring(0, 50)
    });

    return NextResponse.json({
      jobId: status.id,
      status: status.status,
      videoUrl: status.video_url,
      error: status.error,
      progress: status.progress
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      jobId,
      brandId,
      videoUrl
    } = await request.json();

    if (!jobId || !brandId || !videoUrl) {
      return NextResponse.json(
        { error: 'Job ID, Brand ID, and Video URL are required' },
        { status: 400 }
      );
    }

    // 生成された映像をCloudinaryに保存
    const cloudinaryUrl = await saveVideoToCloudinary(videoUrl, brandId);

    // データベースに映像URLを保存
    const { supabase } = await import('../../../lib/supabase');
    const { error } = await supabase
      .from('brands')
      .update({ 
        background_video: cloudinaryUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', brandId);

    if (error) {
      throw new Error('Failed to save video URL to database');
    }

    return NextResponse.json({
      success: true,
      videoUrl: cloudinaryUrl,
      message: 'Video saved successfully'
    });

  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    );
  }
}