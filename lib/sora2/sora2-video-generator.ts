import { supabase } from '../supabase';

export interface Sora2VideoRequest {
  prompt: string;
  model?: string;
  seconds?: number;
  size?: string;
  image_url?: string; // For image-to-video generation
}

/**
 * 画像を動画サイズにリサイズ（Sharpライブラリを使用）
 */
async function resizeImageToVideoSize(imageBuffer: ArrayBuffer, videoSize: string): Promise<Blob> {
  const [width, height] = videoSize.split('x').map(Number);
  
  try {
    // Sharpライブラリを使用してリサイズ
    const sharp = (await import('sharp')).default;
    const resizedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(width, height, { 
        fit: 'inside', // 全体を保持してリサイズ
        withoutEnlargement: true // 拡大はしない
      })
      .png()
      .toBuffer();
    
    console.log(`画像をリサイズしました: ${width}x${height}`);
    return new Blob([new Uint8Array(resizedBuffer)], { type: 'image/png' });
  } catch (error) {
    console.error('Sharp resize failed, using original image:', error);
    // Sharpが利用できない場合は元の画像を使用
    return new Blob([imageBuffer], { type: 'image/png' });
  }
}

/**
 * 画像を指定されたサイズに正確にリサイズする関数（Sora2 API要件対応）
 */
async function resizeImageToExactSize(imageBuffer: ArrayBuffer, targetWidth: number, targetHeight: number): Promise<Blob> {
  const sharp = (await import('sharp')).default;
  
  console.log(`画像を正確にリサイズ: ${targetWidth}x${targetHeight}`);
  
  const resizedBuffer = await sharp(Buffer.from(imageBuffer))
    .resize(targetWidth, targetHeight, {
      fit: 'cover', // アスペクト比を保持しつつ、指定サイズにフィット
      position: 'center' // 中央からクロップ
    })
    .png()
    .toBuffer();
    
  console.log(`リサイズ完了: ${targetWidth}x${targetHeight}`);
  
  return new Blob([resizedBuffer], { type: 'image/png' });
}

export interface Sora2VideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  video_url?: string;
  error?: string;
  progress?: number;
}

export interface BrandVideoGenerationParams {
  brandId: string;
  duration?: number; // seconds
  resolution?: string;
  useBackgroundImage?: boolean;
}

/**
 * ブランドコンセプトから映像プロンプトを生成するAIロジック
 */
