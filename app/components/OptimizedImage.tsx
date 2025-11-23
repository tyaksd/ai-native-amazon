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
  
  // When fill is true, width and height should not be specified
  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes,
        className: className,
        priority: optimizedPriority,
        ...(shouldSkip ? { unoptimized: true } : { quality: optimizedQuality })
      }
    : {
        width: width,
        height: height,
        className: className,
        priority: optimizedPriority,
        ...(shouldSkip ? { unoptimized: true } : { quality: optimizedQuality })
      }

  return (
    <Image
      src={src}
      alt={alt}
      {...imageProps}
    />
  )
}
