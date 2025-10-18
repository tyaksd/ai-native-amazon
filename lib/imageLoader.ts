// Custom image loader for Cloudinary images
// This helps with timeout issues by optimizing image loading and reducing costs

export default function cloudinaryLoader({ src, width, quality }: {
  src: string
  width: number
  quality?: number
}) {
  // If it's already a Cloudinary URL with transformations, return as-is
  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    return src
  }

  // If it's a Cloudinary URL without transformations, add optimized transformations
  if (src.includes('res.cloudinary.com')) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) return src

    // Extract the public_id from the URL
    const urlParts = src.split('/')
    const publicIdIndex = urlParts.findIndex(part => part === 'upload') + 1
    const publicId = urlParts.slice(publicIdIndex).join('/').split('.')[0]

    // コスト最適化のための変換設定
    const transformations = [
      `w_${width}`,
      `q_${quality || 80}`, // デフォルト品質を80に設定
      'f_webp', // WebPフォーマットに固定（変換数を削減）
      'c_limit', // アスペクト比を保持
      'fl_progressive' // プログレッシブJPEG（読み込み速度向上）
    ].join(',')

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`
  }

  // For non-Cloudinary URLs, return as-is
  return src
}
