'use client'

import OptimizedImage from "@/app/components/OptimizedImage";
import Link from "next/link";
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getBrands, searchProducts, searchBrands, Brand, Product } from '@/lib/data'
import FavoriteButton from '@/app/components/FavoriteButton'
import { useFavorites } from '@/lib/useFavorites'
import analytics from '@/lib/analytics'

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [foundBrands, setFoundBrands] = useState<Brand[]>([])
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 80
  const [productImageCache, setProductImageCache] = useState<Record<string, string>>({})
  
  // Use the favorites hook
  const { isFavorited, checkFavorites } = useFavorites()

  // Load all brands for product brand icons
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await getBrands()
        setAllBrands(brandsData)
      } catch (error) {
        console.error('Error loading brands:', error)
      }
    }
    loadBrands()
  }, [])

  // Function to randomly select images based on product color (with caching)
  const getRandomImageForProduct = useCallback((product: Product): string | null => {
    // Return cached image if it exists in cache
    if (productImageCache[product.id]) {
      return productImageCache[product.id]
    }

    if (!product.images || product.images.length === 0) {
      return null
    }
    
    let selectedImage: string
    
    if (!product.colors || product.colors.length === 0) {
      // Return first image if no color information
      selectedImage = product.images[0]
    } else {
      // Get first 2 available colors (e.g., black and white from black, white, red, blue)
      const availableColors = product.colors.slice(0, 2)
      
      // Randomly select one from available colors
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]
      
      // Get image index corresponding to selected color
      const colorIndex = product.colors.indexOf(randomColor)
      
      // Return image corresponding to color index (cycles if not enough images)
      const imageIndex = colorIndex % product.images.length
      
      selectedImage = product.images[imageIndex]
    }
    
    // Save to cache
    setProductImageCache(prev => ({
      ...prev,
      [product.id]: selectedImage
    }))
    
    return selectedImage
  }, [productImageCache])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      setFoundBrands([])
      setLoading(false)
      return
    }

    setLoading(true)
    setCurrentPage(1) // Reset to first page when new search is performed
    
    try {
      const [productsData, brandsData] = await Promise.all([
        searchProducts(query),
        searchBrands(query)
      ])
      setProducts(productsData)
      setFoundBrands(brandsData)
      
      // Track search behavior
      analytics.trackSearch(
        query,
        'general',
        {},
        productsData.length + brandsData.length
      )
      
      // Check favorites for search results
      if (productsData.length > 0) {
        await checkFavorites(productsData.map(p => p.id))
      }
    } catch (error) {
      console.error('Error searching:', error)
      setProducts([])
      setFoundBrands([])
    } finally {
      setLoading(false)
    }
  }, [checkFavorites])

  // Load search query from URL and perform search
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('search') || ''
    setSearchQuery(query)
    if (query) {
      handleSearch(query)
    } else {
      setLoading(false)
    }
  }, [searchParams, handleSearch])

  // Calculate pagination for products
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = products.slice(startIndex, endIndex)

  // Function to generate page numbers to display
  const getPageNumbers = (currentPageNum: number, totalPagesNum: number) => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5
    
    if (totalPagesNum <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPagesNum; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate range around current page
      let start = Math.max(2, currentPageNum - 1)
      let end = Math.min(totalPagesNum - 1, currentPageNum + 1)
      
      // Adjust range if at the beginning or end
      if (currentPageNum <= 3) {
        end = 4
      } else if (currentPageNum >= totalPagesNum - 2) {
        start = totalPagesNum - 3
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...')
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if needed
      if (end < totalPagesNum - 1) {
        pages.push('...')
      }
      
      // Always show last page
      pages.push(totalPagesNum)
    }
    
    return pages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
        {searchQuery ? (
          <>
            <div className="mb-6 mt-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Search Results for &quot;{searchQuery}&quot;
              </h2>
            </div>
            
            {/* Brand Results */}
            {foundBrands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-white">Brands</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {foundBrands.map((brand) => (
                    <Link 
                      key={brand.id} 
                      href={`/${brand.id}`} 
                      className="group block"
                      onClick={() => {
                        // Track search result click
                        analytics.trackSearchResultClick(
                          brand.id,
                          'brand',
                          searchQuery
                        )
                      }}
                    >
                      <div className="relative rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full min-h-[210px]">
                        {/* Full background image */}
                        {brand.background_image ? (
                          <OptimizedImage 
                            src={brand.background_image} 
                            alt={`${brand.name} background`} 
                            fill
                            className="object-cover"
                            isImportant={true}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
                        )}
                        
                        {/* Brand icon */}
                        <div className="absolute top-4 left-4">
                          <div className="w-20 h-20 bg-white/60 backdrop-blur-md  rounded-xl shadow-lg overflow-hidden">
                            <OptimizedImage 
                              src={brand.icon} 
                              alt={brand.name} 
                              fill
                              className="object-cover"
                              width={80}
                              height={80}
                            />
                          </div>
                        </div>
                        
                        {/* Arrow icon */}
                        <div className="absolute top-4 right-4">
                          <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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
            )}

            {/* Product Results */}
            {products.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Products</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4">
                  {currentProducts.map((p, index) => (
                    <div key={p.id} className="group relative">
                      <Link 
                        href={`/${p.brand_id}/${p.id}`} 
                        className="block"
                        onClick={() => {
                          // Track search result click
                          analytics.trackSearchResultClick(
                            p.id,
                            'product',
                            searchQuery
                          )
                          // Also track as product interaction
                          analytics.trackProductInteraction(
                            p.id,
                            'click',
                            {
                              brandId: p.brand_id,
                              productName: p.name,
                              productPrice: p.price,
                              productCategory: p.category,
                              productType: p.type,
                              positionInList: index + 1
                            }
                          )
                        }}
                      >
                        {(() => {
                          const randomImage = getRandomImageForProduct(p)
                          return randomImage ? (
                            <div className="aspect-square overflow-hidden">
                              <OptimizedImage src={randomImage} alt={p.name} width={800} height={800} className="w-full h-full object-cover" isImportant={true} />
                            </div>
                          ) : (
                            <div className="aspect-square bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">No image</span>
                            </div>
                          )
                        })()}
                      </Link>
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton 
                          productId={p.id} 
                          className="bg-white/80 hover:bg-white rounded-full p-1" 
                          initialFavoriteState={isFavorited(p.id)}
                        />
                      </div>
                      <div className="pt-2 ml-2">
                        <div className="flex items-center justify-between gap-3">
                          <Link 
                            href={`/${p.brand_id}/${p.id}`} 
                            className="block font-medium text-white truncate hover:underline"
                            onClick={() => {
                              // Track search result click
                              analytics.trackSearchResultClick(
                                p.id,
                                'product',
                                searchQuery
                              )
                              // Also track as product interaction
                              analytics.trackProductInteraction(
                                p.id,
                                'click',
                                {
                                  brandId: p.brand_id,
                                  productName: p.name,
                                  productPrice: p.price,
                                  productCategory: p.category,
                                  productType: p.type,
                                  positionInList: index + 1
                                }
                              )
                            }}
                          >
                            {p.name}
                          </Link>
                          <Link 
                            href={`/${p.brand_id}`} 
                            className="shrink-0 opacity-80 hover:opacity-100 mr-2"
                            onClick={() => {
                              // Track brand click from search results
                              analytics.trackSearchResultClick(
                                p.brand_id,
                                'brand',
                                searchQuery
                              )
                            }}
                          >
                            <OptimizedImage src={(allBrands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} className="rounded" />
                          </Link>
                        </div>
                        <div className="text-sm text-gray-300">{formatUSD(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 px-3">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-white hover:bg-white/20'
                      }`}
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers(currentPage, totalPages).map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPage(page)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-white text-black'
                              : 'text-white hover:bg-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span key={index} className="px-2 text-gray-500">
                          {page}
                        </span>
                      )
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-white hover:bg-white/20'
                      }`}
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {foundBrands.length === 0 && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-300">Please enter a search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

