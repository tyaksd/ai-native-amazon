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
// async function resizeImageToVideoSize(imageBuffer: ArrayBuffer, videoSize: string): Promise<Blob> {
//   const [width, height] = videoSize.split('x').map(Number);
//   
//   try {
//     // Sharpライブラリを使用してリサイズ
//     const sharp = (await import('sharp')).default;
//     const resizedBuffer = await sharp(Buffer.from(imageBuffer))
//       .resize(width, height, { 
//         fit: 'inside', // 全体を保持してリサイズ
//         withoutEnlargement: true // 拡大はしない
//       })
//       .png()
//       .toBuffer();
//     
//     console.log(`画像をリサイズしました: ${width}x${height}`);
//     return new Blob([new Uint8Array(resizedBuffer)], { type: 'image/png' });
//   } catch (error) {
//     console.error('Sharp resize failed, using original image:', error);
//     // Sharpが利用できない場合は元の画像を使用
//     return new Blob([imageBuffer], { type: 'image/png' });
//   }
// }

/**
 * AI画像拡張機能（OpenAI DALL-E 3を使用）
 */
async function extendImageWithAI(imageBuffer: ArrayBuffer, targetWidth: number, targetHeight: number): Promise<Blob> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    // 元画像をBase64に変換
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log(`AI画像拡張開始: ${targetWidth}x${targetHeight}`);

    // OpenAI DALL-E 3 APIを使用して画像を拡張
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: dataUrl,
        prompt: `Extend this image to fill a ${targetWidth}x${targetHeight} canvas. Maintain the original image's style, colors, and atmosphere. Generate natural extensions of the background and environment to fill the empty spaces.`,
        size: `${targetWidth}x${targetHeight}`,
        n: 1,
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DALL-E 3 API error:', errorData);
      throw new Error(`DALL-E 3 API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const extendedImageBuffer = Buffer.from(data.data[0].b64_json, 'base64');
    
    console.log(`AI画像拡張完了: ${targetWidth}x${targetHeight}`);
    
    return new Blob([extendedImageBuffer], { type: 'image/png' });
  } catch (error) {
    console.error('AI画像拡張エラー:', error);
    // エラーの場合は従来の黒パディング方式にフォールバック
    return resizeImageToExactSize(imageBuffer, targetWidth, targetHeight);
  }
}

/**
 * 画像を指定されたサイズに正確にリサイズする関数（Sora2 API要件対応）
 */
async function resizeImageToExactSize(imageBuffer: ArrayBuffer, targetWidth: number, targetHeight: number): Promise<Blob> {
  const sharp = (await import('sharp')).default;
  
  console.log(`画像を正確にリサイズ: ${targetWidth}x${targetHeight}`);
  
  // 縦長動画（720x1280）の場合は画像全体を保持してパディングを追加
  const isVerticalVideo = targetWidth === 720 && targetHeight === 1280;
  
  const resizedBuffer = await sharp(Buffer.from(imageBuffer))
    .resize(targetWidth, targetHeight, {
      fit: isVerticalVideo ? 'contain' : 'cover', // 縦長動画はcontain、横長動画はcover
      position: 'center', // 中央配置
      background: isVerticalVideo ? { r: 0, g: 0, b: 0, alpha: 1 } : undefined // 縦長動画の場合は黒背景
    })
    .png()
    .toBuffer();
    
  console.log(`リサイズ完了: ${targetWidth}x${targetHeight} (${isVerticalVideo ? 'contain with padding' : 'cover'})`);
  
  return new Blob([new Uint8Array(resizedBuffer)], { type: 'image/png' });
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
  brandDescription: string,
  duration?: number,
  resolution?: string
): Promise<string> {
  // 動画の長さとアスペクト比に応じてプロンプトを調整
  const isLongVideo = (duration || 4) > 4;
  const isVeryLongVideo = (duration || 4) >= 12;
  const isVerticalVideo = resolution === '720x1280';
  
  let basePrompt: string;
  
  // ブランドのdescriptionを使用して映像プロンプトを生成
  const brandAtmosphere = brandDescription || `A striking header background that embodies ${brandName}'s atmosphere and emotional tone.`;
  
  console.log('ブランド情報:', {
    brandName,
    brandDescription,
    brandAtmosphere
  });
  
  // 詳細でリアルな映像を生成するプロンプトを使用
  if (isVeryLongVideo) {
    if (isVerticalVideo) {
      basePrompt = `Create a 12-second video based on this brand concept: "${brandAtmosphere}". Create 7 different connected scenes exploring that world. Each scene should feel connected to the original but show new perspectives with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
    } else {
      basePrompt = `Create a 12-second video based on this brand concept: "${brandAtmosphere}". Start with the exact scene for 1.5 seconds, then show 7 different scenes over the next 10.5 seconds exploring that world. Each scene should feel connected to the original but show new perspectives with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
    }
  } else if (isLongVideo) {
    if (isVerticalVideo) {
      basePrompt = `Visualize the world of "{brandAtmosphere}" and create an experience of living within it.
Craft a cinematic journey that draws the viewer deep into this atmosphere.　Structure the film in six connected scenes, each captured from a different angle or distance.

`;
    } else {
      basePrompt = `Create a　8-second cinematic short film based on this brand concept: "${brandAtmosphere}". Create a cinematic journey through that world. Show 6 connected scenes from different angles or distances, each revealing a new moment or subtle event occurring in that environment.
Keep camera movement smooth and natural. The focus is not on camera movement itself, but on what's unfolding within the scene. 
Aim for photorealistic quality and refined color grading. The result should feel like a short immersive film — calm yet captivating, drawing the viewer into the world as if they are truly witnessing it.
`;
    }
  } else {
    if (isVerticalVideo) {
      basePrompt = `Create a 4-second video based on this brand concept: "${brandAtmosphere}". Create a cinematic experience with gentle camera movements. Show different angles of the environment with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
    } else {
      basePrompt = `Create a 4-second video based on this brand concept: "${brandAtmosphere}". Start with the exact scene, then animate with gentle camera movements. Show different angles of the same environment with smooth transitions. The video should look like real footage with natural lighting, realistic textures, and authentic camera movements. Use cinematic techniques like depth of field, natural shadows, and realistic color grading to create a photorealistic experience.`;
    }
  }

  console.log(`Using ${isVerticalVideo ? 'vertical' : 'horizontal'} video prompt for Sora2 video generation`);
  console.log('Generated prompt:', basePrompt);
  console.log('Final prompt length:', basePrompt.length);
  
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
      // 縦長動画の場合はAI画像拡張を使用、それ以外は従来のリサイズ
      const resizedImageBlob = isVerticalVideo 
        ? await extendImageWithAI(imageBuffer, targetWidth, targetHeight)
        : await resizeImageToExactSize(imageBuffer, targetWidth, targetHeight);
      
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
export async function checkVideoGenerationStatus(jobId: string, retryCount: number = 0): Promise<Sora2VideoResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const maxRetries = 3;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

  try {
    // GET /videos/{video_id} でステータスを確認
    const statusResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await statusResponse.json();
        errorMessage = errorData.error?.message || errorData.message || `HTTP ${statusResponse.status}`;
      } catch (parseError) {
        errorMessage = `HTTP ${statusResponse.status}: ${statusResponse.statusText}`;
      }
      
      // サーバーエラーの場合はリトライを試行
      if (statusResponse.status >= 500) {
        console.error(`Sora2 API server error (${statusResponse.status}):`, errorMessage);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return checkVideoGenerationStatus(jobId, retryCount + 1);
        } else {
          throw new Error(`Sora2 API server error after ${maxRetries} retries: ${errorMessage}`);
        }
      } else {
        throw new Error(`OpenAI Sora2 API error: ${errorMessage}`);
      }
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
        } else if (contentResponse.status === 404) {
          console.log(`動画ファイルがまだ利用できません (404). 動画生成が完了していない可能性があります。`);
          // 404の場合は動画がまだ生成中なので、videoUrlはundefinedのまま
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
      description: brand.description,
      descriptionLength: brand.description?.length || 0
    });

    // ブランドのdescriptionを使用して映像プロンプトを生成
    const videoPrompt = await generateVideoPromptFromBrandConcept(
      brand.name,
      brand.description || '', // ブランドのdescriptionを使用
      params.duration,
      params.resolution
    );

    console.log('生成されたプロンプト:', videoPrompt);

    // Sora2で映像生成を開始（画像は使用せず、テキストプロンプトのみ）
    const videoRequest: Sora2VideoRequest = {
      prompt: videoPrompt,
      model: 'sora-2',
      seconds: params.duration || 4,
      size: params.resolution || '1280x720'
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
        if (statusResponse.status === 404) {
          console.log(`動画ジョブが見つかりません (404). ジョブID: ${jobId}`);
          // 404の場合は動画生成がまだ開始されていない可能性があるので、待機を続ける
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          } else {
            throw new Error(`動画ジョブが見つかりません: ${jobId}`);
          }
        } else {
          const errorData = await statusResponse.json();
          throw new Error(`OpenAI Sora2 API error: ${errorData.error?.message || 'Unknown error'}`);
        }
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
