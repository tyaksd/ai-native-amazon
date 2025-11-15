'use client'

import Image from 'next/image'
import { shouldSkipOptimization, getOptimizedQuality, getImagePriority } from '@/lib/imageOptimization'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  fill?: boolean
  sizes?: string
  isImportant?: boolean
}

/**
 * Cost-optimized Image component
 * - Display small images, SVGs, and GIFs with unoptimized
 * - Optimize quality based on image size
 * - Set priority appropriately
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality,
  fill = false,
  sizes,
  isImportant = false
}: OptimizedImageProps) {
  // Determine if image should skip optimization
  const shouldSkip = shouldSkipOptimization(src, width, height)
  
  // Optimize quality (if not specified)
  const optimizedQuality = quality || getOptimizedQuality(width, height)
  
  // Optimize priority
  const optimizedPriority = priority || getImagePriority(isImportant)
  
  // Display with unoptimized for images that should skip optimization
  if (shouldSkip) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={optimizedPriority}
        unoptimized={true}
        fill={fill}
        sizes={sizes}
      />
    )
  }
  
  // Display normal images with optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={optimizedPriority}
      quality={optimizedQuality}
      fill={fill}
      sizes={sizes}
    />
  )
}
