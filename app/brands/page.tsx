'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getBrands, Brand, getFeatures, Feature } from '@/lib/data'

// Brand card component to avoid repetition
function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full min-h-[210px]">
        {/* Full background image */}
        {brand.background_image ? (
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
        )}
        
        {/* Brand icon */}
        <div className="absolute top-6 left-4">
          <div className="w-20 h-20 bg-white backdrop-blur-md  rounded-xl shadow-lg overflow-hidden">
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Glass overlay for bottom half */}
        <div className="absolute bottom-0 left-0 right-0 pt-1 px-3 pb-2 bg-white/10 backdrop-blur-md border-t border-white/10 min-h-[80px]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white text-lg group-hover:text-white transition-colors">
              {brand.name}
            </h3>
            {brand.style && (
              <span className="px-2  bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                {brand.style}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {brand.description || `${brand.name}: Extraordinary Design Since 2020`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// Compact brand card for mobile All section and search results
function CompactBrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full min-h-[140px]">
        {/* Full background image */}
        {brand.background_image ? (
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
        )}
        
        {/* Brand icon */}
        <div className="absolute top-3 left-2">
          <div className="w-12 h-12 bg-white backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Glass overlay for bottom */}
        <div className="absolute bottom-0 left-0 right-0 pt-1 px-2 pb-2 bg-white/10 backdrop-blur-md border-t border-white/10">
          <h3 className="font-bold text-white text-sm group-hover:text-white transition-colors truncate">
            {brand.name}
          </h3>
          {brand.style && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full truncate max-w-full">
              {brand.style}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [hotBrands, setHotBrands] = useState<Brand[]>([])
  const [newBrands, setNewBrands] = useState<Brand[]>([])
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedStyle, setSelectedStyle] = useState<string>('All')
  const [availableStyles, setAvailableStyles] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load brands and features in parallel
        const [brandsData, featuresData] = await Promise.all([
          getBrands(),
          getFeatures()
        ])
        
        // Sort brands by created_at (newest first)
        const sortedBrands = [...brandsData].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Descending order (newest first)
        })
        setBrands(sortedBrands)
        
        // Filter brands by is_hot and is_new flags
        setHotBrands(sortedBrands.filter(brand => brand.is_hot))
        setNewBrands(sortedBrands.filter(brand => brand.is_new))
        setAllBrands(sortedBrands)
        
        setFeatures(featuresData)
        
        // Get unique styles from brands that have styles
        const styles = [...new Set(brandsData
          .filter(brand => brand.style)
          .map(brand => brand.style!)
        )].sort()
        setAvailableStyles(styles)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-rotate features
  useEffect(() => {
    if (features.length <= 1) return
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length)
    }, 5000) // Change every 5 seconds
    return () => clearInterval(interval)
  }, [features.length])

  // Filter all brands by style
  useEffect(() => {
    if (selectedStyle === 'All') {
      setAllBrands(brands)
    } else {
      setAllBrands(brands.filter(brand => brand.style === selectedStyle))
    }
  }, [brands, selectedStyle])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="bg-black">
      {/* Hero Section with Features Carousel */}
      {features.length > 0 && (
        <section className="relative overflow-hidden">
          {/* Feature Images */}
          <div className="relative h-[200px] sm:h-[280px] md:h-[380px]">
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                href={feature.link_url}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentFeatureIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Image
                  src={feature.image_url}
                  alt={feature.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Feature text */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-200 max-w-2xl">
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Carousel indicators */}
          {features.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeatureIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-4 px-3">
        
        {/* Hot Drop Section */}
        {hotBrands.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Hot Drop 🔥</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {hotBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        )}
        
        {/* New Drop Section */}
        {newBrands.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">New Drop ✨</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {newBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        )}
        
        {/* All Brands Section */}
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-white mb-3">All</h2>
          
          {/* Style Filter */}
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="border-gray-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
            >
              <option value="All">All Styles</option>
              {availableStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
            <span className="text-sm text-gray-400">({allBrands.length} brands)</span>
          </div>
        
          {/* Mobile: 2 columns with compact cards, Desktop: 3 columns with regular cards */}
          <div className="grid grid-cols-2 sm:hidden gap-1">
            {allBrands.map((brand) => (
              <CompactBrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {allBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
