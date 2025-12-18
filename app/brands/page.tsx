'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from 'react'
import { getBrands, Brand, getFeatures, Feature, getProductsByBrand, Product } from '@/lib/data'
import BrandFollowButton from '@/app/components/BrandFollowButton'

// Brand card component to avoid repetition
function BrandCard({ brand, compact, getCategoryDisplayName }: { brand: Brand; compact?: boolean; getCategoryDisplayName?: (category: string | null | undefined) => string }) {
  const [randomProducts, setRandomProducts] = useState<Product[]>([])
  const [productImages, setProductImages] = useState<Record<string, string>>({})

  // Function to get random image for a product based on black or white color only
  const getRandomImageForProduct = (product: Product): string | null => {
    if (!product.images || product.images.length === 0) {
      return null
    }
    
    if (!product.colors || product.colors.length === 0) {
      // Return first image if no color information
      return product.images[0]
    }
    
    // Filter for black or white colors only
    const blackOrWhiteColors = product.colors.filter(color => 
      color.toUpperCase() === 'BLACK' || color.toUpperCase() === 'WHITE'
    )
    
    if (blackOrWhiteColors.length === 0) {
      // If no black or white, return first image
      return product.images[0]
    }
    
    // Randomly select one from black or white colors
    const randomColor = blackOrWhiteColors[Math.floor(Math.random() * blackOrWhiteColors.length)]
    
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
          // Separate products with HOT badge and others
          const hotProducts = products.filter(p => p.badge === 'HOT')
          const otherProducts = products.filter(p => p.badge !== 'HOT')
          
          // Shuffle both arrays
          const shuffledHot = [...hotProducts].sort(() => 0.5 - Math.random())
          const shuffledOther = [...otherProducts].sort(() => 0.5 - Math.random())
          
          // Prioritize HOT products, then fill with others
          const selectedProducts: Product[] = []
          selectedProducts.push(...shuffledHot.slice(0, 4))
          if (selectedProducts.length < 4) {
            selectedProducts.push(...shuffledOther.slice(0, 4 - selectedProducts.length))
          }
          
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
            
            {/* Follow button - positioned at top right */}
            <BrandFollowButton brandId={brand.id} />
            
            {/* Brand icon - positioned at bottom left */}
            <div className="absolute bottom-1 left-1 z-10">
              <div className="w-14 h-14 bg-white backdrop-blur-md rounded-lg shadow-2xl border-2 border-white/50 overflow-hidden ring-2 ring-black/20">
                {brand.icon ? (
                  <Image 
                    src={brand.icon} 
                    alt={brand.name} 
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-bold">{brand.name.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Brand name and animal button - positioned at bottom right */}
            <div className="absolute bottom-1 right-0 z-10 flex flex-col items-end gap-0.3">
              <div className="px-1 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-md truncate max-w-[180px]">
                {brand.name.length > 10 ? brand.name.slice(0, 10) : brand.name}
              </div>
              {brand.animal && (
                <span className="mr-1 px-2 bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full">
                  {brand.animal}
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
            {brand.icon ? (
              <Image 
                src={brand.icon} 
                alt={brand.name} 
                fill
                sizes="88px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg font-bold">{brand.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Glass overlay for bottom half */}
        <div className="absolute bottom-0 left-0 right-0 pt-1 px-3 bg-black/20 backdrop-blur-md border-t border-white/10 min-h-[60px]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg group-hover:text-white transition-colors">
              {brand.name}
            </h3>
            {brand.animal && (
              <span className="px-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                {brand.animal}
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

// Category button component to handle hover state
function CategoryButton({ 
  category, 
  isSelected, 
  colors, 
  onClick, 
  displayName 
}: { 
  category: string; 
  isSelected: boolean; 
  colors: { 
    activeBg: string; 
    activeText: string; 
    activeBorder: string;
    inactiveBg: string;
    inactiveText: string;
    inactiveBorder: string;
    hoverBg: string;
    hoverBorder: string;
  }; 
  onClick: () => void; 
  displayName: string;
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Category patterns (subtle)
  const getCategoryPattern = () => {
    if (!isSelected) return 'none'
    
    const categoryUpper = category.toUpperCase()
    
    // Paw pattern for PETS
    if (categoryUpper === 'PETS') {
      return `
        radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.15) 8%, transparent 8%),
        radial-gradient(circle at 45% 35%, rgba(255, 255, 255, 0.15) 7%, transparent 7%),
        radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.15) 8%, transparent 8%),
        radial-gradient(circle at 38% 55%, rgba(255, 255, 255, 0.15) 12%, transparent 12%),
        radial-gradient(circle at 52% 58%, rgba(255, 255, 255, 0.15) 12%, transparent 12%)
      `
    }
    
    // Diagonal stripes for PREDATORS (fangs/claws image)
    if (categoryUpper === 'PREDATORS') {
      return `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 8px,
          rgba(255, 255, 255, 0.12) 8px,
          rgba(255, 255, 255, 0.12) 10px
        )
      `
    }
    
    // Leaf vein pattern for WILD NATURE
    if (categoryUpper === 'WILD NATURE') {
      return `
        linear-gradient(125deg, transparent 48%, rgba(255, 255, 255, 0.08) 49%, rgba(255, 255, 255, 0.08) 51%, transparent 52%),
        linear-gradient(235deg, transparent 48%, rgba(255, 255, 255, 0.08) 49%, rgba(255, 255, 255, 0.08) 51%, transparent 52%)
      `
    }
    
    // Wave pattern for OCEAN
    if (categoryUpper === 'OCEAN') {
      return `
        repeating-radial-gradient(
          ellipse at 50% 0%,
          transparent 0px,
          transparent 8px,
          rgba(255, 255, 255, 0.1) 8px,
          rgba(255, 255, 255, 0.1) 10px,
          transparent 10px,
          transparent 18px
        )
      `
    }
    
    // Stars and subtle gradient for NOCTURNAL
    if (categoryUpper === 'DARK / NOCTURNAL') {
      return `
        radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.2) 2%, transparent 2%),
        radial-gradient(circle at 35% 60%, rgba(255, 255, 255, 0.15) 1.5%, transparent 1.5%),
        radial-gradient(circle at 55% 35%, rgba(255, 255, 255, 0.18) 2%, transparent 2%),
        radial-gradient(circle at 75% 70%, rgba(255, 255, 255, 0.15) 1.5%, transparent 1.5%),
        radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.2) 2%, transparent 2%),
        radial-gradient(circle at 25% 80%, rgba(255, 255, 255, 0.15) 1.5%, transparent 1.5%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)
      `
    }
    
    // Sparkle dots for MYTHICAL
    if (categoryUpper === 'MYTHICAL') {
      return `
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.25) 2%, transparent 2%),
        radial-gradient(circle at 60% 50%, rgba(255, 255, 255, 0.2) 1.5%, transparent 1.5%),
        radial-gradient(circle at 80% 25%, rgba(255, 255, 255, 0.22) 2%, transparent 2%),
        radial-gradient(circle at 40% 75%, rgba(255, 255, 255, 0.18) 1.5%, transparent 1.5%),
        radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.2) 2%, transparent 2%)
      `
    }
    
    // Hexagon honeycomb for INSECTS
    if (categoryUpper === 'INSECTS / SMALL CREATURES') {
      return `
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 14px,
          rgba(255, 255, 255, 0.1) 14px,
          rgba(255, 255, 255, 0.1) 15px
        ),
        repeating-linear-gradient(
          60deg,
          transparent,
          transparent 14px,
          rgba(255, 255, 255, 0.1) 14px,
          rgba(255, 255, 255, 0.1) 15px
        ),
        repeating-linear-gradient(
          120deg,
          transparent,
          transparent 14px,
          rgba(255, 255, 255, 0.1) 14px,
          rgba(255, 255, 255, 0.1) 15px
        )
      `
    }
    
    return 'none'
  }
  
  // Get background size for each category pattern
  const getBackgroundSize = () => {
    if (!isSelected) return 'auto'
    
    const categoryUpper = category.toUpperCase()
    
    if (categoryUpper === 'PETS') return '40px 40px'
    if (categoryUpper === 'WILD NATURE') return '30px 30px'
    if (categoryUpper === 'OCEAN') return '100% 20px'
    if (categoryUpper === 'DARK / NOCTURNAL') return '100% 100%'
    if (categoryUpper === 'MYTHICAL') return '100% 100%'
    if (categoryUpper === 'INSECTS / SMALL CREATURES') return '28px 28px'
    
    return 'auto'
  }
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-2 py-1.5 rounded-lg text-sm font-medium transition-all border shadow-md relative overflow-hidden backdrop-blur-md"
      style={{
        backgroundColor: isSelected 
          ? colors.activeBg 
          : (isHovered ? colors.hoverBg : colors.inactiveBg),
        color: isSelected ? colors.activeText : colors.inactiveText,
        borderColor: isSelected 
          ? colors.activeBorder 
          : (isHovered ? colors.hoverBorder : colors.inactiveBorder),
        backgroundImage: getCategoryPattern(),
        backgroundSize: getBackgroundSize(),
        backgroundRepeat: 'repeat',
      }}
    >
      {displayName}
    </button>
  )
}

// Brand carousel component for Hot Drop and New Drop sections
function BrandCarousel({ brands, title, getCategoryDisplayName }: { brands: Brand[], title: string; getCategoryDisplayName?: (category: string | null | undefined) => string }) {
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
      <h2 className="text-2xl font-bold text-black mb-4">{title}</h2>
      
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
                    <BrandCard key={brand.id} brand={brand} compact={screenSize === 'mobile'} getCategoryDisplayName={getCategoryDisplayName} />
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
                    ? 'bg-gray-800 w-6'
                    : 'bg-gray-400 hover:bg-gray-600'
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
function CompactBrandCard({ brand, getCategoryDisplayName }: { brand: Brand; getCategoryDisplayName?: (category: string | null | undefined) => string }) {
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
        
        {/* Follow button - positioned at top right */}
        <BrandFollowButton brandId={brand.id} />
        
        {/* Brand icon - positioned at bottom left */}
        <div className="absolute bottom-1 left-1 z-10">
          <div className="w-14 h-14 bg-white backdrop-blur-md rounded-lg shadow-2xl border-2 border-white/50 overflow-hidden ring-2 ring-black/20">
            {brand.icon ? (
              <Image 
                src={brand.icon} 
                alt={brand.name} 
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">{brand.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Brand name and animal button with glass design - positioned at bottom right */}
        <div className="absolute bottom-1 right-0 z-10 flex flex-col items-end gap-0.3">
          <div className="px-1 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-md truncate max-w-[180px]">
            {brand.name.length > 10 ? brand.name.slice(0, 10) : brand.name}
          </div>
          {brand.animal && (
            <span className="mr-1 px-2  bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium rounded-full">
              {brand.animal}
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedAnimal, setSelectedAnimal] = useState<string>('All')
  const [availableAnimals, setAvailableAnimals] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  
  // Category name mapping for display
  const categoryDisplayNames: Record<string, string> = {
    'PETS': 'PETS',
    'PREDATORS': 'PREDATORS',
    'WILD NATURE': 'WILD NATURE',
    'OCEAN': 'OCEAN',
    'DARK / NOCTURNAL': 'NOCTURNAL',
    'MYTHICAL': 'MYTHICAL',
    'INSECTS / SMALL CREATURES': 'INSECTS',
    'OTHERS': 'OTHERS'
  }
  
  // Category color mapping for all states
  const categoryColors: Record<string, { 
    activeBg: string; 
    activeText: string; 
    activeBorder: string;
    inactiveBg: string;
    inactiveText: string;
    inactiveBorder: string;
    hoverBg: string;
    hoverBorder: string;
  }> = {
    'ALL': { 
      activeBg: '#111827', activeText: '#FFFFFF', activeBorder: '#111827',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#CBD5E1',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#94A3B8'
    },
    'PETS': { 
      activeBg: '#16A34A', activeText: '#FFFFFF', activeBorder: '#16A34A',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#86EFAC',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#22C55E'
    },
    'PREDATORS': { 
      activeBg: '#B45309', activeText: '#FFFFFF', activeBorder: '#B45309',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#FCD34D',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#F59E0B'
    },
    'WILD NATURE': { 
      activeBg: '#065F46', activeText: '#FFFFFF', activeBorder: '#065F46',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#6EE7B7',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#10B981'
    },
    'OCEAN': { 
      activeBg: '#0284C7', activeText: '#FFFFFF', activeBorder: '#0284C7',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#7DD3FC',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#38BDF8'
    },
    'DARK / NOCTURNAL': { 
      activeBg: '#312E81', activeText: '#FFFFFF', activeBorder: '#312E81',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#A5B4FC',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#6366F1'
    },
    'MYTHICAL': { 
      activeBg: '#7C3AED', activeText: '#FFFFFF', activeBorder: '#7C3AED',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#C4B5FD',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#8B5CF6'
    },
    'INSECTS / SMALL CREATURES': { 
      activeBg: '#4D7C0F', activeText: '#FFFFFF', activeBorder: '#4D7C0F',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#BEF264',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#84CC16'
    },
    'OTHERS': { 
      activeBg: '#334155', activeText: '#FFFFFF', activeBorder: '#334155',
      inactiveBg: 'rgba(255, 255, 255, 0.5)', inactiveText: '#0F172A', inactiveBorder: '#CBD5E1',
      hoverBg: 'rgba(255, 255, 255, 0.75)', hoverBorder: '#64748B'
    }
  }
  
  const getCategoryDisplayName = (category: string | null | undefined): string => {
    if (!category) return ''
    return categoryDisplayNames[category] || category
  }
  
  const getCategoryColor = (category: string) => {
    const normalizedCategory = category === 'All' ? 'ALL' : category.toUpperCase()
    return categoryColors[normalizedCategory] || categoryColors['ALL']
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

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

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
        
        // Get unique categories from brands that have categories
        const categories = [...new Set(brandsData
          .filter(brand => brand.category)
          .map(brand => brand.category!)
        )]
        
        // Sort categories in the specified order
        const categoryOrder = [
          'PETS',
          'WILD NATURE',
          'OCEAN',
          'PREDATORS',
          'MYTHICAL',
          'DARK / NOCTURNAL',
          'INSECTS / SMALL CREATURES',
          'OTHERS'
        ]
        
        const sortedCategories = categories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.toUpperCase())
          const indexB = categoryOrder.indexOf(b.toUpperCase())
          // If category not in order list, put it at the end
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })
        
        setAvailableCategories(sortedCategories)
        
        // Initial animals list (will be filtered by category)
        const allAnimals = [...new Set(brandsData
          .filter(brand => brand.animal)
          .map(brand => brand.animal!)
        )].sort()
        setAvailableAnimals(allAnimals)
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

  // Update available animals based on selected category
  useEffect(() => {
    let categoryFiltered = brands
    
    // Filter by category to get available animals
    if (selectedCategory !== 'All') {
      categoryFiltered = categoryFiltered.filter(brand => brand.category && brand.category.toUpperCase() === selectedCategory.toUpperCase())
    }
    
    // Get unique animals from filtered brands
    const animals = [...new Set(categoryFiltered
      .filter(brand => brand.animal)
      .map(brand => brand.animal!)
    )].sort()
    setAvailableAnimals(animals)
    
    // If selected animal is not in available animals, reset to 'All'
    if (selectedAnimal !== 'All' && !animals.includes(selectedAnimal)) {
      setSelectedAnimal('All')
    }
  }, [brands, selectedCategory])

  // Filter all brands by category and animal
  useEffect(() => {
    let filtered = brands
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(brand => brand.category && brand.category.toUpperCase() === selectedCategory.toUpperCase())
    }
    
    // Filter by animal
    if (selectedAnimal !== 'All') {
      filtered = filtered.filter(brand => brand.animal && brand.animal === selectedAnimal)
    }
    
    setAllBrands(filtered)
  }, [brands, selectedCategory, selectedAnimal])

  // Get background color based on selected category
  const getBackgroundColor = () => {
    const categoryColorMap: Record<string, string> = {
      'All': '#E7E8E9',
      'PETS': '#E8F6ED',
      'WILD NATURE': '#E6EFEC',
      'OCEAN': '#E6F3F9',
      'PREDATORS': '#F8EEE6',
      'MYTHICAL': '#F2EBFD',
      'DARK / NOCTURNAL': '#EAEAF2',
      'INSECTS / SMALL CREATURES': '#EDF2E7',
      'OTHERS': '#EBECEE'
    }
    return categoryColorMap[selectedCategory] || '#E7E8E9'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-[#FAFAF7]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  const backgroundColor = getBackgroundColor()

  return (
    <div className="bg-[#FAFAF7]">
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
      <div className="max-w-7xl mx-auto px-3">
        
        {/* Hot Drop Section */}
        <div className="py-6">
        {hotBrands.length > 0 && (
            <BrandCarousel brands={hotBrands} title="Trending Now" getCategoryDisplayName={getCategoryDisplayName} />
        )}
        </div>
        
        {/* New Drop Section */}
        {newBrands.length > 0 && (
          <BrandCarousel brands={newBrands} title="New Arrivals" getCategoryDisplayName={getCategoryDisplayName} />
        )}
        
        {/* All Brands Section */}
        <div 
          className="py-8 -mx-2 px-1"
          style={{
            backgroundColor: backgroundColor
          }}
        >
        <div className="mb-3">
            <h2 className="text-2xl font-bold text-black mb-3 px-1">Find your favorite brands</h2>
          
          {/* Category Filter */}
          {/* Button grid for all devices */}
          <div className="mb-1 md:mb-2 px-1">
            <div className="flex flex-wrap gap-1">
              {['All', ...availableCategories].map((category) => {
                const categoryValue = category === 'All' ? 'All' : category.toUpperCase()
                const isSelected = selectedCategory === categoryValue
                const colors = getCategoryColor(category)
                
                return (
                  <CategoryButton
                  key={category}
                    category={category}
                    isSelected={isSelected}
                    colors={colors}
                  onClick={() => {
                    setSelectedCategory(categoryValue)
                    // Small vibration on tap
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10)
                    }
                  }}
                    displayName={category === 'All' ? 'ALL' : getCategoryDisplayName(category)}
                  />
                )
              })}
            </div>
          </div>
          
          {/* Animal Filter - Only show when a category is selected */}
          {selectedCategory !== 'All' && (() => {
            // Get icon based on selected category
            const getCategoryIcon = () => {
              const iconMap: Record<string, string> = {
                'PETS': '🐾',
                'WILD NATURE': '🌿',
                'OCEAN': '🌊',
                'PREDATORS': '🦁',
                'MYTHICAL': '🦄',
                'DARK / NOCTURNAL': '🌙',
                'INSECTS / SMALL CREATURES': '🦋',
                'OTHERS': '🧩'
              }
              return iconMap[selectedCategory] || '🐾'
            }
            
            return (
            <div className="mb-2">
                {/* Divider with icon */}
                <div className="flex items-center justify-center my-1">
                  <div className="flex-1 border-t border-slate-200"></div>
                  <div className="px-3 text-2xl">{getCategoryIcon()}</div>
                  <div className="flex-1 border-t border-slate-200"></div>
                </div>
                
              {/* Button grid for all devices */}
              <div className="flex flex-wrap gap-1">
                {['All', ...availableAnimals].map((animal) => {
                  const isSelected = selectedAnimal === (animal === 'All' ? 'All' : animal)
                  return (
                  <button
                    key={animal}
                    onClick={() => {
                      setSelectedAnimal(animal === 'All' ? 'All' : animal)
                      // Small vibration on tap
                      if ('vibrate' in navigator) {
                        navigator.vibrate(10)
                      }
                    }}
                      className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-all backdrop-blur-md border shadow-md ${
                        isSelected
                          ? 'text-white shadow-lg'
                          : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor: isSelected ? '#1F2937' : 'rgba(255, 255, 255, 0.5)',
                        borderColor: isSelected ? '#111827' : '#D1D5DB',
                      }}
                  >
                    {animal === 'All' ? 'ALL' : animal}
                  </button>
                  )
                })}
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-black/60">({allBrands.length} brands)</span>
              </div>
            </div>
            )
          })()}
          
          {/* Brand count - Show when no category is selected */}
          {selectedCategory === 'All' && (
            <div className="text-center mb-4">
              <span className="text-sm text-black/60">({allBrands.length} brands)</span>
            </div>
          )}
        
          {/* Mobile: 2 columns with compact cards, Desktop: 3 columns with regular cards */}
          <div className="grid grid-cols-2 sm:hidden gap-1">
            {allBrands.map((brand) => (
              <CompactBrandCard key={brand.id} brand={brand} getCategoryDisplayName={getCategoryDisplayName} />
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} getCategoryDisplayName={getCategoryDisplayName} />
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