export async function generateVideoPromptFromBrandConcept(
  brandName: string,
  brandConcept: string,
  designConcept: string,
  backgroundImageDescription?: string,
  duration?: number,
  resolution?: string
): Promise<string> {
  // 動画の長さとアスペクト比に応じてプロンプトを調整
  const isLongVideo = (duration || 4) > 4;
  const isVeryLongVideo = (duration || 4) >= 12;
  const isVerticalVideo = resolution === '720x1280';
  
  let basePrompt: string;
  
  // 詳細でリアルな映像を生成するプロンプトを使用
  if (isVeryLongVideo) {
    basePrompt = `Create a 12-second video using the provided image. Start with the exact scene for 1.5 seconds, then show 7 different scenes over the next 10.5 seconds exploring that world. Each scene should feel connected to the original but show new perspectives with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
  } else if (isLongVideo) {
    basePrompt = `Create an 8-second video using the provided image. Start with the exact scene for 1.5 seconds, then show 5 different scenes over the next 6.5 seconds exploring that world. Each scene should feel connected to the original but show new perspectives with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
  } else {
    basePrompt = `Create a 4-second video using the provided image. Start with the exact scene from the image, then animate with gentle camera movements. Show different angles of the same environment with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
  }

  console.log(`Using ${isVerticalVideo ? 'vertical' : 'horizontal'} video prompt for Sora2 video generation`);
  console.log('Generated prompt:', basePrompt);
  
  return basePrompt;
}


/**
 * OpenAI APIを使用してSora2で映像を生成
 */
export async function generateVideoWithSora2(
  request: Sora2VideoRequest
): Promise<Sora2VideoResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    console.log('Sora2 API request:', {
      model: request.model || 'sora-2',
      prompt: request.prompt.substring(0, 50) + '...',
      seconds: String(request.seconds || 4),
      size: request.size || '1280x720',
      hasImage: !!request.image_url
    });

    // 画像がある場合はFormDataを使用、ない場合はJSONを使用
    let body: string | FormData;
    let headers: Record<string, string>;

    const isVerticalVideo = request.size === '720x1280';
    
    if (request.image_url) {
      // 横長・縦長動画ともに画像を使用
      console.log(`${isVerticalVideo ? '縦長' : '横長'}動画: 画像をダウンロード中:`, request.image_url);
      const imageResponse = await fetch(request.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Sora2 APIの要件に合わせて画像をリサイズ
      const videoSize = request.size || '1280x720';
      const [targetWidth, targetHeight] = videoSize.split('x').map(Number);
      
      console.log(`リサイズ対象: ${targetWidth}x${targetHeight}`);
      
      // 元画像のサイズを取得
      const sharp = (await import('sharp')).default;
      const imageInfo = await sharp(Buffer.from(imageBuffer)).metadata();
      const originalAspectRatio = imageInfo.width! / imageInfo.height!;
      const targetAspectRatio = targetWidth / targetHeight;
      
      console.log(`元画像サイズ: ${imageInfo.width}x${imageInfo.height}, アスペクト比: ${originalAspectRatio.toFixed(2)}`);
      console.log(`目標サイズ: ${targetWidth}x${targetHeight}, アスペクト比: ${targetAspectRatio.toFixed(2)}`);
      
      // Sora2 APIの要件: 画像サイズが動画サイズと完全に一致する必要がある
      const resizedImageBlob = await resizeImageToExactSize(imageBuffer, targetWidth, targetHeight);
      
      const formData = new FormData();
      formData.append('model', request.model || 'sora-2');
      formData.append('prompt', request.prompt);
      formData.append('seconds', String(request.seconds || 4));
      formData.append('size', request.size || '1280x720');
      formData.append('input_reference', resizedImageBlob, 'background.png');
      
      body = formData;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
      };
    } else if (isVerticalVideo) {
      console.log('縦長動画: 画像を使用せずにテキストプロンプトのみで生成');
      // 縦長動画の場合はJSONで送信
      body = JSON.stringify({
        model: request.model || 'sora-2',
        prompt: request.prompt,
        seconds: String(request.seconds || 4),
        size: request.size || '1280x720'
      });
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    } else {
      // 画像がない場合はJSONで送信
      body = JSON.stringify({
        model: request.model || 'sora-2',
        prompt: request.prompt,
        seconds: String(request.seconds || 4),
        size: request.size || '1280x720'
      });
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sora2 API error:', errorData);
      
      // Moderation errorの詳細ログ
      if (errorData.error?.code === 'moderation_blocked') {
        console.error('Moderation blocked - prompt was:', request.prompt);
        console.error('Error details:', errorData.error);
      }
      
      throw new Error(`OpenAI Sora2 API error: ${errorData.error?.message || errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: 'pending',
      video_url: undefined
    };
  } catch (error) {
    console.error('Error calling OpenAI Sora2 API:', error);
    throw error;
  }
}

/**
 * 映像生成ジョブのステータスを確認（公式ドキュメント準拠）
 */
