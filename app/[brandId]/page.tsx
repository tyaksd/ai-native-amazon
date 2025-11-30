'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, use } from 'react'
import { getBrandById, getProductsByBrand, getBrands, Brand, Product } from "@/lib/data";
import FavoriteButton from '@/app/components/FavoriteButton';
import { useFavorites } from '@/lib/useFavorites';

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type PageProps = {
  params: Promise<{ brandId: string }>;
};

export default function BrandPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [nextBrand, setNextBrand] = useState<Brand | null>(null)
  const [prevBrand, setPrevBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'new'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  
  // Use the useFavorites hook to manage favorites efficiently
  const { isFavorited, checkFavorites } = useFavorites()

  const isNewProduct = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const now = Date.now()
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    return now - created <= THIRTY_DAYS_MS
  }

  const displayedItems = useMemo(() => {
    let filtered = items
    
    // Filter by tab (all vs new)
    if (selectedTab === 'new') {
      filtered = filtered.filter(p => isNewProduct(p.created_at))
    }
    
    // Filter by category (using type field)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.type === selectedCategory)
    }
    
    // Filter by gender
    if (selectedGender !== 'All') {
      filtered = filtered.filter(p => p.gender === selectedGender)
    }
    
    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(p => p.type === selectedType)
    }
    
    return filtered
  }, [items, selectedTab, selectedCategory, selectedGender, selectedType])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData, brandsData] = await Promise.all([
          getBrandById(resolvedParams.brandId),
          getProductsByBrand(resolvedParams.brandId),
          getBrands()
        ])
        setBrand(brandData)
        setItems(productsData)
        
        // Sort brands by created_at (newest first) for navigation
        const sortedBrands = [...brandsData].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Descending order (newest first)
        })
        setAllBrands(sortedBrands)
        
        // Find next and previous brand based on database order (created_at, newest first)
        if (brandData && sortedBrands.length > 0) {
          const currentIndex = sortedBrands.findIndex(b => b.id === brandData.id)
          if (currentIndex !== -1) {
            // Get next brand (older brand, loop to first if at end)
            const nextIndex = (currentIndex + 1) % sortedBrands.length
            setNextBrand(sortedBrands[nextIndex])
            // Get previous brand (newer brand, loop to last if at beginning)
            const prevIndex = currentIndex === 0 ? sortedBrands.length - 1 : currentIndex - 1
            setPrevBrand(sortedBrands[prevIndex])
          }
        }
        
        // Check favorites for all products at once
        if (productsData.length > 0) {
          const productIds = productsData.map(p => p.id)
          await checkFavorites(productIds)
        }
      } catch (error) {
        console.error('Error loading brand data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.brandId, checkFavorites])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="px-6 py-10">
        <div className="text-gray-700">Brand not found.</div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Image for entire page */}
      {brand.background_image && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}
      
      {/* Brand Logo Space */}
      <div className="relative z-10 h-20 flex items-end justify-between px-3">
        <div className="w-25 h-25 bg-white/90 rounded-lg shadow-lg overflow-hidden transform translate-y-8">
          <Image 
            src={brand.icon} 
            alt={brand.name} 
            width={100}
            height={100}
            className="object-cover rounded"
          />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 transform translate-y-2 md:translate-y-4">
          {/* Previous Brand Navigation Button */}
          {prevBrand && (
            <Link 
              href={`/${prevBrand.id}`}
              className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
              aria-label={`Go to ${prevBrand.name}`}
            >
              <svg 
                className="w-6 h-6 text-white drop-shadow-lg group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </Link>
          )}
          
          {/* Next Brand Navigation Button */}
          {nextBrand && (
            <Link 
              href={`/${nextBrand.id}`}
              className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
              aria-label={`Go to ${nextBrand.name}`}
            >
              <svg 
                className="w-6 h-6 text-white drop-shadow-lg group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Info */}
          <div className="lg:col-span-2">
            <div className=" mt-4 px-3">
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">{brand.name} products</h2>
            </div>

            {/* Category Navigation */}
            <div className="mb-8 px-3">
              <div className="flex flex-wrap gap-2 border-b border-white/30">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === 'all'
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setSelectedTab('new')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === 'new'
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  New
                </button>
              </div>
              
              {/* Category Filter */}
              <div className="mt-4 flex items-center gap-2">
                <label className="text-sm font-medium text-white">Filter by type:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                >
                  <option value="All">All Types</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Sweatshirt">Sweatshirt</option>
                    <option value="Long Tee">Long Tee</option>
                    <option value="Jacket">Jacket</option>
                    <option value="Hat">Hat</option>
                    <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Gender Filter */}
              {selectedCategory !== 'All' && (
                <div className="mt-4 flex items-center gap-2">
                  <label className="text-sm font-medium text-white">Filter by gender:</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                  >
                    <option value="All">All Genders</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              )}

              {/* Type Filter */}
              {selectedCategory !== 'All' && selectedGender !== 'All' && (
                <div className="mt-4 flex items-center gap-2">
                  <label className="text-sm font-medium text-white">Filter by type:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                  >
                    <option value="All">All Types</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Sweatshirt">Sweatshirt</option>
                    <option value="Long Tee">Long Tee</option>
                    <option value="Jacket">Jacket</option>
                    <option value="Hat">Hat</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {displayedItems.length === 0 ? (
              <div className="text-white text-center py-12 drop-shadow-lg">No products available for this brand.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-y-4">
                {displayedItems.map((p, index) => {
                  // 黒と白を交互に選択する関数
                  const getImageForProduct = (product: Product, productIndex: number): string | null => {
                    if (!product.images || product.images.length === 0) {
                      return null
                    }
                    
                    // 黒と白が利用可能かチェック
                    if (product.colors && product.colors.length > 0) {
                      // インデックスに基づいて黒と白を交互に選択
                      const targetColor = productIndex % 2 === 0 ? 'Black' : 'White'
                      
                      // カラー名の正規化（大文字小文字を無視）
                      const normalizedColors = product.colors.map(c => c.trim())
                      const blackIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'black')
                      const whiteIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'white')
                      
                      // 黒または白が見つかった場合、対応する画像を使用
                      if (targetColor === 'Black' && blackIndex >= 0) {
                        const imageIndex = blackIndex % product.images.length
                        return product.images[imageIndex]
                      } else if (targetColor === 'White' && whiteIndex >= 0) {
                        const imageIndex = whiteIndex % product.images.length
                        return product.images[imageIndex]
                      }
                      
                      // 交互に選択したいカラーが見つからない場合、もう一方を試す
                      if (targetColor === 'Black' && whiteIndex >= 0) {
                        const imageIndex = whiteIndex % product.images.length
                        return product.images[imageIndex]
                      } else if (targetColor === 'White' && blackIndex >= 0) {
                        const imageIndex = blackIndex % product.images.length
                        return product.images[imageIndex]
                      }
                    }
                    
                    // フォールバック: 最初の画像を使用
                    return product.images[0]
                  }
                  
                  const selectedImage = getImageForProduct(p, index)
                  
                  return (
                    <div key={p.id} className="group relative">
                      <Link href={`/${p.brand_id}/${p.id}`} className="block">
                        <div className="aspect-square bg-gray-50">
                          {selectedImage ? (
                            <Image src={selectedImage} alt={p.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">No image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      {isNewProduct(p.created_at) && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-black text-white text-xs px-2 py-1 rounded">New</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton 
                          productId={p.id} 
                          className="bg-white/80 hover:bg-white rounded-full p-1"
                          initialFavoriteState={isFavorited(p.id)}
                        />
                      </div>
                      <div className="mt-3 ml-2">
                        <h3 className="font-medium text-white truncate drop-shadow-lg">{p.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-white drop-shadow-lg">{formatUSD(p.price)}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/90 text-gray-800">
                            {p.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column - About Brand */}
          <div className="lg:col-span-1 px-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sticky top-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden flex-shrink-0 border border-white/30">
                  <Image 
                    src={brand.icon} 
                    alt={brand.name} 
                    width={40} 
                    height={40} 
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white drop-shadow-lg">About {brand.name}</h3>
                </div>
              </div>
              <p className="text-sm text-white/90 mb-4 break-words drop-shadow-md">
                {brand.description || `${brand.name}: Extraordinary Design Since 2020. Handcrafted with precision, ${brand.name} channels years of artistry into contemporary fashion and lifestyle products.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


