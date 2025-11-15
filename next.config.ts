import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Extend image processing timeout
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Extend image optimization timeout
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    
    // Cost optimization settings
    // Set cache period to 31 days (if images are not changed within a month)
    minimumCacheTTL: 2678400, // 31 days (seconds)
    
    // Limit image format to WebP only (reduce number of conversions)
    formats: ['image/webp'],
    
    // Limit device sizes (reduce unnecessary size conversions)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    
    // Limit image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
