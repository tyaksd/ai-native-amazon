'use client';

import { useState, useEffect } from 'react';
import { Loader2, Play, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

// Button component (simple implementation)
const Button = ({ children, onClick, variant = 'default', className = '', ...props }: any) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface VideoGeneratorProps {
  brandId: string;
  brandName: string;
  brandConcept: string;
  designConcept: string;
  targetAudience: string;
  backgroundImage?: string;
  onVideoGenerated?: (videoUrl: string) => void;
}

interface VideoGenerationStatus {
  jobId: string | null;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'error';
  videoUrl: string | null;
  error: string | null;
}

export default function VideoGenerator({
  brandId,
  brandName,
  brandConcept,
  designConcept,
  targetAudience,
  backgroundImage,
  onVideoGenerated
}: VideoGeneratorProps) {
  // Debug logging
  console.log('VideoGenerator props:', {
    brandId,
    brandName,
    brandConcept,
    designConcept,
    targetAudience,
    backgroundImage
  });
  const [videoStatus, setVideoStatus] = useState<VideoGenerationStatus>({
    jobId: null,
    status: 'idle',
    videoUrl: null,
    error: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSettings, setGenerationSettings] = useState({
    duration: 4,
    resolution: '1280x720',
    useBackgroundImage: true
  });

  // 映像生成を開始（修正版）
  const startVideoGeneration = async () => {
    setIsGenerating(true);
    setVideoStatus(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      const response = await fetch('/api/generate-brand-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId,
          duration: generationSettings.duration,
          resolution: generationSettings.resolution,
          useBackgroundImage: generationSettings.useBackgroundImage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Video generation API error:', errorData);
        
        // Handle moderation errors specifically
        if (errorData.code === 'moderation_blocked') {
          throw new Error('Content blocked by moderation system. Please try with different content or a simpler prompt.');
        }
        
        const errorMessage = errorData.details || errorData.error || 'Failed to start video generation';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const data = await response.json();
      setVideoStatus(prev => ({
        ...prev,
        jobId: data.jobId,
        status: 'processing'
      }));

      // ポーリングでステータスを確認
      pollVideoStatus(data.jobId);

    } catch (error) {
      console.error('Error starting video generation:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Unknown error occurred';
      setVideoStatus(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // 映像生成ステータスをポーリング（修正版）
  const pollVideoStatus = async (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 最大10分間（5秒間隔）
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`ポーリング試行 ${pollCount}/${maxPolls} (経過時間: ${Math.round(pollCount * 5 / 60)}分)`);
      
      try {
        const response = await fetch(`/api/generate-brand-video?jobId=${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check video status');
        }

        const data = await response.json();
        console.log('ポーリング結果:', data);
        
        if (data.status === 'succeeded' && data.videoUrl) {
          console.log('Video generation completed:', data.videoUrl);
          
          // 映像生成完了、直接表示
          setVideoStatus(prev => ({
            ...prev,
            status: 'completed',
            videoUrl: data.videoUrl
          }));
          // 親コンポーネントに映像URLを通知
          if (onVideoGenerated) {
            onVideoGenerated(data.videoUrl);
          }
          // 動画が表示されるようにスクロール
          setTimeout(() => {
            const videoElement = document.querySelector('video');
            if (videoElement) {
              videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          const errorMessage = data.error || 'Video generation failed';
          setVideoStatus(prev => ({
            ...prev,
            status: 'error',
            error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
          }));
          clearInterval(pollInterval);
        } else if (data.status === 'processing') {
          // 進捗表示を更新
          setVideoStatus(prev => ({
            ...prev,
            status: 'processing'
          }));
          
          // 99%で止まっている場合の特別処理
          if (pollCount > 40) { // 200秒（約3.3分）経過後
            console.log('99%で停滞中、直接コンテンツ取得を試行...');
            try {
              // ブランド用の直接取得APIを使用
              const directResponse = await fetch(`/api/get-brand-video-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
              });
              
              if (directResponse.ok) {
                const directData = await directResponse.json();
                if (directData.videoSize && directData.videoSize > 0) {
                  console.log('ブランド直接取得成功:', directData.videoSize, 'bytes');
                  setVideoStatus(prev => ({
                    ...prev,
                    status: 'completed',
                    videoUrl: directData.dataUrl
                  }));
                  if (onVideoGenerated) {
                    onVideoGenerated(directData.dataUrl);
                  }
                  clearInterval(pollInterval);
                  return;
                }
              }
            } catch (directError) {
              console.log('ブランド直接取得失敗:', directError);
            }
          }
        }
        
        // 最大ポーリング回数に達した場合
        if (pollCount >= maxPolls) {
          console.log('最大ポーリング回数に達しました');
          setVideoStatus(prev => ({
            ...prev,
            status: 'error',
            error: 'Video generation timeout (10 minutes)'
          }));
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling video status:', error);
        const errorMessage = error instanceof Error ? error.message : 
                            typeof error === 'string' ? error : 
                            'Failed to check video status';
        setVideoStatus(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage
        }));
        clearInterval(pollInterval);
      }
    }, 5000); // 5秒間隔でポーリング
  };

  // 生成された映像をデータベースに保存（オプション）
  const saveVideoToDatabase = async (jobId: string, videoUrl: string) => {
    // Cloudinaryを使用しない場合は、必要に応じて実装
    console.log('Video URL available for download:', videoUrl);
  };

  // 映像をダウンロード
  const downloadVideo = () => {
    if (videoStatus.videoUrl) {
      console.log('Downloading video:', videoStatus.videoUrl);
      
      // Base64データURLからBlobを作成
      if (videoStatus.videoUrl.startsWith('data:video/mp4;base64,')) {
        const base64Data = videoStatus.videoUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${brandName}-brand-video.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // メモリリークを防ぐためにURLを解放
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // 通常のURLの場合
        const link = document.createElement('a');
        link.href = videoStatus.videoUrl;
        link.download = `${brandName}-brand-video.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (videoStatus.status) {
      case 'idle':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Ready</span>;
      case 'generating':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Generating...</span>;
      case 'processing':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Processing...</span>;
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'error':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Error</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border">
      <div className="p-6 space-y-6">
        {/* ステータス表示のみ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Video Generation</h3>
            {getStatusBadge()}
          </div>
        </div>

        {/* ブランド背景画像表示 */}
        {backgroundImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={backgroundImage}
                alt={`${brandName} background`}
                className="w-full h-48 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                {brandName}
              </div>
            </div>
          </div>
        )}

        {/* 生成設定 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
              <select
                value={generationSettings.duration}
                onChange={(e) => setGenerationSettings(prev => ({
                  ...prev,
                  duration: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded-md"
                disabled={isGenerating}
              >
                <option value={4}>4 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={12}>12 seconds</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Resolution</label>
              <select
                value={generationSettings.resolution}
                onChange={(e) => setGenerationSettings(prev => ({
                  ...prev,
                  resolution: e.target.value
                }))}
                className="w-full p-2 border rounded-md"
                disabled={isGenerating}
              >
                <option value="1280x720">HD (1280x720)</option>
                <option value="720x1280">Vertical HD (720x1280)</option>
                <option value="1920x1080">Full HD (1920x1080)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={generationSettings.useBackgroundImage}
                  onChange={(e) => setGenerationSettings(prev => ({
                    ...prev,
                    useBackgroundImage: e.target.checked
                  }))}
                  disabled={isGenerating || !backgroundImage}
                  className="rounded"
                />
                <span className="text-sm">
                  Use background image
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 映像プレビュー */}
        {videoStatus.videoUrl && (
          <div className="space-y-4 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Generated Video</h3>
            </div>
            <div className="relative">
              <video
                src={videoStatus.videoUrl}
                controls
                className="w-full rounded-lg shadow-lg"
                poster={backgroundImage || undefined}
                autoPlay
                muted
                loop
                preload="metadata"
                onError={(e) => {
                  console.error('Video load error:', e);
                  console.log('Video URL type:', videoStatus.videoUrl?.substring(0, 50));
                }}
                onLoadStart={() => {
                  console.log('Video loading started');
                }}
                onCanPlay={() => {
                  console.log('Video can play');
                }}
                onLoadedData={() => {
                  console.log('Video data loaded');
                }}
              >
                Your browser does not support the video tag.
              </video>
              {backgroundImage && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  Based on: {brandName} background
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadVideo} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={() => window.open(videoStatus.videoUrl, '_blank')} 
                variant="outline"
              >
                Open in New Tab
              </Button>
            </div>
            <div className="text-xs text-gray-600">
              <p>Video URL: {videoStatus.videoUrl?.substring(0, 100)}...</p>
              <p>Status: {videoStatus.status}</p>
              <p>URL Type: {videoStatus.videoUrl?.startsWith('data:') ? 'Base64 Data URL' : 'Regular URL'}</p>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {videoStatus.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{videoStatus.error}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            onClick={startVideoGeneration}
            disabled={isGenerating || videoStatus.status === 'processing'}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGenerating || videoStatus.status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {videoStatus.status === 'generating' ? 'Starting...' : 'Processing... (5-10 min)'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </button>
          
          {videoStatus.status === 'error' && (
            <button
              onClick={() => setVideoStatus({
                jobId: null,
                status: 'idle',
                videoUrl: null,
                error: null
              })}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
