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
 * コスト最適化されたImageコンポーネント
 * - 小さな画像やSVG、GIFはunoptimizedで表示
 * - 品質を画像サイズに応じて最適化
 * - 優先度を適切に設定
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
  // 最適化を避けるべき画像かどうかを判定
  const shouldSkip = shouldSkipOptimization(src, width, height)
  
  // 品質を最適化（指定されていない場合）
  const optimizedQuality = quality || getOptimizedQuality(width, height)
  
  // 優先度を最適化
  const optimizedPriority = priority || getImagePriority(isImportant)
  
  // 最適化を避ける画像の場合はunoptimizedで表示
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
  
  // 通常の画像は最適化して表示
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
