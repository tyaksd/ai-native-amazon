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
        // Sort by created_at (newest first)
        const sortedBrands = [...brandsData].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Descending order (newest first)
        })
        setBrands(sortedBrands)
        setFilteredBrands(sortedBrands)
        
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
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-3 bg-black">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">New Brands</h1>
        <p className="text-gray-300 mb-4">Discover brands you love and their unique products</p>
        
        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-gray-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
          >
            <option value="All">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">({filteredBrands.length} brands)</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {filteredBrands.map((brand) => (
          <Link key={brand.id} href={`/${brand.id}`} className="group block">
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
                  {brand.category && (
                    <span className="px-2  bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                      {brand.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
