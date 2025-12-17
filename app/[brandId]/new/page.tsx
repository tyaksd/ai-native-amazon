'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrandById, getProductsByBrand, type Brand, type Product } from "@/lib/data";
import FavoriteButton from '@/app/components/FavoriteButton';

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type PageProps = {
  params: { brandId: string };
};

export default function BrandNewProductsPage({ params }: PageProps) {
  const resolvedParams = params as { brandId: string };
  const [brand, setBrand] = useState<Brand | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get badge colors
  const getBadgeColors = (badge: string | null) => {
    switch (badge) {
      case 'NEW':
        return {
          border: '#10B981',
          background: '#022C22',
          text: '#A7F3D0'
        }
      case 'HOT':
        return {
          border: '#F97316',
          background: '#451A03',
          text: '#FED7AA'
        }
      case 'SALE':
        return {
          border: '#EF4444',
          background: '#450A0A',
          text: '#FCA5A5'
        }
      case 'SECRET':
        return {
          border: '#8B5CF6',
          background: '#020617',
          text: '#E5E7EB'
        }
      case 'PICK':
        return {
          border: '#38BDF8',
          background: '#0B1220',
          text: '#E0F2FE'
        }
      default:
        return null
    }
  }
  
  const newItems = useMemo(() => {
    return items.filter((p) => p.badge === 'NEW');
  }, [items]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData] = await Promise.all([
          getBrandById(resolvedParams.brandId),
          getProductsByBrand(resolvedParams.brandId),
        ]);
        setBrand(brandData);
        setItems(productsData);
      } catch (error) {
        console.error("Error loading brand new products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.brandId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-[#FAFAF7]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="px-6 py-10 bg-[#FAFAF7] min-h-screen">
        <div className="text-black">Brand not found.</div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <div className="relative h-35 md:h-48 bg-gradient-to-r from-gray-100 to-gray-200">
        {brand.background_image && (
          <Image
            src={brand.background_image}
            alt={`${brand.name} background`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative h-full flex items-end justify-start">
          <div className="transform translate-y-8 translate-x-8">
            <div className="w-20 h-20 bg-white/90 rounded-lg shadow-lg overflow-hidden">
              <Image
                src={brand.icon}
                alt={brand.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-3 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Info */}
          <div className="lg:col-span-2">
            <div className="mb-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{brand.name} products</h2>
            </div>

            {/* Category Navigation */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <Link
                  href={`/${brand.id}`}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-600 hover:text-gray-900`}
                >
                  All Products
                </Link>
                <span
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors border-gray-900 text-gray-900`}
                >
                  New
                </span>
              </div>
            </div>

            {/* Products Grid */}
            {newItems.length === 0 ? (
              <div className="text-gray-600 text-center py-12">No new products in the last 30 days.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4">
                {newItems.map((p) => (
                  <div key={p.id} className="group relative">
                    <Link href={`/${p.brand_id}/${p.id}`} className="block">
                      <div className="aspect-square bg-gray-50">
                        {p.images && p.images.length > 0 ? (
                          <Image src={p.images[0]} alt={p.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">No image</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    {p.badge && getBadgeColors(p.badge) && (() => {
                      const colors = getBadgeColors(p.badge)!
                      const fontSize = p.badge === 'SECRET' 
                        ? 'clamp(0.5625rem, 2.25vw, 0.8125rem)' 
                        : 'clamp(0.625rem, 2.5vw, 0.875rem)'
                      return (
                        <div className="absolute top-0 left-0 w-[25%] aspect-square">
                          {/* Border triangle (outer) */}
                          <div 
                            className="absolute w-full h-full"
                            style={{ 
                              clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                              backgroundColor: colors.border
                            }}
                          />
                          {/* Inner triangle */}
                          <div 
                            className="absolute"
                            style={{ 
                              top: '1.5px',
                              left: '1.5px',
                              width: 'calc(100% - 6px)',
                              height: 'calc(100% - 6px)',
                              clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                              backgroundColor: colors.background
                            }}
                          />
                          <span 
                            className="font-bold absolute z-10"
                            style={{ 
                              color: colors.text,
                              fontSize: fontSize,
                              transform: 'translate(-50%, -50%) rotate(-45deg)',
                              transformOrigin: 'center',
                              top: '35%',
                              left: '35%',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {p.badge}
                          </span>
                        </div>
                      )
                    })()}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton productId={p.id} className="bg-white/80 hover:bg-white rounded-full p-1" />
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
                      <p className="text-sm text-gray-600">{formatUSD(p.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - About Brand */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                  <Image
                    src={brand.icon}
                    alt={brand.name}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">About {brand.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 break-words">
                {brand.description || `${brand.name}: Extraordinary Design Since 2020. Handcrafted with precision, ${brand.name} channels years of artistry into contemporary fashion and lifestyle products.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


