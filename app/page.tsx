'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from 'react'
import { getBrands, getVisibleProducts, getProductsByCategory, searchProducts, searchBrands, getMainCategories, getGendersByCategory, getTypesByCategoryAndGender, getProductsByCategoryGenderAndType, getProductsByCategoryAndGender, Brand, Product } from '@/lib/data'
import FavoriteButton from '@/app/components/FavoriteButton'
import { useFavorites } from '@/lib/useFavorites'
import analytics from '@/lib/analytics'

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [mainCategories, setMainCategories] = useState<string[]>([])
  const [genders, setGenders] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<{products: Product[], brands: Brand[]} | null>(null)
  const [, setIsSearching] = useState(false) // Using underscore to indicate intentionally unused
  
  // Use the favorites hook
  const { isFavorited, checkFavorites } = useFavorites()
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
        // Initialize analytics
        await analytics.initialize()
        
        const [productsData, brandsData, mainCategoriesData] = await Promise.all([
          getVisibleProducts(),
          getBrands(),
          getMainCategories()
        ])
        setProducts(shuffleProducts(productsData))
        setBrands(brandsData)
        setMainCategories(mainCategoriesData)
        
        // Check favorites for all products at once
        if (productsData.length > 0) {
          await checkFavorites(productsData.map(p => p.id))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [checkFavorites])

  const handleSearch = useCallback(async (query: string) => {
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
      
      // Track search behavior
      analytics.trackSearch(
        query,
        'general',
        {
          mainCategory: selectedMainCategory,
          gender: selectedGender,
          type: selectedType
        },
        productsData.length + brandsData.length
      )
      
      // Check favorites for search results
      if (productsData.length > 0) {
        await checkFavorites(productsData.map(p => p.id))
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [checkFavorites, selectedMainCategory, selectedGender, selectedType])

  useEffect(() => {
    // Handle search from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    
    if (searchParam) {
      setSearchQuery(searchParam)
      handleSearch(searchParam)
    } else {
      // 検索パラメータがない場合は、検索結果のみをクリア（フィルターは保持）
      setSearchQuery('')
      setSearchResults(null)
    }
  }, [checkFavorites, handleSearch])

  // Listen for URL changes (for mobile search navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      
      if (searchParam && searchParam !== searchQuery) {
        setSearchQuery(searchParam)
        handleSearch(searchParam)
      } else if (!searchParam && (searchResults || searchQuery)) {
        // 検索パラメータがない場合は検索状態のみをクリア（フィルターは保持）
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
  }, [searchQuery, searchResults, handleSearch])

  // 追加: URLパラメータの変更をより頻繁に監視
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      
      // 検索パラメータがない場合、検索状態をクリア（フィルターは保持）
      if (!searchParam && (searchResults || searchQuery)) {
        setSearchResults(null)
        setSearchQuery('')
      }
    }

    // 定期的にURLパラメータをチェック（ロゴクリック時のナビゲーションを検知）
    const interval = setInterval(checkUrlParams, 100)
    
    return () => clearInterval(interval)
  }, [searchQuery, searchResults])

  // 大分類が変更された時に性別を更新
  useEffect(() => {
    const loadGenders = async () => {
      if (selectedMainCategory === 'All') {
        setGenders([])
        setSelectedGender('All')
        setTypes([])
        setSelectedType('All')
      } else {
        const gendersData = await getGendersByCategory(selectedMainCategory)
        setGenders(gendersData)
        setSelectedGender('All')
        setTypes([])
        setSelectedType('All')
      }
    }
    loadGenders()
  }, [selectedMainCategory])

  // 性別が変更された時にタイプを更新
  useEffect(() => {
    const loadTypes = async () => {
      if (selectedMainCategory === 'All' || selectedGender === 'All') {
        setTypes([])
        setSelectedType('All')
      } else {
        const typesData = await getTypesByCategoryAndGender(selectedMainCategory, selectedGender)
        setTypes(typesData)
        setSelectedType('All')
      }
    }
    loadTypes()
  }, [selectedMainCategory, selectedGender])

  // フィルターが変更された時に商品を更新
  useEffect(() => {
    const loadFilteredProducts = async () => {
      if (selectedMainCategory === 'All') {
        const productsData = await getVisibleProducts()
        setProducts(shuffleProducts(productsData))
      } else if (selectedGender === 'All') {
        // 大分類のみで絞り込み
        const productsData = await getProductsByCategory(selectedMainCategory)
        setProducts(shuffleProducts(productsData))
      } else if (selectedType === 'All') {
        // 大分類と性別で絞り込み
        const productsData = await getProductsByCategoryAndGender(selectedMainCategory, selectedGender)
        setProducts(shuffleProducts(productsData))
      } else {
        // 大分類、性別、タイプで絞り込み
        const productsData = await getProductsByCategoryGenderAndType(selectedMainCategory, selectedGender, selectedType)
        setProducts(shuffleProducts(productsData))
      }
    }
    loadFilteredProducts()
  }, [selectedMainCategory, selectedGender, selectedType])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  return (
    <div className="bg-black">
      {/* Hero Section */}
      <div className="relative py-3 md:py-10 text-center overflow-hidden bg-black">
        
        {/* Content */}
        <div className="relative z-10 px-8 sm:px-0">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <div className="block md:inline">
              <span className="animated-gradient-1">Created by AI.</span>
            </div>
            <span className="hidden md:inline"> </span>
            <div className="block md:inline">
              <span className="animated-gradient-2">Loved by You.</span>
            </div>
            <span className="hidden md:inline"> </span>
            <div className="block md:inline">
              Discover Now!
            </div>
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto">
            {/* Explore creations born from your taste, crafted on demand. */}
          </p>
        </div>
      </div>
      
      <div className="">
        {searchResults ? (
          // Search Results
          <div>
            <div className="mb-6 mt-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Search Results for {searchQuery}
              </h2>
            </div>
            
            {/* Brand Results */}
            {searchResults.brands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-white">Brands</h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {searchResults.brands.map((brand) => (
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
                      <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                            <p className="text-sm text-gray-600 truncate break-words">
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
                <h3 className="text-lg font-medium mb-4 text-white">Products</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4">
                  {searchResults.products.map((p, index) => (
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
                            <Image src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} className="rounded" />
                          </Link>
                        </div>
                        <div className="text-sm text-gray-300">{formatUSD(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.brands.length === 0 && searchResults.products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300">No results found for {searchQuery}</p>
              </div>
            )}
          </div>
        ) : (
          // Normal Product Display
          <div>
            <div className="mb-6 mt-4 px-3">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">New Products</h2>
                <Link 
                  href="/brands" 
                  className="inline-flex items-center gap-1 text-sm text-white hover:text-white transition-all duration-300 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:border-white/50 rounded-full px-4 py-2 shadow-lg hover:shadow-xl"
                >
                  <span>New Brands</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* 大分類フィルター */}
              <div className="mt-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  {["All", ...mainCategories].map((c) => (
                    <button 
                      key={c} 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Filter button clicked:', c)
                        setSelectedMainCategory(c)
                        // Track filter usage
                        analytics.trackSearch('', 'general', { mainCategory: c })
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
                        selectedMainCategory === c 
                          ? 'border-white bg-white text-black' 
                          : 'border-gray-400 text-gray-300 hover:border-white hover:text-white'
                      }`}
                      style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 性別フィルター */}
              {selectedMainCategory !== 'All' && genders.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {["All", ...genders].map((c) => (
                      <button 
                        key={c} 
                        onClick={() => {
                          setSelectedGender(c)
                          // Track filter usage
                          analytics.trackSearch('', 'general', { 
                            mainCategory: selectedMainCategory,
                            gender: c 
                          })
                        }}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selectedGender === c 
                            ? 'border-white bg-white text-black' 
                            : 'border-gray-400 text-gray-300 hover:border-white hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* タイプフィルター */}
              {selectedMainCategory !== 'All' && selectedGender !== 'All' && types.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {["All", ...types].map((c) => (
                      <button 
                        key={c} 
                        onClick={() => {
                          setSelectedType(c)
                          // Track filter usage
                          analytics.trackSearch('', 'general', { 
                            mainCategory: selectedMainCategory,
                            gender: selectedGender,
                            type: c 
                          })
                        }}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selectedType === c 
                            ? 'border-white bg-white text-black' 
                            : 'border-gray-400 text-gray-300 hover:border-white hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4">
              {products.map((p, index) => (
                <div key={p.id} className="group relative">
                  <Link 
                    href={`/${p.brand_id}/${p.id}`} 
                    className="block"
                    onClick={() => {
                      // Track product click
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
                          // Track product name click
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
                          // Track brand click
                          analytics.trackProductInteraction(
                            p.brand_id,
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
                        <Image src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} className="rounded" />
                      </Link>
                    </div>
                    <div className="text-sm text-gray-300">{formatUSD(p.price)}</div>
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
