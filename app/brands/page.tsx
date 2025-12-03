'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from 'react'
import { getBrands, Brand, getFeatures, Feature } from '@/lib/data'

// Brand card component to avoid repetition
function BrandCard({ brand, compact }: { brand: Brand; compact?: boolean }) {
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className={`relative rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full ${compact ? 'min-h-[180px]' : 'min-h-[210px]'}`}>
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
        <div className={`absolute left-4 ${compact ? 'top-5' : 'top-9'}`}>
          <div className={`bg-white backdrop-blur-md rounded-xl shadow-lg overflow-hidden ${compact ? 'w-20 h-20' : 'w-22 h-22'}`}>
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Glass overlay for bottom half */}
        <div className="absolute bottom-0 left-0 right-0 pt-1 px-3 bg-black/20 backdrop-blur-md border-t border-white/10 min-h-[60px]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg group-hover:text-white transition-colors">
              {brand.name}
            </h3>
            {brand.style && (
              <span className="px-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                {brand.style}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {brand.description || `${brand.name}: Extraordinary Design Since 2020`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// Brand carousel component for Hot Drop and New Drop sections
function BrandCarousel({ brands, title }: { brands: Brand[], title: string }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Use refs for touch tracking to avoid stale closure issues with native event listeners
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    isHorizontalSwipe: null as boolean | null,
    isDragging: false,
    dragOffset: 0
  })

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile') // < sm
      } else if (width < 1024) {
        setScreenSize('tablet') // sm to lg
      } else {
        setScreenSize('desktop') // >= lg
      }
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Items per slide: 2 for mobile/tablet, 3 for desktop
  const itemsPerSlide = screenSize === 'desktop' ? 3 : 2
  const totalSlides = Math.ceil(brands.length / itemsPerSlide)
  const needsCarousel = brands.length > itemsPerSlide

  // Group brands into slides
  const slides = []
  for (let i = 0; i < brands.length; i += itemsPerSlide) {
    const slideItems: (Brand | null)[] = []
    for (let j = 0; j < itemsPerSlide; j++) {
      slideItems.push(brands[i + j] || null)
    }
    slides.push(slideItems)
  }

  // Reset to first slide when screen size changes
  useEffect(() => {
    setCurrentSlide(0)
  }, [screenSize])

  // Native touch event handlers with passive: false to enable preventDefault
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        isHorizontalSwipe: null,
        isDragging: true,
        dragOffset: 0
      }
      setIsDragging(true)
      setDragOffset(0)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current
      if (!state.isDragging) return
      
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = currentX - state.startX
      const diffY = currentY - state.startY

      // Determine swipe direction on first significant movement
      if (state.isHorizontalSwipe === null && (Math.abs(diffX) > 8 || Math.abs(diffY) > 8)) {
        // Simple ratio check: if horizontal movement is greater, it's horizontal
        const isHorizontal = Math.abs(diffX) > Math.abs(diffY)
        state.isHorizontalSwipe = isHorizontal
        touchStateRef.current.isHorizontalSwipe = isHorizontal
      }

      // If horizontal swipe detected, prevent vertical scrolling and update carousel
      if (state.isHorizontalSwipe === true) {
        e.preventDefault() // This works because we use passive: false
        state.dragOffset = diffX
        touchStateRef.current.dragOffset = diffX
        setDragOffset(diffX)
      }
      // If vertical swipe, do nothing - let browser handle scrolling
    }

    const handleTouchEnd = () => {
      const state = touchStateRef.current
      if (!state.isDragging) return
      
      state.isDragging = false
      setIsDragging(false)
      
      // Only change slides if it was a horizontal swipe
      if (state.isHorizontalSwipe === true) {
        if (state.dragOffset < -minSwipeDistance) {
          setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1))
        } else if (state.dragOffset > minSwipeDistance) {
          setCurrentSlide(prev => Math.max(prev - 1, 0))
        }
      }
      
      setDragOffset(0)
      touchStateRef.current.isHorizontalSwipe = null
      touchStateRef.current.dragOffset = 0
    }

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [totalSlides])

  // Calculate transform offset
  const getTransformOffset = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0
    const baseOffset = -currentSlide * 100
    const dragPercent = containerWidth > 0 ? (dragOffset / containerWidth) * 100 : 0
    return baseOffset + dragPercent
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      {/* Carousel container with touch support */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Sliding container */}
        <div 
          className={`flex ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
          style={{ transform: `translateX(${getTransformOffset()}%)` }}
        >
          {slides.map((slideItems, slideIndex) => (
            <div 
              key={slideIndex} 
              className="w-full flex-shrink-0"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {slideItems.map((brand, index) => (
                  brand ? (
                    <BrandCard key={brand.id} brand={brand} compact={screenSize === 'mobile'} />
                  ) : (
                    <div key={`empty-${slideIndex}-${index}`} className={screenSize === 'mobile' ? 'min-h-[160px] lg:hidden' : 'min-h-[210px] lg:hidden'} />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Carousel indicators */}
        {needsCarousel && totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact brand card for mobile All section and search results
function CompactBrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 aspect-square">
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
        
        {/* Brand icon - positioned at bottom left */}
        <div className="absolute bottom-1 left-1 z-10">
          <div className="w-14 h-14 bg-white backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Brand name and style button with glass design - positioned at bottom right */}
        <div className="absolute bottom-1 right-1 z-10 flex flex-col items-end gap-0.3">
          <div className="px-1 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-md truncate max-w-[220px]">
            {brand.name.length > 10 ? brand.name.slice(0, 10) : brand.name}
          </div>
          {brand.style && (
            <span className="px-2  bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full">
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
  
  // Hero swipe state
  const [heroIsDragging, setHeroIsDragging] = useState(false)
  const [heroDragOffset, setHeroDragOffset] = useState(0)
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const heroMinSwipeDistance = 50
  
  // Use refs for hero touch tracking to avoid stale closure issues
  const heroTouchStateRef = useRef({
    startX: 0,
    startY: 0,
    isHorizontalSwipe: null as boolean | null,
    isDragging: false,
    dragOffset: 0
  })

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

  // Auto-rotate features (pause when dragging)
  useEffect(() => {
    if (features.length <= 1 || heroIsDragging) return
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length)
    }, 5000) // Change every 5 seconds
    return () => clearInterval(interval)
  }, [features.length, heroIsDragging])

  // Hero native touch event handlers with passive: false to enable preventDefault
  useEffect(() => {
    const container = heroContainerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      heroTouchStateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        isHorizontalSwipe: null,
        isDragging: true,
        dragOffset: 0
      }
      setHeroIsDragging(true)
      setHeroDragOffset(0)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const state = heroTouchStateRef.current
      if (!state.isDragging) return
      
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = currentX - state.startX
      const diffY = currentY - state.startY

      // Determine swipe direction on first significant movement
      if (state.isHorizontalSwipe === null && (Math.abs(diffX) > 8 || Math.abs(diffY) > 8)) {
        // Simple ratio check: if horizontal movement is greater, it's horizontal
        const isHorizontal = Math.abs(diffX) > Math.abs(diffY)
        state.isHorizontalSwipe = isHorizontal
        heroTouchStateRef.current.isHorizontalSwipe = isHorizontal
      }

      // If horizontal swipe detected, prevent vertical scrolling and update carousel
      if (state.isHorizontalSwipe === true) {
        e.preventDefault() // This works because we use passive: false
        state.dragOffset = diffX
        heroTouchStateRef.current.dragOffset = diffX
        setHeroDragOffset(diffX)
      }
      // If vertical swipe, do nothing - let browser handle scrolling
    }

    const handleTouchEnd = () => {
      const state = heroTouchStateRef.current
      if (!state.isDragging) return
      
      state.isDragging = false
      setHeroIsDragging(false)
      
      // Only change slides if it was a horizontal swipe
      if (state.isHorizontalSwipe === true) {
        if (state.dragOffset < -heroMinSwipeDistance) {
          setCurrentFeatureIndex(prev => Math.min(prev + 1, features.length - 1))
        } else if (state.dragOffset > heroMinSwipeDistance) {
          setCurrentFeatureIndex(prev => Math.max(prev - 1, 0))
        }
      }
      
      setHeroDragOffset(0)
      heroTouchStateRef.current.isHorizontalSwipe = null
      heroTouchStateRef.current.dragOffset = 0
    }

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [features.length])

  const getHeroTransformOffset = () => {
    const containerWidth = heroContainerRef.current?.offsetWidth || 0
    const baseOffset = -currentFeatureIndex * 100
    const dragPercent = containerWidth > 0 ? (heroDragOffset / containerWidth) * 100 : 0
    return baseOffset + dragPercent
  }

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
          {/* Feature Images with swipe support */}
          <div 
            ref={heroContainerRef}
            className="relative h-[200px] sm:h-[280px] md:h-[380px] overflow-hidden"
            style={{ touchAction: 'pan-y' }}
          >
            <div 
              className={`flex h-full ${heroIsDragging ? '' : 'transition-transform duration-200 ease-out'}`}
              style={{ transform: `translateX(${getHeroTransformOffset()}%)` }}
            >
              {features.map((feature, index) => (
                <Link
                  key={feature.id}
                  href={feature.link_url}
                  className="relative w-full h-full flex-shrink-0"
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
          <BrandCarousel brands={hotBrands} title="Hot Drop 🔥" />
        )}
        
        {/* New Drop Section */}
        {newBrands.length > 0 && (
          <BrandCarousel brands={newBrands} title="New Drop ✨" />
        )}
        
        {/* All Brands Section */}
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-white mb-3">All</h2>
          
          {/* Style Filter */}
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="border border-white/20 bg-black/20 backdrop-blur-md text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
            >
              <option value="All" className="bg-black">All Styles</option>
              {availableStyles.map(style => (
                <option key={style} value={style} className="bg-black">{style}</option>
              ))}
            </select>
            <span className="text-sm text-gray-400">({allBrands.length} brands)</span>
          </div>
        
          {/* Mobile: 2 columns with compact cards, Desktop: 3 columns with regular cards */}
          <div className="grid grid-cols-2 sm:hidden gap-2">
            {allBrands.map((brand) => (
              <CompactBrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

