'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getBrands, Brand } from '@/lib/data'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await getBrands()
        setBrands(brandsData)
        setFilteredBrands(brandsData)
        
        // Get unique categories from brands that have categories
        const categories = [...new Set(brandsData
          .filter(brand => brand.category)
          .map(brand => brand.category!)
        )].sort()
        setAvailableCategories(categories)
      } catch (error) {
        console.error('Error loading brands:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBrands()
  }, [])

  // Filter brands by category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredBrands(brands)
    } else {
      setFilteredBrands(brands.filter(brand => brand.category === selectedCategory))
    }
  }, [brands, selectedCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-3">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Brands</h1>
        <p className="text-gray-600 mb-4">Discover brands you love and their unique products</p>
        
        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
          >
            <option value="All">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">({filteredBrands.length} brands)</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {filteredBrands.map((brand) => (
          <Link key={brand.id} href={`/${brand.id}`} className="group block">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full">
              {/* Header with brand background image */}
              <div className="relative h-27 overflow-hidden">
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
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-3 left-4">
                  <div className="w-22 h-22 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                    <Image 
                      src={brand.icon} 
                      alt={brand.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-black transition-colors">
                    {brand.name}
                  </h3>
                  {brand.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {brand.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {brand.description || `${brand.name}: Extraordinary Design Since 2020`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
