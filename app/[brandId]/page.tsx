'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, use } from 'react'
import { getBrandById, getProductsByBrand, Brand, Product } from "@/lib/data";
import FavoriteButton from '@/app/components/FavoriteButton';

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
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'new'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')

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
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
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
        const [brandData, productsData] = await Promise.all([
          getBrandById(resolvedParams.brandId),
          getProductsByBrand(resolvedParams.brandId)
        ])
        setBrand(brandData)
        setItems(productsData)
      } catch (error) {
        console.error('Error loading brand data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.brandId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
                className="object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8  ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Info */}
          <div className="lg:col-span-2 ">
            <div className="mb-8 mt-8 px-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{brand.name} products</h2>
            </div>

            {/* Category Navigation */}
            <div className="mb-8 px-3">
              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === 'all'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setSelectedTab('new')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === 'new'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New
                </button>
              </div>
              
              {/* Category Filter */}
              <div className="mt-4 flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filter by category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="All">All Categories</option>
                  <option value="T-Shirt">T-Shirt</option>
                  <option value="Hoodie">Hoodie</option>
                  <option value="Sweatshirt">Sweatshirt</option>
                  <option value="Jacket">Jacket</option>
                  <option value="Pants">Pants</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Hat">Hat</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Gender Filter */}
              {selectedCategory !== 'All' && (
                <div className="mt-4 flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter by gender:</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  <label className="text-sm font-medium text-gray-700">Filter by type:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="All">All Types</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Sweatshirt">Sweatshirt</option>
                    <option value="Jacket">Jacket</option>
                    <option value="Pants">Pants</option>
                    <option value="Shorts">Shorts</option>
                    <option value="Hat">Hat</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {displayedItems.length === 0 ? (
              <div className="text-gray-600 text-center py-12">No products available for this brand.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-y-4">
                {displayedItems.map((p) => (
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
                    {isNewProduct(p.created_at) && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-black text-white text-xs px-2 py-1 rounded">New</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton productId={p.id} className="bg-white/80 hover:bg-white rounded-full p-1" />
                    </div>
                    <div className="mt-3 ml-2">
                      <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600">{formatUSD(p.price)}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - About Brand */}
          <div className="lg:col-span-1 px-3">
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


