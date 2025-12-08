'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from 'react'
import { getBrands, Brand, getFeatures, Feature, getProductsByBrand, Product } from '@/lib/data'

// Brand card component to avoid repetition
function BrandCard({ brand, compact, getStyleDisplayName }: { brand: Brand; compact?: boolean; getStyleDisplayName?: (style: string | null | undefined) => string }) {
  const [randomProducts, setRandomProducts] = useState<Product[]>([])
  const [productImages, setProductImages] = useState<Record<string, string>>({})

  // Function to get random image for a product based on random color
  const getRandomImageForProduct = (product: Product): string | null => {
    if (!product.images || product.images.length === 0) {
      return null
    }
    
    if (!product.colors || product.colors.length === 0) {
      // Return first image if no color information
      return product.images[0]
    }
    
    // Randomly select one color
    const randomColor = product.colors[Math.floor(Math.random() * product.colors.length)]
    
    // Get image index corresponding to selected color
    const colorIndex = product.colors.indexOf(randomColor)
    
    // Return image corresponding to color index (cycles if not enough images)
    const imageIndex = colorIndex % product.images.length
    
    return product.images[imageIndex]
  }

  // Fetch products for compact layout
  useEffect(() => {
    if (compact) {
      const fetchProducts = async () => {
        try {
          const products = await getProductsByBrand(brand.id)
          // Randomly select 4 products
          const shuffled = [...products].sort(() => 0.5 - Math.random())
          const selectedProducts = shuffled.slice(0, 4)
          setRandomProducts(selectedProducts)
          
          // Get random image for each product
          const images: Record<string, string> = {}
          selectedProducts.forEach(product => {
            const image = getRandomImageForProduct(product)
            if (image) {
              images[product.id] = image
            }
          })
          setProductImages(images)
        } catch (error) {
          console.error('Error fetching products:', error)
        }
      }
      fetchProducts()
    }
  }, [brand.id, compact])

  // Compact layout: left half with CompactBrandCard layout, right half with 4 product images
  if (compact) {
    return (
      <Link href={`/${brand.id}`} className="group block">
        <div className="relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 aspect-[2/1] flex">
          {/* Left half - CompactBrandCard layout */}
          <div className="relative w-1/2 h-full">
            {brand.background_image ? (
              <Image 
                src={brand.background_image} 
                alt={`${brand.name} background`} 
                fill
                sizes="50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
            )}
            
            {/* Brand icon - positioned at bottom left */}
            <div className="absolute bottom-1 left-1 z-10">
              <div className="w-14 h-14 bg-white backdrop-blur-md rounded-lg shadow-2xl border-2 border-white/50 overflow-hidden ring-2 ring-black/20">
                <Image 
                  src={brand.icon} 
                  alt={brand.name} 
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            </div>
            
            {/* Brand name and style button - positioned at bottom right */}
            <div className="absolute bottom-1 right-0 z-10 flex flex-col items-end gap-0.3">
              <div className="px-1 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-md truncate max-w-[180px]">
                {brand.name.length > 10 ? brand.name.slice(0, 10) : brand.name}
              </div>
              {brand.style && (
                <span className="mr-1 px-2 bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full">
                  {getStyleDisplayName ? getStyleDisplayName(brand.style) : brand.style}
                </span>
              )}
            </div>
          </div>
          
          {/* Right half - 4 product images in 2x2 grid */}
          <div className="w-1/2 h-full grid grid-cols-2 gap-0">
            {randomProducts.length === 0 ? (
              // Show "Upcoming" if no products
              <div className="col-span-2 row-span-2 flex items-center justify-center bg-gray-200">
                <span className="text-black text-lg font-medium">Upcoming</span>
              </div>
            ) : (
              <>
                {randomProducts.map((product, index) => {
                  const productImage = productImages[product.id]
                  return (
                    <div key={product.id || index} className="relative aspect-square overflow-hidden">
                      {productImage ? (
                        <Image 
                          src={productImage} 
                          alt={product.name} 
                          fill
                          sizes="25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs font-medium">Upcoming</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Fill remaining slots if less than 4 products */}
                {Array.from({ length: Math.max(0, 4 - randomProducts.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="relative aspect-square bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-medium">Upcoming</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Regular layout for desktop
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full min-h-[210px]">
        {/* Full background image */}
        {brand.background_image ? (
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
        )}
        
        {/* Brand icon */}
        <div className="absolute top-9 left-4">
          <div className="w-22 h-22 bg-white backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              sizes="88px"
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
                {getStyleDisplayName ? getStyleDisplayName(brand.style) : brand.style}
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
function BrandCarousel({ brands, title, getStyleDisplayName }: { brands: Brand[], title: string; getStyleDisplayName?: (style: string | null | undefined) => string }) {
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
                    <BrandCard key={brand.id} brand={brand} compact={screenSize === 'mobile'} getStyleDisplayName={getStyleDisplayName} />
                  ) : (
                    <div key={`empty-${slideIndex}-${index}`} className={screenSize === 'mobile' ? 'aspect-[2/1] lg:hidden' : 'min-h-[210px] lg:hidden'} />
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
function CompactBrandCard({ brand, getStyleDisplayName }: { brand: Brand; getStyleDisplayName?: (style: string | null | undefined) => string }) {
  return (
    <Link href={`/${brand.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 aspect-square">
        {/* Full background image */}
        {brand.background_image ? (
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
        )}
        
        {/* Brand icon - positioned at bottom lbraeft */}
        <div className="absolute bottom-1 left-1 z-10">
          <div className="w-14 h-14 bg-white backdrop-blur-md rounded-lg shadow-2xl border-2 border-white/50 overflow-hidden ring-2 ring-black/20">
            <Image 
              src={brand.icon} 
              alt={brand.name} 
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Brand name and style button with glass design - positioned at bottom right */}
        <div className="absolute bottom-1 right-0 z-10 flex flex-col items-end gap-0.3">
          <div className="px-1 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-md truncate max-w-[180px]">
            {brand.name.length > 10 ? brand.name.slice(0, 10) : brand.name}
          </div>
          {brand.style && (
            <span className="mr-1 px-2  bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full">
              {getStyleDisplayName ? getStyleDisplayName(brand.style) : brand.style}
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
  
  // Style name mapping for display
  const styleDisplayNames: Record<string, string> = {
    'Core Street': 'STREET CLASSIC',
    'Hip-Hop/Urban': 'BLOCK HIP-HOP',
    'Sports/Athleisure': 'COURT ENERGY',
    'Retro/Vintage/Y2K': 'REWIND / Y2K',
    'Techwear/Futuristic': 'NEO TECH',
    'Luxury/Mode Street': 'MODE LUXE',
    'Grunge/Punk/Rock': 'NOISE PUNK',
    'Minimal/Normcore': 'LOW-KEY MINIMAL',
    'Art/Graphic Driven': 'CANVAS GRAPHIC',
    'Culture/Character/Anime': 'CULTURE / ANIME'
  }
  
  const getStyleDisplayName = (style: string | null | undefined): string => {
    if (!style) return ''
    return styleDisplayNames[style] || style
  }
  const [selectedDot, setSelectedDot] = useState<number | null>(null)
  const topRowRef = useRef<HTMLDivElement>(null)
  const bottomRowRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [linePath, setLinePath] = useState<string>('')
  const [glowDotPosition, setGlowDotPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dotPositions, setDotPositions] = useState<Array<{ x: number; y: number; index: number }>>([])
  const pathRef = useRef<SVGPathElement | null>(null)
  const [currentDotIndex, setCurrentDotIndex] = useState<number>(0)
  
  // Calculate line path from dot positions
  useEffect(() => {
    const calculatePath = () => {
      if (!topRowRef.current || !bottomRowRef.current || !containerRef.current) return
      
      // Get all child divs (the dots)
      const topDots = Array.from(topRowRef.current.children) as HTMLElement[]
      const bottomDots = Array.from(bottomRowRef.current.children) as HTMLElement[]
      
      if (topDots.length !== 5 || bottomDots.length !== 5) {
        console.log('Dots not found:', { top: topDots.length, bottom: bottomDots.length })
        return
      }
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const path: string[] = []
      
      // Get positions of all dots
      const topPositions = Array.from(topDots).map(dot => {
        const rect = dot.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top
        }
      })
      
      const bottomPositions = Array.from(bottomDots).map(dot => {
        const rect = dot.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top
        }
      })
      
      // Start from top left (0)
      path.push(`M ${topPositions[0].x} ${topPositions[0].y}`)
      
      // Top row: left to right (0-4) - straight lines
      for (let i = 1; i < topPositions.length; i++) {
        path.push(`L ${topPositions[i].x} ${topPositions[i].y}`)
      }
      
      // Top right (4) to bottom left (5) - curved diagonal line (more rounded)
      const topRightX = topPositions[4].x
      const topRightY = topPositions[4].y
      const bottomLeftX = bottomPositions[4].x // bottomDots[4] is index 5 (leftmost)
      const bottomLeftY = bottomPositions[4].y
      const midX = (topRightX + bottomLeftX) / 2 + 35 // Much more curve to the right
      const midY = (topRightY + bottomLeftY) / 2
      path.push(`Q ${midX} ${midY} ${bottomLeftX} ${bottomLeftY}`)
      
      // Bottom row: left to right (5-9) - straight lines
      for (let i = 3; i >= 0; i--) {
        path.push(`L ${bottomPositions[i].x} ${bottomPositions[i].y}`)
      }
      
      // Bottom right (9) to top left (0) - curved diagonal line (more rounded)
      const bottomRightX = bottomPositions[0].x // bottomDots[0] is index 9 (rightmost)
      const bottomRightY = bottomPositions[0].y
      const topLeftX = topPositions[0].x
      const topLeftY = topPositions[0].y
      const midX2 = (bottomRightX + topLeftX) / 2 - 35 // Much more curve to the left
      const midY2 = (bottomRightY + topLeftY) / 2
      path.push(`Q ${midX2} ${midY2} ${topLeftX} ${topLeftY}`)
      
      // Close the path
      path.push('Z')
      
      const finalPath = path.join(' ')
      setLinePath(finalPath)
      console.log('Line path set:', finalPath) // Debug log
      
      // Store all dot positions for snapping
      const allDotPositions: Array<{ x: number; y: number; index: number }> = []
      topPositions.forEach((pos, i) => {
        allDotPositions.push({ ...pos, index: i })
      })
      bottomPositions.forEach((pos, i) => {
        allDotPositions.push({ ...pos, index: 9 - i }) // bottomDots[0] is index 9, bottomDots[4] is index 5
      })
      setDotPositions(allDotPositions)
      
      // Initialize glow dot position to first dot
      if (allDotPositions.length > 0 && !glowDotPosition) {
        setGlowDotPosition({ x: allDotPositions[0].x, y: allDotPositions[0].y })
        setCurrentDotIndex(0)
        setSelectedDot(0)
      }
      
      // Force re-render to ensure line is visible
      if (linePath) {
        // Path is set, ensure it's visible
      }
    }
    
    // Calculate after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(calculatePath, 100)
    
    // Recalculate on resize
    window.addEventListener('resize', calculatePath)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculatePath)
    }
  }, [selectedDot, loading]) // Recalculate when selection changes or after loading
  
  // Get path-ordered dot indices (0,1,2,3,4,5,6,7,8,9,0)
  const getPathAdjacentIndices = (currentIndex: number): { prevIndex: number; nextIndex: number } => {
    // Path order: 0→1→2→3→4→5→6→7→8→9→0
    const pathOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const currentPathIndex = pathOrder.indexOf(currentIndex)
    
    if (currentPathIndex === -1) {
      // Fallback to array order
      const arrayIndex = dotPositions.findIndex(dot => dot.index === currentIndex)
      const prevIndex = arrayIndex === 0 ? dotPositions.length - 1 : arrayIndex - 1
      const nextIndex = arrayIndex === dotPositions.length - 1 ? 0 : arrayIndex + 1
      return {
        prevIndex: dotPositions[prevIndex].index,
        nextIndex: dotPositions[nextIndex].index
      }
    }
    
    const prevPathIndex = currentPathIndex === 0 ? pathOrder.length - 1 : currentPathIndex - 1
    const nextPathIndex = currentPathIndex === pathOrder.length - 1 ? 0 : currentPathIndex + 1
    
    return {
      prevIndex: pathOrder[prevPathIndex],
      nextIndex: pathOrder[nextPathIndex]
    }
  }
  
  // Find nearest point on SVG path between current and adjacent dots
  const findNearestPointOnPath = (x: number, y: number, currentIndex: number): { x: number; y: number; distance: number; pathIndex: number } | null => {
    if (!pathRef.current || dotPositions.length === 0) return null
    
    const path = pathRef.current
    const pathLength = path.getTotalLength()
    
    // Get adjacent dot indices based on path order
    const { prevIndex, nextIndex } = getPathAdjacentIndices(currentIndex)
    
    // Find array indices for prev and next
    const prevArrayIndex = dotPositions.findIndex(dot => dot.index === prevIndex)
    const nextArrayIndex = dotPositions.findIndex(dot => dot.index === nextIndex)
    const currentArrayIndex = dotPositions.findIndex(dot => dot.index === currentIndex)
    
    if (prevArrayIndex === -1 || nextArrayIndex === -1 || currentArrayIndex === -1) return null
    
    // Check if we're moving on a curve (4→5 or 9→0)
    const isCurveSegment = (currentIndex === 4 && nextIndex === 5) || (currentIndex === 9 && nextIndex === 0) ||
                          (currentIndex === 5 && prevIndex === 4) || (currentIndex === 0 && prevIndex === 9)
    
    // Find path length positions for each dot
    let currentPathLength = 0
    let prevPathLength = 0
    let nextPathLength = 0
    
    const findSamples = 500 // More samples to find exact dot positions
    for (let i = 0; i <= findSamples; i++) {
      const length = (i / findSamples) * pathLength
      const point = path.getPointAtLength(length)
      
      const distToCurrent = Math.hypot(point.x - dotPositions[currentArrayIndex].x, point.y - dotPositions[currentArrayIndex].y)
      const distToPrev = Math.hypot(point.x - dotPositions[prevArrayIndex].x, point.y - dotPositions[prevArrayIndex].y)
      const distToNext = Math.hypot(point.x - dotPositions[nextArrayIndex].x, point.y - dotPositions[nextArrayIndex].y)
      
      if (distToCurrent < 5 && currentPathLength === 0) {
        currentPathLength = length
      }
      if (distToPrev < 5 && prevPathLength === 0) {
        prevPathLength = length
      }
      if (distToNext < 5 && nextPathLength === 0) {
        nextPathLength = length
      }
    }
    
    // Determine which segment we're on
    const distToPrev = Math.hypot(x - dotPositions[prevArrayIndex].x, y - dotPositions[prevArrayIndex].y)
    const distToNext = Math.hypot(x - dotPositions[nextArrayIndex].x, y - dotPositions[nextArrayIndex].y)
    
    let segmentStart = 0
    let segmentEnd = pathLength
    
    if (distToNext < distToPrev) {
      // Moving forward: current to next
      segmentStart = currentPathLength
      segmentEnd = nextPathLength
      // Handle wrap-around (9 to 0)
      if (segmentEnd < segmentStart) {
        segmentEnd = pathLength
      }
    } else {
      // Moving backward: prev to current
      segmentStart = prevPathLength
      segmentEnd = currentPathLength
      // Handle wrap-around (0 to 9)
      if (segmentStart > segmentEnd) {
        segmentStart = 0
      }
    }
    
    // For curve segments, use more samples to ensure smooth movement along the arc
    const segmentSamples = isCurveSegment ? 300 : 200
    
    let bestPoint = path.getPointAtLength(segmentStart)
    let bestDistance = Infinity
    let bestPathIndex = 0
    
    for (let i = 0; i <= segmentSamples; i++) {
      let length = segmentStart + (i / segmentSamples) * (segmentEnd - segmentStart)
      if (length > pathLength) length = pathLength
      const point = path.getPointAtLength(length)
      const distance = Math.hypot(point.x - x, point.y - y)
      
      if (distance < bestDistance) {
        bestDistance = distance
        bestPoint = point
        bestPathIndex = i
      }
    }
    
    return { x: bestPoint.x, y: bestPoint.y, distance: bestDistance, pathIndex: bestPathIndex }
  }
  
  // Handle touch/drag to move glow dot
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    handleTouchMove(e)
  }
  
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current || (!isDragging && e.type !== 'touchmove')) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const x = clientX - containerRect.left
    const y = clientY - containerRect.top
    
    // Find nearest point on the path (only between adjacent dots)
    const pathPoint = findNearestPointOnPath(x, y, currentDotIndex)
    if (pathPoint && dotPositions.length > 0) {
      // Get adjacent dot indices based on path order
      const { prevIndex, nextIndex } = getPathAdjacentIndices(currentDotIndex)
      
      // Find array indices
      const currentArrayIndex = dotPositions.findIndex(dot => dot.index === currentDotIndex)
      const prevArrayIndex = dotPositions.findIndex(dot => dot.index === prevIndex)
      const nextArrayIndex = dotPositions.findIndex(dot => dot.index === nextIndex)
      
      if (currentArrayIndex === -1 || prevArrayIndex === -1 || nextArrayIndex === -1) return
      
      const distToCurrent = Math.hypot(pathPoint.x - dotPositions[currentArrayIndex].x, pathPoint.y - dotPositions[currentArrayIndex].y)
      const distToPrev = Math.hypot(pathPoint.x - dotPositions[prevArrayIndex].x, pathPoint.y - dotPositions[prevArrayIndex].y)
      const distToNext = Math.hypot(pathPoint.x - dotPositions[nextArrayIndex].x, pathPoint.y - dotPositions[nextArrayIndex].y)
      
      // Snap to adjacent dot if very close (30px)
      if (distToPrev < 30) {
        setGlowDotPosition({ x: dotPositions[prevArrayIndex].x, y: dotPositions[prevArrayIndex].y })
        setCurrentDotIndex(prevIndex)
        setSelectedDot(prevIndex)
      } else if (distToNext < 30) {
        setGlowDotPosition({ x: dotPositions[nextArrayIndex].x, y: dotPositions[nextArrayIndex].y })
        setCurrentDotIndex(nextIndex)
        setSelectedDot(nextIndex)
      } else if (distToCurrent < 30) {
        setGlowDotPosition({ x: dotPositions[currentArrayIndex].x, y: dotPositions[currentArrayIndex].y })
        setSelectedDot(currentDotIndex)
      } else {
        // Move along the path
        setGlowDotPosition({ x: pathPoint.x, y: pathPoint.y })
        // Check if we're on a dot
        dotPositions.forEach((dot) => {
          const distance = Math.hypot(pathPoint.x - dot.x, pathPoint.y - dot.y)
          if (distance < 30) {
            setSelectedDot(dot.index)
          }
        })
      }
    }
  }
  
  const handleTouchEnd = () => {
    setIsDragging(false)
    // Snap to nearest adjacent dot on release
    if (glowDotPosition && dotPositions.length > 0) {
      // Get adjacent dot indices based on path order
      const { prevIndex, nextIndex } = getPathAdjacentIndices(currentDotIndex)
      
      // Find array indices
      const currentArrayIndex = dotPositions.findIndex(dot => dot.index === currentDotIndex)
      const prevArrayIndex = dotPositions.findIndex(dot => dot.index === prevIndex)
      const nextArrayIndex = dotPositions.findIndex(dot => dot.index === nextIndex)
      
      if (currentArrayIndex === -1 || prevArrayIndex === -1 || nextArrayIndex === -1) return
      
      const distToCurrent = Math.hypot(glowDotPosition.x - dotPositions[currentArrayIndex].x, glowDotPosition.y - dotPositions[currentArrayIndex].y)
      const distToPrev = Math.hypot(glowDotPosition.x - dotPositions[prevArrayIndex].x, glowDotPosition.y - dotPositions[prevArrayIndex].y)
      const distToNext = Math.hypot(glowDotPosition.x - dotPositions[nextArrayIndex].x, glowDotPosition.y - dotPositions[nextArrayIndex].y)
      
      // Snap to the closest adjacent dot
      if (distToPrev < distToNext && distToPrev < distToCurrent) {
        setGlowDotPosition({ x: dotPositions[prevArrayIndex].x, y: dotPositions[prevArrayIndex].y })
        setCurrentDotIndex(prevIndex)
        setSelectedDot(prevIndex)
      } else if (distToNext < distToCurrent) {
        setGlowDotPosition({ x: dotPositions[nextArrayIndex].x, y: dotPositions[nextArrayIndex].y })
        setCurrentDotIndex(nextIndex)
        setSelectedDot(nextIndex)
      } else {
        setGlowDotPosition({ x: dotPositions[currentArrayIndex].x, y: dotPositions[currentArrayIndex].y })
        setSelectedDot(currentDotIndex)
      }
    }
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleTouchMove(e)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTouchMove(e)
    }
  }
  
  const handleMouseUp = () => {
    handleTouchEnd()
  }
  
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
                    sizes="100vw"
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
          <BrandCarousel brands={hotBrands} title="HOT DROPS 🔥" getStyleDisplayName={getStyleDisplayName} />
        )}
        
        {/* New Drop Section */}
        {newBrands.length > 0 && (
          <BrandCarousel brands={newBrands} title="NEW DROPS ✨" getStyleDisplayName={getStyleDisplayName} />
        )}
        
        {/* All Brands Section */}
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-white mb-3">PICK YOUR STREET VIBE</h2>
          
          {/* Style Filter */}
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="border border-white/20 bg-black/20 backdrop-blur-md text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
            >
              <option value="All" className="bg-black">ALL</option>
              {availableStyles.map(style => (
                <option key={style} value={style} className="bg-black">{getStyleDisplayName(style)}</option>
              ))}
            </select>
            <span className="text-sm text-gray-400">({allBrands.length} brands)</span>
          </div>
        
          {/* Mobile: 2 columns with compact cards, Desktop: 3 columns with regular cards */}
          <div className="grid grid-cols-2 sm:hidden gap-2">
            {allBrands.map((brand) => (
              <CompactBrandCard key={brand.id} brand={brand} getStyleDisplayName={getStyleDisplayName} />
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} getStyleDisplayName={getStyleDisplayName} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

