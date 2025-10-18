// 画像最適化のユーティリティ関数
// 小さな画像やSVG、GIFにunoptimizedプロパティを適用してコストを削減

/**
 * 画像URLからファイル拡張子を取得
 */
export function getImageExtension(src: string): string {
  const url = new URL(src, 'https://example.com')
  const pathname = url.pathname
  const extension = pathname.split('.').pop()?.toLowerCase() || ''
  return extension
}

/**
 * 画像が最適化を避けるべきかどうかを判定
 * - SVGファイル（ベクター画像）
 * - GIFファイル（アニメーション画像）
 * - 小さな画像（10KB以下と推定される画像）
 */
export function shouldSkipOptimization(src: string, width?: number, height?: number): boolean {
  const extension = getImageExtension(src)
  
  // SVGファイルは最適化を避ける
  if (extension === 'svg') {
    return true
  }
  
  // GIFファイルは最適化を避ける（アニメーションが壊れる可能性）
  if (extension === 'gif') {
    return true
  }
  
  // 小さな画像は最適化を避ける（10KB以下と推定）
  // 16x16以下の画像は最適化の恩恵が少ない
  if (width && height && width <= 16 && height <= 16) {
    return true
  }
  
  // アイコンサイズの画像（32x32以下）も最適化を避ける
  if (width && height && width <= 32 && height <= 32) {
    return true
  }
  
  return false
}

/**
 * 画像の品質を最適化
 * 大きな画像は高品質、小さな画像は低品質で十分
 */
export function getOptimizedQuality(width?: number, height?: number): number {
  if (!width || !height) return 80
  
  const area = width * height
  
  // 大きな画像（1920x1080以上）は高品質
  if (area >= 1920 * 1080) {
    return 85
  }
  
  // 中サイズの画像（800x600以上）は標準品質
  if (area >= 800 * 600) {
    return 80
  }
  
  // 小さな画像は低品質で十分
  return 75
}

/**
 * 画像の優先度を設定
 * 重要な画像は高品質、装飾的な画像は低品質
 */
export function getImagePriority(isImportant: boolean = false): boolean {
  return isImportant
}
