'use client'

import OptimizedImage from "@/app/components/OptimizedImage";
import Link from "next/link";
import { useState, useEffect, useCallback } from 'react'
import { getBrands, getVisibleProducts, getProductsByCategory, searchProducts, searchBrands, getMainCategories, getGendersByCategory, getTypesByCategoryAndGender, getProductsByCategoryGenderAndType, getProductsByCategoryAndGender, getFeatures, Brand, Product, Feature } from '@/lib/data'
import { useFavorites } from '@/lib/useFavorites'
import analytics from '@/lib/analytics'


export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [_brands, setBrands] = useState<Brand[]>([])
  const [_mainCategories, setMainCategories] = useState<string[]>([])
  const [_genders, setGenders] = useState<string[]>([])
  const [_types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMainCategory, _setSelectedMainCategory] = useState<string>('All')
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
  const { isFavorited: _isFavorited, checkFavorites } = useFavorites()

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Automatic slide feature
  useEffect(() => {
    if (features.length === 0) return

    // First slide is 2 seconds, subsequent slides are 2.5 seconds
    const duration = currentSlide === 0 ? 2000 : 2500
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, duration)

    return () => clearInterval(interval)
  }, [features.length, currentSlide])

  // Support for swipe gestures
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

  // Function to randomly select images based on product color (with caching)
  const _getRandomImageForProduct = useCallback((product: Product): string | null => {
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
      // Clear only search results if no search parameter (keep filters)
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
        // Clear only search state if no search parameter (keep filters)
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

  // Additional: Monitor URL parameter changes more frequently
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      
      // Clear search state if no search parameter (keep filters)
      if (!searchParam && (searchResults || searchQuery)) {
        setSearchResults(null)
        setSearchQuery('')
      }
    }

    // Periodically check URL parameters (detect navigation from logo click)
    const interval = setInterval(checkUrlParams, 100)
    
    return () => clearInterval(interval)
  }, [searchQuery, searchResults])

  // Update gender when main category changes
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

  // Update type when gender changes
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

  // Update products when filters change
  useEffect(() => {
    const loadFilteredProducts = async () => {
      setCurrentPage(1) // Reset to first page when filters change
      if (selectedMainCategory === 'All') {
        const productsData = await getVisibleProducts()
        setProducts(shuffleProducts(productsData))
      } else if (selectedGender === 'All') {
        // Filter by main category only
        const productsData = await getProductsByCategory(selectedMainCategory)
        setProducts(shuffleProducts(productsData))
      } else if (selectedType === 'All') {
        // Filter by main category and gender
        const productsData = await getProductsByCategoryAndGender(selectedMainCategory, selectedGender)
        setProducts(shuffleProducts(productsData))
      } else {
        // Filter by main category, gender, and type
        const productsData = await getProductsByCategoryGenderAndType(selectedMainCategory, selectedGender, selectedType)
        setProducts(shuffleProducts(productsData))
      }
    }
    loadFilteredProducts()
  }, [selectedMainCategory, selectedGender, selectedType])
  
  // Calculate pagination for main products
  const _totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const _currentProducts = products.slice(startIndex, endIndex)
  
  // Calculate pagination for search results
  const _searchTotalPages = searchResults ? Math.ceil(searchResults.products.length / itemsPerPage) : 0
  const searchStartIndex = (searchCurrentPage - 1) * itemsPerPage
  const searchEndIndex = searchStartIndex + itemsPerPage
  const _currentSearchProducts = searchResults ? searchResults.products.slice(searchStartIndex, searchEndIndex) : []
  
  // Function to generate page numbers to display
  const _getPageNumbers = (currentPageNum: number, totalPagesNum: number) => {
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
        <div className="relative w-full h-screen overflow-hidden bg-black">
          {/* Carousel container */}
          <div 
            className="relative w-full h-full overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {features.map((feature) => (
                  <div key={feature.id} className="min-w-full h-full relative">
                    <Link href={feature.link_url} className="block w-full h-full">
                      {/* Background image */}
                      <div className="relative w-full h-full">
                        <OptimizedImage 
                          src={feature.image_url} 
                          alt={feature.title}
                          fill
                          className="object-cover"
                          isImportant={true}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                      </div>
                      
                      {/* Text content */}
                      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
                          {feature.title}
                        </h2>
                        <p className="text-xl md:text-2xl lg:text-3xl text-white drop-shadow-lg">
                          {feature.subtitle}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Left navigation button */}
            {features.length > 1 && (
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                aria-label="Previous slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Right navigation button */}
            {features.length > 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                aria-label="Next slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Explore Brands Button */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-base md:text-lg rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <span>Explore Brands</span>
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Dot indicators */}
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
      )}
    </div>
  );
}
