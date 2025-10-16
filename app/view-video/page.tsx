'use client';

import { useState, useEffect } from 'react';

export default function ViewVideoPage() {
  const [videoData, setVideoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoData();
  }, []);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-video-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video data');
      }

      const data = await response.json();
      
      if (data.dataUrl) {
        setVideoData(data.dataUrl);
      } else {
        setError('No video data found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">映像を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">エラー</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">映像が見つかりません</h2>
          <p className="text-yellow-600">映像データを取得できませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Sora2生成映像</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">生成された映像</h2>
          
          <div className="relative">
            <video
              src={videoData}
              controls
              className="w-full rounded-lg shadow-lg"
              poster="/placeholder-image.svg"
              autoPlay
              muted
              loop
            >
              お使いのブラウザは動画タグをサポートしていません。
            </video>
            
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
              Sora2生成
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">映像情報</h3>
                <p className="text-sm text-gray-600">
                  <strong>プロンプト:</strong> A red ball bouncing on a white background
                </p>
                <p className="text-sm text-gray-600">
                  <strong>モデル:</strong> sora-2
                </p>
                <p className="text-sm text-gray-600">
                  <strong>解像度:</strong> 1280x720
                </p>
                <p className="text-sm text-gray-600">
                  <strong>長さ:</strong> 4秒
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">技術情報</h3>
                <p className="text-sm text-gray-600">
                  <strong>形式:</strong> MP4
                </p>
                <p className="text-sm text-gray-600">
                  <strong>サイズ:</strong> 約460KB
                </p>
                <p className="text-sm text-gray-600">
                  <strong>生成時間:</strong> 約1-2分
                </p>
                <p className="text-sm text-gray-600">
                  <strong>ステータス:</strong> 完了
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = videoData;
                  link.download = 'sora2-generated-video.mp4';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                ダウンロード
              </button>
              
              <button
                onClick={() => window.open(videoData, '_blank')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                新しいタブで開く
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