export async function checkVideoGenerationStatus(jobId: string): Promise<Sora2VideoResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    // GET /videos/{video_id} でステータスを確認
    const statusResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      throw new Error(`OpenAI Sora2 API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const statusData = await statusResponse.json();
    
    console.log(`映像生成ステータス: ${statusData.status}, 進捗: ${statusData.progress || 0}%`);
    
    // ステータスが完了している場合のみ、映像データを取得
    let videoUrl: string | undefined = undefined;
    
    if (statusData.status === 'completed') {
      try {
        // GET /videos/{video_id}/content でMP4ファイルを取得
        const contentResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (contentResponse.ok) {
          const contentType = contentResponse.headers.get('content-type');
          
          if (contentType && contentType.includes('video/mp4')) {
            // MP4ファイルを直接取得してBase64データURLを作成
            const videoBuffer = await contentResponse.arrayBuffer();
            const videoSize = videoBuffer.byteLength;
            
            console.log(`MP4ファイル取得成功: ${videoSize} bytes`);
            
            // Base64データURLを作成
            const base64Data = Buffer.from(videoBuffer).toString('base64');
            videoUrl = `data:video/mp4;base64,${base64Data}`;
            
            console.log(`Base64データURL作成成功: ${videoUrl.substring(0, 100)}...`);
          } else {
            console.warn(`予期しないコンテンツタイプ: ${contentType}`);
          }
        } else {
          console.error(`コンテンツ取得失敗: ${contentResponse.status}`);
        }
      } catch (contentError) {
        console.error('映像コンテンツ取得エラー:', contentError);
      }
    }

    return {
      id: statusData.id,
      status: statusData.status === 'completed' ? 'succeeded' : 
              statusData.status === 'failed' ? 'failed' : 'processing',
      video_url: videoUrl,
      error: statusData.error,
      progress: statusData.progress
    };
  } catch (error) {
    console.error('Error checking video status:', error);
    throw error;
  }
}

/**
 * ブランドの映像を生成するメイン関数
 */
export async function generateBrandVideo(
  params: BrandVideoGenerationParams
): Promise<{ jobId: string; status: string }> {
  try {
    console.log('ブランド動画生成開始:', params);
    
    // ブランドデータを取得
    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', params.brandId)
      .single();

    if (error || !brand) {
      console.error('ブランド取得エラー:', error);
      throw new Error('Brand not found');
    }

    console.log('取得したブランドデータ:', {
      id: brand.id,
      name: brand.name,
      hasBackgroundImage: !!brand.background_image,
      backgroundImage: brand.background_image
    });

    // 映像プロンプトを生成（アスペクト比に応じて処理を分ける）
    const isVerticalVideo = params.resolution === '720x1280';
    
    // background_imageの説明は使用しない（moderation回避）
    const backgroundDescription = undefined;
    
    const videoPrompt = await generateVideoPromptFromBrandConcept(
      brand.name,
      '', // brand conceptは空文字（moderation回避）
      '', // design conceptも空文字（moderation回避）
      backgroundDescription, // background image descriptionは使用
      params.duration,
      params.resolution // resolutionを追加
    );

    // Sora2で映像生成を開始
    const videoRequest: Sora2VideoRequest = {
      prompt: videoPrompt,
      model: 'sora-2',
      seconds: params.duration || 4,
      size: params.resolution || '1280x720',
      // 横長・縦長動画ともに背景画像を使用
      ...(params.useBackgroundImage && brand.background_image && {
        image_url: brand.background_image
      })
    };

    const videoResponse = await generateVideoWithSora2(videoRequest);

    return {
      jobId: videoResponse.id,
      status: videoResponse.status
    };
  } catch (error) {
    console.error('Error generating brand video:', error);
    throw error;
  }
}

/**
 * 生成された映像をCloudinaryに保存
 */
export async function saveVideoToCloudinary(
  videoUrl: string,
  brandId: string,
  publicId?: string
): Promise<string> {
  try {
    const response = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        folder: `brands/${brandId}/videos`,
        public_id: publicId || `brand-video-${Date.now()}`,
        resource_type: 'video'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload video to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error saving video to Cloudinary:', error);
    throw error;
  }
}

/**
 * 映像データを直接Cloudinaryにアップロード
 */
export async function uploadVideoDataToCloudinary(
  videoBuffer: ArrayBuffer,
  brandId: string,
  publicId?: string
): Promise<string> {
  try {
    // ArrayBufferをBase64に変換
    const base64Data = Buffer.from(videoBuffer).toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64Data}`;
    
    const response = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: dataUrl,
        folder: `brands/${brandId}/videos`,
        public_id: publicId || `brand-video-${Date.now()}`,
        resource_type: 'video'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload video data to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading video data to Cloudinary:', error);
    throw error;
  }
}

/**
 * 映像生成の進捗をポーリング（公式ドキュメント準拠）
 */
export async function pollVideoGenerationWithProgress(
  jobId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<Sora2VideoResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const maxAttempts = 60; // 最大5分間（5秒間隔）
  const pollInterval = 5000; // 5秒間隔
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(`OpenAI Sora2 API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const statusData = await statusResponse.json();
      const progress = statusData.progress || 0;
      const status = statusData.status;
      
      console.log(`映像生成進捗: ${status} - ${progress}% (試行 ${attempt}/${maxAttempts})`);
      
      // 進捗コールバックを呼び出し
      if (onProgress) {
        onProgress(progress, status);
      }
      
      // 完了または失敗の場合は終了
      if (status === 'completed' || status === 'failed') {
        return {
          id: statusData.id,
          status: status === 'completed' ? 'succeeded' : 'failed',
          video_url: undefined, // 後で取得
          error: statusData.error,
          progress: progress
        };
      }
      
      // まだ処理中の場合は待機
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
    } catch (error) {
      console.error(`ポーリング試行 ${attempt} でエラー:`, error);
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  // タイムアウト
  throw new Error('映像生成がタイムアウトしました');
}
