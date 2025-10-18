'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import VideoGenerator from '@/lib/sora2/VideoGenerator';
// UI components removed - using native HTML and Tailwind CSS
import { Loader2, Play, Video, Image as ImageIcon, Search } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  icon: string;
  background_image: string | null;
  description: string | null;
  design_concept: string | null;
  target_audience: string | null;
  background_video: string | null;
}

export default function SoraPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedVideos, setGeneratedVideos] = useState<{ [brandId: string]: string }>({});
  
  // SNS Content Generation states
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{instagram?: string, x?: string, tiktok?: string}>({});
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching brands:', error);
        return;
      }

      setBrands(data || []);
      setFilteredBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  // 検索機能
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand =>
        brand.name.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [searchQuery, brands]);

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleVideoGenerated = (brandId: string, videoUrl: string) => {
    setGeneratedVideos(prev => ({
      ...prev,
      [brandId]: videoUrl
    }));
    
    console.log('Video generated for brand:', brandId, videoUrl);
  };

  // SNS Content Generation functions
  const generateContent = async () => {
    if (!selectedBrand) {
      alert('Please select a brand first');
      return;
    }

    setIsGeneratingContent(true);
    setGeneratedContent({});
    setShowGeneratedContent(false);

    try {
      // Generate content for both platforms
      const response = await fetch('/api/generate-sns-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          platform: 'all'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert(`Error generating content: ${result.error}`);
        return;
      }

      // Update generated content
      setGeneratedContent(result.content);
      setShowGeneratedContent(true);

    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const copyToClipboard = async (text: string, platform: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary "copied" message
      const button = event?.currentTarget as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('bg-green-500', 'hover:bg-green-600');
        button.classList.remove('bg-pink-500', 'hover:bg-pink-600', 'bg-blue-500', 'hover:bg-blue-600');
        
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('bg-green-500', 'hover:bg-green-600');
          if (platform === 'Instagram') {
            button.classList.add('bg-pink-500', 'hover:bg-pink-600');
          } else {
            button.classList.add('bg-blue-500', 'hover:bg-blue-600');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  // Render content with clickable links
  const renderContentWithLinks = (content: string) => {
    if (!selectedBrand) {
      return <span className="whitespace-pre-wrap">{content}</span>;
    }
    
    // Link handling for both platforms
    const linkPattern = /(godship\.io)/g;
    const linkUrl = 'https://godship.io';
    
    const parts = content.split(linkPattern);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part === 'godship.io') {
            return (
              <a
                key={index}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading brands...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Sora2 Video Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ブランド選択パネル */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Video className="h-5 w-5" />
                Select Brand
              </h2>
            </div>
            <div className="p-6">
              {/* 検索バー */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search brands by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {searchQuery && (
                  <p className="text-sm text-gray-600 mt-2">
                    {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>

              {/* Content Generation Button */}
              {selectedBrand && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Generation</h3>
                  <button
                    onClick={generateContent}
                    disabled={isGeneratingContent}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {isGeneratingContent ? 'Generating Content...' : 'Generate SNS Content'}
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedBrand?.id === brand.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleBrandSelect(brand)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {brand.icon ? (
                          <Image
                            src={brand.icon}
                            alt={brand.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{brand.name}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {brand.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {brand.background_image && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Image
                            </span>
                          )}
                          {brand.background_video && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Video className="h-3 w-3 mr-1" />
                              Video
                            </span>
                          )}
                          {generatedVideos[brand.id] && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Play className="h-3 w-3 mr-1" />
                              Generated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 検索結果が空の場合 */}
                {filteredBrands.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No brands found matching &quot;{searchQuery}&quot;</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 映像生成パネル */}
        <div className="lg:col-span-2">
          {selectedBrand ? (
            <div className="space-y-6">
              {/* 選択されたブランドの情報 */}
              <div className="bg-white rounded-lg shadow-lg border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {selectedBrand.name}
                  </h2>
                </div>
              </div>

              {/* Generated Content Display */}
              {showGeneratedContent && (generatedContent.instagram || generatedContent.x) && (
                <div className="bg-white rounded-lg shadow-lg border">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generated SNS Content
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {generatedContent.instagram && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-pink-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </h4>
                          <button
                            onClick={(e) => copyToClipboard(generatedContent.instagram!, 'Instagram', e)}
                            className="px-3 py-1 bg-pink-500 text-white text-sm rounded hover:bg-pink-600 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white p-3 rounded border text-sm text-gray-700">
                          {renderContentWithLinks(generatedContent.instagram!)}
                        </div>
                      </div>
                    )}

                    {generatedContent.x && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            X (Twitter)
                          </h4>
                          <button
                            onClick={(e) => copyToClipboard(generatedContent.x!, 'X', e)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white p-3 rounded border text-sm text-gray-700">
                          {renderContentWithLinks(generatedContent.x!)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VideoGeneratorコンポーネント */}
              <VideoGenerator
                brandId={selectedBrand.id}
                brandName={selectedBrand.name}
                brandConcept={typeof selectedBrand.design_concept === 'string' ? selectedBrand.design_concept : ''}
                designConcept={typeof selectedBrand.design_concept === 'string' ? selectedBrand.design_concept : ''}
                targetAudience={typeof selectedBrand.target_audience === 'string' ? selectedBrand.target_audience : ''}
                backgroundImage={typeof selectedBrand.background_image === 'string' ? selectedBrand.background_image : undefined}
                onVideoGenerated={(videoUrl) => handleVideoGenerated(selectedBrand.id, videoUrl)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border">
              <div className="flex items-center justify-center min-h-[400px] p-6">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Brand</h3>
                  <p className="text-gray-600">
                    Choose a brand from the left panel to start generating videos
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 生成された映像の表示 */}
      {Object.keys(generatedVideos).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Generated Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(generatedVideos).map(([brandId, videoUrl]) => {
              const brand = brands.find(b => b.id === brandId);
              return (
                <div key={brandId} className="bg-white rounded-lg shadow-lg border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">{brand?.name}</h3>
                  </div>
                  <div className="p-6">
                    <div className="relative">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full rounded-lg shadow-lg"
                        poster={brand?.background_image || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = videoUrl;
                          link.download = `${brand?.name}-video.mp4`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
