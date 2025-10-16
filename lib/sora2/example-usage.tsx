// ブランドページでの使用例
// app/brands/[brandId]/page.tsx に追加する例

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import VideoGenerator from '@/lib/sora2/VideoGenerator';

interface Brand {
  id: string;
  name: string;
  description: string;
  background_image: string | null;
  background_video: string | null;
  design_concept: string | null;
  target_audience: string | null;
}

export default function BrandPage({ params }: { params: { brandId: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null);

  useEffect(() => {
    // ブランドデータを取得
    const fetchBrand = async () => {
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('id', params.brandId)
        .single();
      
      setBrand(data);
    };

    fetchBrand();
  }, [params.brandId]);

  if (!brand) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 既存のブランド情報表示 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{brand.name}</h1>
        <p className="text-gray-600 mt-2">{brand.description}</p>
      </div>

      {/* 映像生成コンポーネント */}
      <VideoGenerator
        brandId={brand.id}
        brandName={brand.name}
        brandConcept={brand.design_concept || ''}
        designConcept={brand.design_concept || ''}
        targetAudience={brand.target_audience || ''}
        backgroundImage={brand.background_image ?? undefined}
      />

      {/* 生成された映像の表示（オプション） */}
      {brand.background_video && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Brand Video</h2>
          <video
            src={brand.background_video}
            controls
            className="w-full rounded-lg shadow-lg"
            poster={brand.background_image ?? undefined}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
