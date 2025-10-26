'use client'

import OptimizedImage from "@/app/components/OptimizedImage";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getBrands, getVisibleProducts, getProductsByCategory, searchProducts, searchBrands, getMainCategories, getGendersByCategory, getTypesByCategoryAndGender, getProductsByCategoryGenderAndType, getProductsByCategoryAndGender, getFeatures, Brand, Product, Feature } from '@/lib/data'
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
  const [currentSlide, setCurrentSlide] = useState(0)
  const [features, setFeatures] = useState<Feature[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchCurrentPage, setSearchCurrentPage] = useState(1)
  const itemsPerPage = 80
  const [productImageCache, setProductImageCache] = useState<Record<string, string>>({})
  
  // Use the favorites hook
  const { isFavorited, checkFavorites } = useFavorites()

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // 自動スライド機能
  useEffect(() => {
    if (features.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 1750) // 1.75秒ごとに自動スライド

    return () => clearInterval(interval)
  }, [features.length])

  // スワイプジェスチャーのサポート
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  const shuffleProducts = (items: Product[]) => {
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  // 商品の色に基づいてランダムに画像を選択する関数（キャッシュ機能付き）
  const getRandomImageForProduct = useCallback((product: Product): string | null => {
    // キャッシュに存在する場合は、キャッシュされた画像を返す
    if (productImageCache[product.id]) {
      return productImageCache[product.id]
    }

    if (!product.images || product.images.length === 0) {
      return null
    }
    
    let selectedImage: string
    
    if (!product.colors || product.colors.length === 0) {
      // 色情報がない場合は最初の画像を返す
      selectedImage = product.images[0]
    } else {
      // 利用可能な色から最初の2つを取得（black, white, red, blue の例では black, white）
      const availableColors = product.colors.slice(0, 2)
      
      // 利用可能な色からランダムに1つ選択
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]
      
      // 選択された色に対応する画像のインデックスを取得
      const colorIndex = product.colors.indexOf(randomColor)
      
      // 色のインデックスに対応する画像を返す（画像が足りない場合は循環）
      const imageIndex = colorIndex % product.images.length
      
      selectedImage = product.images[imageIndex]
    }
    
    // キャッシュに保存
    setProductImageCache(prev => ({
      ...prev,
      [product.id]: selectedImage
    }))
    
    return selectedImage
  }, [productImageCache])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize analytics
        await analytics.initialize()
        
        const [productsData, brandsData, mainCategoriesData, featuresData] = await Promise.all([
          getVisibleProducts(),
          getBrands(),
          getMainCategories(),
          getFeatures()
        ])
        setProducts(shuffleProducts(productsData))
        setBrands(brandsData)
        setMainCategories(mainCategoriesData)
        setFeatures(featuresData)
        
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
    setSearchCurrentPage(1) // Reset search page when new search is performed
    
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
      setCurrentPage(1) // Reset to first page when filters change
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
  
  // Calculate pagination for main products
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = products.slice(startIndex, endIndex)
  
  // Calculate pagination for search results
  const searchTotalPages = searchResults ? Math.ceil(searchResults.products.length / itemsPerPage) : 0
  const searchStartIndex = (searchCurrentPage - 1) * itemsPerPage
  const searchEndIndex = searchStartIndex + itemsPerPage
  const currentSearchProducts = searchResults ? searchResults.products.slice(searchStartIndex, searchEndIndex) : []
  
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
    <div className="bg-black">
      {/* Hero Carousel Section */}
      {features.length > 0 && (
        <div className="relative w-full overflow-hidden bg-black">
          <div className="relative mx-auto" style={{ maxWidth: '1400px' }}>
            {/* カルーセルコンテナ */}
            <div 
              className="relative h-[240px] md:h-[320px] overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* スライド */}
              <div 
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {features.map((feature) => (
                  <div key={feature.id} className="min-w-full h-full relative">
                    <Link href={feature.link_url} className="block w-full h-full">
                      {/* 背景画像 */}
                      <div className="relative w-full h-full">
                        <OptimizedImage 
                          src={feature.image_url} 
                          alt={feature.title}
                          fill
                          className="object-cover"
                          isImportant={true}
                        />
                        {/* オーバーレイ */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                      </div>
                      
                      {/* テキストコンテンツ */}
                      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                          {feature.title}
                        </h2>
                        <p className="text-base md:text-xl text-white drop-shadow-lg">
                          {feature.subtitle}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 左ナビゲーションボタン */}
            {features.length > 1 && (
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all"
                aria-label="Previous slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 右ナビゲーションボタン */}
            {features.length > 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all"
                aria-label="Next slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* ドットインジケーター */}
            {features.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentSlide === index 
                        ? 'bg-white w-6' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
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
            {searchResults.products.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Products</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4">
                  {currentSearchProducts.map((p, index) => (
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
                            <OptimizedImage src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={18} height={18} className="rounded" />
                          </Link>
                        </div>
                        <div className="text-sm text-gray-300">{formatUSD(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Search Results Pagination */}
                {searchTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 px-3">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        if (searchCurrentPage > 1) {
                          setSearchCurrentPage(searchCurrentPage - 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      disabled={searchCurrentPage === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        searchCurrentPage === 1
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
                    {getPageNumbers(searchCurrentPage, searchTotalPages).map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchCurrentPage(page)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            searchCurrentPage === page
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
                        if (searchCurrentPage < searchTotalPages) {
                          setSearchCurrentPage(searchCurrentPage + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      disabled={searchCurrentPage === searchTotalPages}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        searchCurrentPage === searchTotalPages
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
              {currentProducts.map((p, index) => (
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
                        <OptimizedImage src={(brands.find(b=>b.id===p.brand_id))?.icon || "/vercel.svg"} alt="brand" width={30} height={30} className="rounded bg-white" />
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
      </div>
    </div>
  );
}
