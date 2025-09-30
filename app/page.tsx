'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getBrands, getProducts, getProductsByCategory, searchProducts, searchBrands, Brand, Product } from '@/lib/data'

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<{products: Product[], brands: Brand[]} | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const shuffleProducts = (items: Product[]) => {
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, brandsData] = await Promise.all([
          getProducts(),
          getBrands()
        ])
        setProducts(shuffleProducts(productsData))
        setBrands(brandsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    // Handle search from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
      handleSearch(searchParam)
    }
  }, [])

  // Listen for URL changes (for mobile search navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      if (searchParam && searchParam !== searchQuery) {
        setSearchQuery(searchParam)
        handleSearch(searchParam)
      } else if (!searchParam && searchResults) {
        setSearchResults(null)
        setSearchQuery('')
      }
    }

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange)
    
    // Check URL on mount and when component updates
    handleUrlChange()

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
    }
  }, [searchQuery, searchResults])

  useEffect(() => {
    const loadFilteredProducts = async () => {
      if (selectedCategory === 'All') {
        const productsData = await getProducts()
        setProducts(shuffleProducts(productsData))
      } else {
        const productsData = await getProductsByCategory(selectedCategory)
        setProducts(shuffleProducts(productsData))
      }
    }
    loadFilteredProducts()
  }, [selectedCategory])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const [productsData, brandsData] = await Promise.all([
        searchProducts(query),
        searchBrands(query)
      ])
      setSearchResults({ products: productsData, brands: brandsData })
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  return (
    <div className="">
      {/* Hero Section */}
      <div className="relative py-6 md:py-12 text-center overflow-hidden bg-white">
        
        {/* Content */}
        <div className="relative z-10 px-8 sm:px-0">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            AI Creates Products You Love. Shop Now!
          </h1>
          <p className="text-lg text-black max-w-2xl mx-auto">
            {/* Explore creations born from your taste, crafted on demand. */}
          </p>
        </div>
      </div>
      
      <div className="px-3">
        {searchResults ? (
          // Search Results
          <div>
            <div className="mb-6 mt-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Search Results for "{searchQuery}"
              </h2>
            </div>
            
            {/* Brand Results */}
            {searchResults.brands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Brands</h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {searchResults.brands.map((brand) => (
                    <Link key={brand.id} href={`/${brand.id}`} className="group block">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                            <Image 
                              src={brand.icon} 
                              alt={brand.name} 
                              width={48} 
                              height={48} 
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 truncate">{brand.name}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              {brand.description || `${brand.name}: Extraordinary Design Since 2020`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Product Results */}
            {searchResults.products.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Products</h3>
                <div className="grid gap-2 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {searchResults.products.map((p) => (
                    <div key={p.id} className="group rounded-lg overflow-hidden">
                      <Link href={`/${p.brand_id}/${p.id}`} className="block">
                        {p.images && p.images.length > 0 ? (
                          <div className="aspect-square overflow-hidden">
                            <Image src={p.images[0]} alt={p.name} width={800} height={800} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        )}
                      </Link>
                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-3">
                          <Link href={`/${p.brand_id}/${p.id}`} className="block font-medium text-gray-900 truncate hover:underline">
                            {p.name}
                          </Link>
                          <Link href={`/${p.brand_id}`} className="shrink-0 opacity-80 hover:opacity-100">
                            <Image src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} />
                          </Link>
                        </div>
                        <div className="text-sm text-gray-700">{formatUSD(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.brands.length === 0 && searchResults.products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          // Normal Product Display
          <div>
            <div className="mb-6 mt-4">
              <h2 className="text-xl font-semibold tracking-tight">New Products</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {["All","Men","Women","Hot"].map((c) => (
                  <button 
                    key={c} 
                    onClick={() => setSelectedCategory(c)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selectedCategory === c 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-gray-900 hover:text-black'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((p) => (
                <div key={p.id} className="group rounded-lg overflow-hidden">
                  <Link href={`/${p.brand_id}/${p.id}`} className="block">
                    {p.images && p.images.length > 0 ? (
                      <div className="aspect-square overflow-hidden">
                        <Image src={p.images[0]} alt={p.name} width={800} height={800} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </Link>
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/${p.brand_id}/${p.id}`} className="block font-medium text-gray-900 truncate hover:underline">
                        {p.name}
                      </Link>
                      <Link href={`/${p.brand_id}`} className="shrink-0 opacity-80 hover:opacity-100">
                        <Image src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} />
                      </Link>
                    </div>
                    <div className="text-sm text-gray-700">{formatUSD(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
