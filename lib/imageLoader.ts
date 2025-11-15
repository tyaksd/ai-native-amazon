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

    // Transformation settings for cost optimization
    const transformations = [
      `w_${width}`,
      `q_${quality || 80}`, // Set default quality to 80
      'f_webp', // Fixed to WebP format (reduce number of conversions)
      'c_limit', // Preserve aspect ratio
      'fl_progressive' // Progressive JPEG (improve loading speed)
    ].join(',')

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`
  }

  // For non-Cloudinary URLs, return as-is
  return src
}
