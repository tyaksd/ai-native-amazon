'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getBrands, Brand } from '@/lib/data'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await getBrands()
        setBrands(brandsData)
      } catch (error) {
        console.error('Error loading brands:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBrands()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-3">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Brands</h1>
        <p className="text-gray-600">Discover brands you love and their unique products</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {brands.map((brand) => (
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
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-black transition-colors">
                  {brand.name}
                </h3>
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
