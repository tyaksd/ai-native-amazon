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
    // 画像処理のタイムアウトを延長
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 画像最適化のタイムアウトを延長
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    
    // コスト最適化設定
    // キャッシュ期間を31日に設定（画像が1ヶ月以内に変更されない場合）
    minimumCacheTTL: 2678400, // 31日（秒）
    
    // 画像フォーマットをWebPのみに制限（変換数を削減）
    formats: ['image/webp'],
    
    // デバイスサイズを制限（不要なサイズの変換を削減）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    
    // 画像サイズを制限
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
