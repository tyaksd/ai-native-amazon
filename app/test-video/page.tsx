'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  jobId: string | null;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'error';
  videoUrl: string | null;
  error: string | null;
  prompt: string | null;
}

export default function TestVideoPage() {
  const [testResult, setTestResult] = useState<TestResult>({
    jobId: null,
    status: 'idle',
    videoUrl: null,
    error: null,
    prompt: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      console.log('Starting video generation test...');
      
      const response = await fetch('/api/test-video-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start test');
      }

      const data = await response.json();
      console.log('Test response:', data);

      setTestResult(prev => ({
        ...prev,
        jobId: data.jobId,
        status: 'processing',
        prompt: data.prompt
      }));

      // ステータスをポーリング
      if (data.jobId) {
        pollStatus(data.jobId);
      }

    } catch (error) {
      console.error('Test error:', error);
      setTestResult(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate-brand-video?jobId=${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();
        console.log('Status check:', data);
        
        if (data.status === 'succeeded' && data.videoUrl) {
          setTestResult(prev => ({
            ...prev,
            status: 'completed',
            videoUrl: data.videoUrl
          }));
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setTestResult(prev => ({
            ...prev,
            status: 'error',
            error: data.error || 'Video generation failed'
          }));
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setTestResult(prev => ({
          ...prev,
          status: 'error',
          error: 'Failed to check status'
        }));
        clearInterval(pollInterval);
      }
    }, 5000);

    // 60秒後にタイムアウト
    setTimeout(() => {
      clearInterval(pollInterval);
      if (testResult.status === 'processing') {
        setTestResult(prev => ({
          ...prev,
          status: 'error',
          error: 'Test timeout'
        }));
      }
    }, 60000);
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case 'idle':
        return <Play className="h-5 w-5" />;
      case 'generating':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (testResult.status) {
      case 'idle':
        return 'Ready to test';
      case 'generating':
        return 'Starting generation...';
      case 'processing':
        return 'Processing video...';
      case 'completed':
        return 'Test completed successfully!';
      case 'error':
        return 'Test failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Generation Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Test Sora2 Video Generation</h2>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>

          <div className="space-y-4">
            {testResult.prompt && (
              <div>
                <h3 className="font-medium mb-2">Test Prompt:</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {testResult.prompt}
                </p>
              </div>
            )}

            {testResult.jobId && (
              <div>
                <h3 className="font-medium mb-2">Job ID:</h3>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {testResult.jobId}
                </p>
              </div>
            )}

            {testResult.videoUrl && (
              <div>
                <h3 className="font-medium mb-2">Generated Video:</h3>
                <video
                  src={testResult.videoUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {testResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800 mb-2">Error:</h3>
                <p className="text-red-700 text-sm">{testResult.error}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={runTest}
              disabled={isLoading || testResult.status === 'processing'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
