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
                        poster={brand?.background_image}
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
