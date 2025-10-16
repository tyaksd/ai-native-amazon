import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Define Cloudinary upload result type
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // JSONデータの場合（Sora2からの映像データ）
      const body = await request.json();
      
      if (body.data && body.data.startsWith('data:video/')) {
        // Base64データURLから映像データを抽出
        const base64Data = body.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // リソースタイプを設定
        const resource_type = body.resource_type || 'video';
        const folder = body.folder || 'sns-uploads';
        const public_id = body.public_id;
        
        // Cloudinaryにアップロード
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: folder,
              resource_type: resource_type,
              public_id: public_id,
              overwrite: true,
              invalidate: true
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        return NextResponse.json({
          success: true,
          secure_url: (result as CloudinaryUploadResult).secure_url,
          public_id: (result as CloudinaryUploadResult).public_id,
          format: (result as CloudinaryUploadResult).format,
          width: (result as CloudinaryUploadResult).width,
          height: (result as CloudinaryUploadResult).height,
          bytes: (result as CloudinaryUploadResult).bytes
        });
      } else if (body.url) {
        // URLからのアップロード
        const result = await cloudinary.uploader.upload(body.url, {
          folder: body.folder || 'sns-uploads',
          resource_type: body.resource_type || 'video',
          public_id: body.public_id,
          overwrite: true,
          invalidate: true
        });

        return NextResponse.json({
          success: true,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'No valid data provided' },
          { status: 400 }
        );
      }
    } else {
      // FormDataの場合（従来のファイルアップロード）
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine resource type based on file type
      const resource_type = file.type.startsWith('video/') ? 'video' : 'image';

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'sns-uploads',
            resource_type: resource_type,
            overwrite: true,
            invalidate: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: (result as CloudinaryUploadResult).secure_url,
        public_id: (result as CloudinaryUploadResult).public_id,
        format: (result as CloudinaryUploadResult).format,
        width: (result as CloudinaryUploadResult).width,
        height: (result as CloudinaryUploadResult).height,
        bytes: (result as CloudinaryUploadResult).bytes
      });
    }

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
