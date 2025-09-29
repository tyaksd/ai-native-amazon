'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getBrandById, getProductsByBrand, Brand, Product } from "@/lib/data";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type PageProps = {
  params: { id: string };
};

export default function BrandPage({ params }: PageProps) {
  const resolvedParams = params as { id: string }
  const [brand, setBrand] = useState<Brand | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData] = await Promise.all([
          getBrandById(resolvedParams.id),
          getProductsByBrand(resolvedParams.id)
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
  }, [resolvedParams.id])

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
                {["All Products", "New"].map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      category === "All Products"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {items.length === 0 ? (
              <div className="text-gray-600 text-center py-12">No products available for this brand.</div>
            ) : (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {items.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group block">
                    <div className="relative">
                      <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                        {p.images && p.images.length > 0 ? (
                          <Image src={p.images[0]} alt={p.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-black text-white text-xs px-2 py-1 rounded">New</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
                      <p className="text-sm text-gray-600">{formatUSD(p.price)}</p>
                    </div>
                  </Link>
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
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">About {brand.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {brand.description || `${brand.name}: Extraordinary Design Since 2020. Handcrafted with precision, ${brand.name} channels years of artistry into contemporary fashion and lifestyle products.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


