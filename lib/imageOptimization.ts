// Image optimization utility functions
// Apply unoptimized property to small images, SVGs, and GIFs to reduce costs

/**
 * Get file extension from image URL
 */
export function getImageExtension(src: string): string {
  const url = new URL(src, 'https://example.com')
  const pathname = url.pathname
  const extension = pathname.split('.').pop()?.toLowerCase() || ''
  return extension
}

/**
 * Determine if image should skip optimization
 * - SVG files (vector images)
 * - GIF files (animated images)
 * - Small images (estimated to be 10KB or less)
 */
export function shouldSkipOptimization(src: string, width?: number, height?: number): boolean {
  const extension = getImageExtension(src)
  
  // Skip optimization for SVG files
  if (extension === 'svg') {
    return true
  }
  
  // Skip optimization for GIF files (animation may break)
  if (extension === 'gif') {
    return true
  }
  
  // Skip optimization for small images (estimated to be 10KB or less)
  // Images 16x16 or smaller have little benefit from optimization
  if (width && height && width <= 16 && height <= 16) {
    return true
  }
  
  // Also skip optimization for icon-sized images (32x32 or smaller)
  if (width && height && width <= 32 && height <= 32) {
    return true
  }
  
  return false
}

/**
 * Optimize image quality
 * High quality for large images, low quality is sufficient for small images
 */
export function getOptimizedQuality(width?: number, height?: number): number {
  if (!width || !height) return 80
  
  const area = width * height
  
  // High quality for large images (1920x1080 or larger)
  if (area >= 1920 * 1080) {
    return 85
  }
  
  // Standard quality for medium-sized images (800x600 or larger)
  if (area >= 800 * 600) {
    return 80
  }
  
  // Low quality is sufficient for small images
  return 75
}

/**
 * Set image priority
 * High quality for important images, low quality for decorative images
 */
export function getImagePriority(isImportant: boolean = false): boolean {
  return isImportant
}
