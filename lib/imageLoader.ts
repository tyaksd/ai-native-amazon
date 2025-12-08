// Custom image loader for Cloudinary images
// This helps with timeout issues by optimizing image loading and reducing costs

export default function cloudinaryLoader({ src, width, quality }: {
  src: string
  width: number
  quality?: number
}) {
  // If it's not a Cloudinary URL, return as-is
  if (!src.includes('res.cloudinary.com')) {
    return src
  }

  // Check if it's already a Cloudinary URL with transformations
  // Transformation parameters start with letters like w_, h_, c_, l_, q_, etc.
  // Version numbers start with 'v' followed by digits
  // We need to distinguish between: /image/upload/v123/ (no transformations) vs /image/upload/w_800/ (has transformations)
  const hasTransformations = src.includes('/image/upload/') && 
    (src.includes('/l_') || // Composite image with overlay
     src.match(/\/image\/upload\/(w_|h_|c_|q_|f_|fl_|a_|b_|d_|e_|g_|o_|p_|r_|s_|t_|u_|x_|y_|z_)/)) // Has transformation parameters
  
  if (hasTransformations) {
    // For existing product images that already have transformations, replace or add width
    // Always use the width parameter passed to the loader (Next.js optimization requirement)
    const uploadIndex = src.indexOf('/image/upload/')
    if (uploadIndex !== -1) {
      const insertPos = uploadIndex + '/image/upload/'.length
      const before = src.substring(0, insertPos)
      let after = src.substring(insertPos)
      
      // Replace the first width parameter (main image width, not overlay width)
      // Match w_ followed by digits at the start of transformations (before /l_ or comma)
      // This ensures we only replace the main image width, not overlay widths
      const mainWidthMatch = after.match(/^(w_\d+(\.\d+)?)/)
      if (mainWidthMatch) {
        // Replace the first width parameter
        after = after.replace(/^w_\d+(\.\d+)?/, `w_${width}`)
      } else {
        // If no width at the start, add it
        after = `w_${width},${after}`
      }
      
      return `${before}${after}`
    }
    return src
  }

  // For Cloudinary URLs without transformations, add width transformation
  // Find /image/upload/ and insert w_{width}, after it
  const uploadIndex = src.indexOf('/image/upload/')
  if (uploadIndex !== -1) {
    const insertPos = uploadIndex + '/image/upload/'.length
    const before = src.substring(0, insertPos)
    const after = src.substring(insertPos)
    // Add quality if specified
    const qualityParam = quality ? `,q_${quality}` : ''
    return `${before}w_${width}${qualityParam}/${after}`
  }

  return src
}
