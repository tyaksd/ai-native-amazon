'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, use, Component, ReactNode } from 'react'
import { getBrandById, getProductsByBrand, getBrands, Brand, Product } from "@/lib/data";
import FavoriteButton from '@/app/components/FavoriteButton';
import { useFavorites, useFavoritesFallback } from '@/lib/useFavorites';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Error boundary component to catch Clerk hook errors
class ClerkErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Only log if it's a Clerk-related error
    if (error.message?.includes('ClerkProvider') || error.message?.includes('useUser')) {
      console.warn('BrandPage: Clerk not available, rendering without Clerk features')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type PageProps = {
  params: Promise<{ brandId: string }>;
};

// Component that renders the page without Clerk features (fallback)
function BrandPageWithoutClerk({ params, hideHeader = false }: PageProps & { hideHeader?: boolean }) {
  const resolvedParams = use(params)
  const user: { id?: string } | null = null
  const isUserLoaded = true
  const [brand, setBrand] = useState<Brand | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [nextBrand, setNextBrand] = useState<Brand | null>(null)
  const [prevBrand, setPrevBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'new'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [isFollowed, setIsFollowed] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  
  // Use the useFavoritesFallback hook since this component doesn't use Clerk
  const { isFavorited, checkFavorites } = useFavoritesFallback()

  // Get badge colors
  const getBadgeColors = (badge: string | null) => {
    switch (badge) {
      case 'NEW':
        return {
          border: '#10B981',
          background: '#022C22',
          text: '#A7F3D0'
        }
      case 'HOT':
        return {
          border: '#F97316',
          background: '#451A03',
          text: '#FED7AA'
        }
      case 'SALE':
        return {
          border: '#EF4444',
          background: '#450A0A',
          text: '#FCA5A5'
        }
      case 'SECRET':
        return {
          border: '#8B5CF6',
          background: '#020617',
          text: '#E5E7EB'
        }
      case 'PICK':
        return {
          border: '#38BDF8',
          background: '#0B1220',
          text: '#E0F2FE'
        }
      default:
        return null
    }
  }

  // Get available types from products
  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    items.forEach(product => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types).sort()
  }, [items])

  // Get available types after category and gender filters are applied
  const availableTypesAfterFilters = useMemo(() => {
    let filtered = items
    
    // Filter by tab (all vs new)
    if (selectedTab === 'new') {
      filtered = filtered.filter(p => p.badge === 'NEW')
    }
    
    // Filter by category (using type field)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.type === selectedCategory)
    }
    
    // Filter by gender
    if (selectedGender !== 'All') {
      filtered = filtered.filter(p => p.gender === selectedGender)
    }
    
    const types = new Set<string>()
    filtered.forEach(product => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types).sort()
  }, [items, selectedTab, selectedCategory, selectedGender])

  const displayedItems = useMemo(() => {
    let filtered = items
    
    // Filter by tab (all vs new)
    if (selectedTab === 'new') {
      filtered = filtered.filter(p => p.badge === 'NEW')
    }
    
    // Filter by category (using type field)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.type === selectedCategory)
    }
    
    // Filter by gender
    if (selectedGender !== 'All') {
      filtered = filtered.filter(p => p.gender === selectedGender)
    }
    
    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(p => p.type === selectedType)
    }
    
    return filtered
  }, [items, selectedTab, selectedCategory, selectedGender, selectedType])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData, brandsData] = await Promise.all([
          getBrandById(resolvedParams.brandId),
          getProductsByBrand(resolvedParams.brandId),
          getBrands()
        ])
        setBrand(brandData)
        setItems(productsData)
        
        // Sort brands by created_at (newest first) for navigation
        const sortedBrands = [...brandsData].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Descending order (newest first)
        })
        setAllBrands(sortedBrands)
        
        // Find next and previous brand based on database order (created_at, newest first)
        if (brandData && sortedBrands.length > 0) {
          const currentIndex = sortedBrands.findIndex(b => b.id === brandData.id)
          if (currentIndex !== -1) {
            // Get next brand (older brand, loop to first if at end)
            const nextIndex = (currentIndex + 1) % sortedBrands.length
            setNextBrand(sortedBrands[nextIndex])
            // Get previous brand (newer brand, loop to last if at beginning)
            const prevIndex = currentIndex === 0 ? sortedBrands.length - 1 : currentIndex - 1
            setPrevBrand(sortedBrands[prevIndex])
          }
        }
        
        // Check favorites for all products at once
        if (productsData.length > 0) {
          const productIds = productsData.map(p => p.id)
          await checkFavorites(productIds)
        }
      } catch (error) {
        console.error('Error loading brand data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.brandId, checkFavorites])

  // Get user ID: prefer Clerk ID if logged in, otherwise use session_id
  const getUserId = (): string | null => {
    const typedUser = user as { id?: string } | null
    if (typedUser && typedUser.id) {
      return typedUser.id
    }
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('session_id', sessionId)
      }
      return sessionId
    }
    return null
  }

  // Check if brand is followed
  useEffect(() => {
    if (!brand) {
      setIsFollowed(false)
      return
    }

    const checkFollow = async () => {
      try {
        const currentUserId = getUserId()
        if (!currentUserId) {
          setIsFollowed(false)
          return
        }

        const typedUser = user as { id?: string } | null
        const isLoggedIn = !!(typedUser && typedUser.id)

        const { data, error } = await supabase
          .from('brand_follows')
          .select('id')
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brand.id)
          .maybeSingle()

        if (error) {
          console.error('Error checking brand follow:', error)
          return
        }
        
        setIsFollowed(!!data)
      } catch (error) {
        console.error('Error checking brand follow:', error)
      }
    }

    // Always check follow status, regardless of login state
    checkFollow()
  }, [brand?.id])

  const handleToggleFollow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (isFollowLoading || !brand) return

    const currentUserId = getUserId()
    if (!currentUserId) {
      console.log('No user ID available')
      return
    }

    console.log('Toggling follow:', { currentUserId, brandId: brand.id, isFollowed })
    setIsFollowLoading(true)
    try {
      const typedUser = user as { id?: string } | null
      const isLoggedIn = !!(typedUser && typedUser.id)

      if (isFollowed) {
        // Unfollow brand
        const { error } = await supabase
          .from('brand_follows')
          .delete()
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brand.id)

        if (error) {
          console.error('Error unfollowing brand:', error)
        } else {
          setIsFollowed(false)
        }
      } else {
        // Follow brand
        const insertData = isLoggedIn
          ? {
              clerk_id: currentUserId,
              brand_id: brand.id,
              session_id: null
            }
          : {
              session_id: currentUserId,
              brand_id: brand.id,
              clerk_id: null
            }

        const { error } = await supabase
          .from('brand_follows')
          .insert(insertData)

        if (error) {
          console.error('Error following brand:', error)
        } else {
          setIsFollowed(true)
        }
      }
    } catch (error) {
      console.error('Error toggling brand follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  // Reset selectedType if it's not available after filters change
  useEffect(() => {
    if (selectedType !== 'All' && !availableTypesAfterFilters.includes(selectedType)) {
      setSelectedType('All')
    }
  }, [selectedType, availableTypesAfterFilters])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
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
    <div className="relative min-h-screen">
      {/* Background Image for entire page */}
      {brand.background_image && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill 
            sizes="100vw"
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}
      
      {/* Brand Logo Space */}
      {!hideHeader && (
      <div className="relative z-10  pb-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col items-start gap-3 flex-1">
            <div className="flex flex-col items-start gap-3 transform translate-y-8 w-full">
              <div className="w-25 h-25 bg-white/90 rounded-lg shadow-lg overflow-hidden ml-3">
                
                <Image 
                  src={brand.icon} 
                  alt={brand.name} 
                  width={100}
                  height={100}
                  className="object-cover rounded"
                />
 
              </div>
              <h2 className="text-2xl px-3 font-bold text-white drop-shadow-lg whitespace-nowrap">{brand.name} products</h2>
              
              {/* Category Navigation Tabs */}
              <div className=" w-full">
                <div className="flex flex-wrap gap-2 border-b border-white/30 px-3">
                  <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === 'all'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    All Products
                  </button>
                  <button
                    onClick={() => setSelectedTab('new')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === 'new'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="mt-1 w-full">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-white px-3">Filter by type:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                  >
                    <option value="All">All Types</option>
                    {availableTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

              
              </div>
              
              {/* Products Grid */}
              <div className="mt-3 w-full">
                {displayedItems.length === 0 ? (
                  <div className="text-white text-center py-12 drop-shadow-lg">No products available for this brand.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-y-4">
                    {displayedItems.map((p, index) => {
                      // 黒と白を交互に選択する関数
                      const getImageForProduct = (product: Product, productIndex: number): string | null => {
                        if (!product.images || product.images.length === 0) {
                          return null
                        }
                        
                        // 黒と白が利用可能かチェック
                        if (product.colors && product.colors.length > 0) {
                          // インデックスに基づいて黒と白を交互に選択
                          const targetColor = productIndex % 2 === 0 ? 'Black' : 'White'
                          
                          // カラー名の正規化（大文字小文字を無視）
                          const normalizedColors = product.colors.map(c => c.trim())
                          const blackIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'black')
                          const whiteIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'white')
                          
                          // 黒または白が見つかった場合、対応する画像を使用
                          if (targetColor === 'Black' && blackIndex >= 0) {
                            const imageIndex = blackIndex % product.images.length
                            return product.images[imageIndex]
                          } else if (targetColor === 'White' && whiteIndex >= 0) {
                            const imageIndex = whiteIndex % product.images.length
                            return product.images[imageIndex]
                          }
                          
                          // 交互に選択したいカラーが見つからない場合、もう一方を試す
                          if (targetColor === 'Black' && whiteIndex >= 0) {
                            const imageIndex = whiteIndex % product.images.length
                            return product.images[imageIndex]
                          } else if (targetColor === 'White' && blackIndex >= 0) {
                            const imageIndex = blackIndex % product.images.length
                            return product.images[imageIndex]
                          }
                        }
                        
                        // フォールバック: 最初の画像を使用
                        return product.images[0]
                      }
                      
                      const selectedImage = getImageForProduct(p, index)
                      
                      return (
                        <div key={p.id} className="group relative">
                          <Link href={`/${p.brand_id}/${p.id}`} className="block">
                            <div className="aspect-square bg-gray-50">
                              {selectedImage ? (
                                <Image src={selectedImage} alt={p.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">No image</span>
                                </div>
                              )}
                            </div>
                          </Link>
                          {p.badge && getBadgeColors(p.badge) && (() => {
                            const colors = getBadgeColors(p.badge)!
                            const fontSize = p.badge === 'SECRET' 
                              ? 'clamp(0.5625rem, 2.25vw, 0.8125rem)' 
                              : 'clamp(0.625rem, 2.5vw, 0.875rem)'
                            return (
                              <div className="absolute top-0 left-0 w-[25%] aspect-square">
                                {/* Border triangle (outer) */}
                                <div 
                                  className="absolute w-full h-full"
                                  style={{ 
                                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                                    backgroundColor: colors.border
                                  }}
                                />
                                {/* Inner triangle */}
                                <div 
                                  className="absolute"
                                  style={{ 
                                    top: '1.5px',
                                    left: '1.5px',
                                    width: 'calc(100% - 6px)',
                                    height: 'calc(100% - 6px)',
                                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                                    backgroundColor: colors.background
                                  }}
                                />
                                <span 
                                  className="font-bold absolute z-10"
                                  style={{ 
                                    color: colors.text,
                                    fontSize: fontSize,
                                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                                    transformOrigin: 'center',
                                    top: '35%',
                                    left: '35%',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {p.badge}
                                </span>
                            </div>
                            )
                          })()}
                          <div className="absolute top-2 right-2 z-10">
                            <FavoriteButton 
                              productId={p.id} 
                              className="bg-white/80 hover:bg-white rounded-full p-1"
                              initialFavoriteState={isFavorited(p.id)}
                            />
                          </div>
                          <div className="mt-2 ml-2">
                            <h3 className="font-medium text-white truncate drop-shadow-lg">{p.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-white drop-shadow-lg">{formatUSD(p.price)}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/90 text-gray-800">
                                {p.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons and Follow Button */}
          <div className="absolute top-5 right-3 flex flex-col items-center gap-2 transform -translate-y-4 md:translate-y-0" style={{ pointerEvents: 'auto' }}>
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Brand Navigation Button */}
            {prevBrand && (
              <Link 
                href={`/${prevBrand.id}`}
                className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label={`Go to ${prevBrand.name}`}
              >
                <svg 
                  className="w-6 h-6 text-white drop-shadow-lg group-hover:-translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </Link>
            )}
            
            {/* Next Brand Navigation Button */}
            {nextBrand && (
              <Link 
                href={`/${nextBrand.id}`}
                className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label={`Go to ${nextBrand.name}`}
              >
                <svg 
                  className="w-6 h-6 text-white drop-shadow-lg group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </Link>
            )}
          </div>
          
          {/* Follow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isFollowLoading && brand) {
                handleToggleFollow(e)
              }
            }}
            disabled={isFollowLoading || !brand}
            style={{ 
              pointerEvents: 'auto', 
              zIndex: 50, 
              position: 'relative',
              WebkitTapHighlightColor: 'transparent'
            }}
            className={`
              px-3 py-1 rounded-lg backdrop-blur-md border 
              transition-all duration-200 hover:scale-105 
              text-sm font-medium
              ${isFollowed
                ? 'bg-white/10 border-white/20 text-black hover:bg-white/20'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
              ${isFollowLoading || !brand 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer active:scale-95'
              }
            `}
          >
            {isFollowLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{isFollowed ? 'Unfollowing...' : 'Following...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
              </span>
            )}
          </button>
        </div>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Info */}
          <div className="lg:col-span-2">
          </div>

          {/* Right Column - About Brand */}
          <div className="lg:col-span-1 px-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sticky top-48 lg:top-48 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden flex-shrink-0 border border-white/30">
                  <Image 
                    src={brand.icon} 
                    alt={brand.name} 
                    width={40} 
                    height={40} 
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white drop-shadow-lg">About {brand.name}</h3>
                </div>
              </div>
              <p className="text-sm text-white/90 mb-4 break-words drop-shadow-md">
                {brand.description || `${brand.name}: Extraordinary Design Since 2020. Handcrafted with precision, ${brand.name} channels years of artistry into contemporary fashion and lifestyle products.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Clerk support
function BrandPageInner({ params }: PageProps) {
  const resolvedParams = use(params)
  const { user, isLoaded: isUserLoaded } = useUser() as { user: { id?: string } | null | undefined; isLoaded: boolean }
  const [brand, setBrand] = useState<Brand | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [nextBrand, setNextBrand] = useState<Brand | null>(null)
  const [prevBrand, setPrevBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'new'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [isFollowed, setIsFollowed] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  
  // Use the useFavorites hook to manage favorites efficiently
  const { isFavorited, checkFavorites } = useFavorites()

  // Get badge colors
  const getBadgeColors = (badge: string | null) => {
    switch (badge) {
      case 'NEW':
        return {
          border: '#10B981',
          background: '#022C22',
          text: '#A7F3D0'
        }
      case 'HOT':
        return {
          border: '#F97316',
          background: '#451A03',
          text: '#FED7AA'
        }
      case 'SALE':
        return {
          border: '#EF4444',
          background: '#450A0A',
          text: '#FCA5A5'
        }
      case 'SECRET':
        return {
          border: '#8B5CF6',
          background: '#020617',
          text: '#E5E7EB'
        }
      case 'PICK':
        return {
          border: '#38BDF8',
          background: '#0B1220',
          text: '#E0F2FE'
        }
      default:
        return null
    }
  }

  // Get available types from products
  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    items.forEach(product => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types).sort()
  }, [items])

  // Get available types after category and gender filters are applied
  const availableTypesAfterFilters = useMemo(() => {
    let filtered = items
    
    // Filter by tab (all vs new)
    if (selectedTab === 'new') {
      filtered = filtered.filter(p => p.badge === 'NEW')
    }
    
    // Filter by category (using type field)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.type === selectedCategory)
    }
    
    // Filter by gender
    if (selectedGender !== 'All') {
      filtered = filtered.filter(p => p.gender === selectedGender)
    }
    
    const types = new Set<string>()
    filtered.forEach(product => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types).sort()
  }, [items, selectedTab, selectedCategory, selectedGender])

  const displayedItems = useMemo(() => {
    let filtered = items
    
    // Filter by tab (all vs new)
    if (selectedTab === 'new') {
      filtered = filtered.filter(p => p.badge === 'NEW')
    }
    
    // Filter by category (using type field)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.type === selectedCategory)
    }
    
    // Filter by gender
    if (selectedGender !== 'All') {
      filtered = filtered.filter(p => p.gender === selectedGender)
    }
    
    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(p => p.type === selectedType)
    }
    
    return filtered
  }, [items, selectedTab, selectedCategory, selectedGender, selectedType])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData, brandsData] = await Promise.all([
          getBrandById(resolvedParams.brandId),
          getProductsByBrand(resolvedParams.brandId),
          getBrands()
        ])
        setBrand(brandData)
        setItems(productsData)
        
        // Sort brands by created_at (newest first) for navigation
        const sortedBrands = [...brandsData].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Descending order (newest first)
        })
        setAllBrands(sortedBrands)
        
        // Find next and previous brand based on database order (created_at, newest first)
        if (brandData && sortedBrands.length > 0) {
          const currentIndex = sortedBrands.findIndex(b => b.id === brandData.id)
          if (currentIndex !== -1) {
            // Get next brand (older brand, loop to first if at end)
            const nextIndex = (currentIndex + 1) % sortedBrands.length
            setNextBrand(sortedBrands[nextIndex])
            // Get previous brand (newer brand, loop to last if at beginning)
            const prevIndex = currentIndex === 0 ? sortedBrands.length - 1 : currentIndex - 1
            setPrevBrand(sortedBrands[prevIndex])
          }
        }
        
        // Check favorites for all products at once
        if (productsData.length > 0) {
          const productIds = productsData.map(p => p.id)
          await checkFavorites(productIds)
        }
      } catch (error) {
        console.error('Error loading brand data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.brandId, checkFavorites])

  // Get user ID: prefer Clerk ID if logged in, otherwise use session_id
  const getUserId = (): string | null => {
    const typedUser = user as { id?: string } | null
    if (typedUser && typedUser.id) {
      return typedUser.id
    }
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('session_id', sessionId)
      }
      return sessionId
    }
    return null
  }

  // Check if brand is followed
  useEffect(() => {
    if (!brand) {
      setIsFollowed(false)
      return
    }

    const checkFollow = async () => {
      try {
        const currentUserId = getUserId()
        if (!currentUserId) {
          setIsFollowed(false)
          return
        }

        const typedUser = user as { id?: string } | null
        const isLoggedIn = !!(typedUser && typedUser.id)
        
        const { data, error } = await supabase
          .from('brand_follows')
          .select('id')
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brand.id)
          .maybeSingle()

        if (error) {
          console.error('Error checking brand follow:', error)
          return
        }
        
        setIsFollowed(!!data)
      } catch (error) {
        console.error('Error checking brand follow:', error)
      }
    }

    // Always check follow status, regardless of login state
    checkFollow()
  }, [brand?.id, user?.id])

  const handleToggleFollow = async (e?: React.MouseEvent) => {
    // Prevent default and stop propagation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Guard clauses
    if (isFollowLoading || !brand) {
      return
    }

    // Get user ID (works for both logged in and non-logged in users)
    const currentUserId = getUserId()
    if (!currentUserId) {
      return
    }

    // Set loading state
    setIsFollowLoading(true)

    try {
      // Determine if user is logged in
      const typedUser = user as { id?: string } | null
      const isLoggedIn = !!(typedUser && typedUser.id)

      if (isFollowed) {
        // Unfollow: Delete the follow record
        const { error } = await supabase
          .from('brand_follows')
          .delete()
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brand.id)

        if (error) {
          console.error('Error unfollowing brand:', error)
        } else {
          setIsFollowed(false)
        }
      } else {
        // Follow: Insert a new follow record
        const insertData = isLoggedIn
          ? {
              clerk_id: currentUserId,
              brand_id: brand.id,
              session_id: null
            }
          : {
              session_id: currentUserId,
              brand_id: brand.id,
              clerk_id: null
            }

        const { error } = await supabase
          .from('brand_follows')
          .insert(insertData)

        if (error) {
          console.error('Error following brand:', error)
        } else {
          setIsFollowed(true)
        }
      }
    } catch (error) {
      console.error('Error toggling brand follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  // Reset selectedType if it's not available after filters change
  useEffect(() => {
    if (selectedType !== 'All' && !availableTypesAfterFilters.includes(selectedType)) {
      setSelectedType('All')
    }
  }, [availableTypesAfterFilters, selectedType])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="px-6 py-10">
        <div className="text-red-600 mb-4">Brand not found</div>
        <Link href="/brands" className="text-blue-600 underline">Back to Brands</Link>
      </div>
    )
  }

  // Use the same JSX as BrandPageWithoutClerk but with user support
  return (
    <div className="relative min-h-screen">
      {/* Background Image for entire page */}
      {brand.background_image && (
        <div className="fixed inset-0 z-0">
          <Image 
            src={brand.background_image} 
            alt={`${brand.name} background`} 
            fill 
            sizes="100vw"
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}
      
      {/* Brand Logo Space */}
      <div className="relative z-30 px-3 pb-4" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-end justify-between">
          <div className="flex flex-col items-start gap-3 flex-1">
            <div className="flex flex-col items-start gap-3 transform translate-y-8 w-full">
              <div className="w-25 h-25 bg-white/90 rounded-lg shadow-lg overflow-hidden">
                <Image 
                  src={brand.icon} 
                  alt={brand.name} 
                  width={100}
                  height={100}
                  className="object-cover rounded"
                />
              </div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg whitespace-nowrap">{brand.name} products</h2>
              
              {/* Category Navigation Tabs */}
              <div className="mt-2 w-full">
                <div className="flex flex-wrap gap-2 border-b border-white/30">
                  <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === 'all'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    All Products
                  </button>
                  <button
                    onClick={() => setSelectedTab('new')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === 'new'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="mt-4 w-full">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-white">Filter by type:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                  >
                    <option value="All">All Types</option>
                    {availableTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory !== 'All' && (
                  <div className="mt-4 flex items-center gap-2">
                    <label className="text-sm font-medium text-white">Filter by gender:</label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                    >
                      <option value="All">All Genders</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                )}

                {selectedCategory !== 'All' && selectedGender !== 'All' && (
                  <div className="mt-4 flex items-center gap-2">
                    <label className="text-sm font-medium text-white">Filter by type:</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                    >
                      <option value="All">All Types</option>
                      {availableTypesAfterFilters.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Products Grid */}
              <div className="mt-6 w-full">
                {displayedItems.length === 0 ? (
                  <div className="text-white text-center py-12 drop-shadow-lg">No products available for this brand.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-y-4">
                    {displayedItems.map((p, index) => {
                      // 黒と白を交互に選択する関数
                      const getImageForProduct = (product: Product, productIndex: number): string | null => {
                        if (!product.images || product.images.length === 0) {
                          return null
                        }
                        
                        // 黒と白が利用可能かチェック
                        if (product.colors && product.colors.length > 0) {
                          // インデックスに基づいて黒と白を交互に選択
                          const targetColor = productIndex % 2 === 0 ? 'Black' : 'White'
                          
                          // カラー名の正規化（大文字小文字を無視）
                          const normalizedColors = product.colors.map(c => c.trim())
                          const blackIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'black')
                          const whiteIndex = normalizedColors.findIndex(c => c.toLowerCase() === 'white')
                          
                          // 黒または白が見つかった場合、対応する画像を使用
                          if (targetColor === 'Black' && blackIndex >= 0) {
                            const imageIndex = blackIndex % product.images.length
                            return product.images[imageIndex]
                          } else if (targetColor === 'White' && whiteIndex >= 0) {
                            const imageIndex = whiteIndex % product.images.length
                            return product.images[imageIndex]
                          }
                          
                          // 交互に選択したいカラーが見つからない場合、もう一方を試す
                          if (targetColor === 'Black' && whiteIndex >= 0) {
                            const imageIndex = whiteIndex % product.images.length
                            return product.images[imageIndex]
                          } else if (targetColor === 'White' && blackIndex >= 0) {
                            const imageIndex = blackIndex % product.images.length
                            return product.images[imageIndex]
                          }
                        }
                        
                        // フォールバック: 最初の画像を使用
                        return product.images[0]
                      }
                      
                      const selectedImage = getImageForProduct(p, index)
                      
                      return (
                        <div key={p.id} className="group relative">
                          <Link href={`/${p.brand_id}/${p.id}`} className="block">
                            <div className="aspect-square bg-gray-50">
                              {selectedImage ? (
                                <Image src={selectedImage} alt={p.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">No image</span>
                                </div>
                              )}
                            </div>
                          </Link>
                          {p.badge && getBadgeColors(p.badge) && (() => {
                            const colors = getBadgeColors(p.badge)!
                            const fontSize = p.badge === 'SECRET' 
                              ? 'clamp(0.5625rem, 2.25vw, 0.8125rem)' 
                              : 'clamp(0.625rem, 2.5vw, 0.875rem)'
                            return (
                              <div className="absolute top-0 left-0 w-[25%] aspect-square">
                                {/* Border triangle (outer) */}
                                <div 
                                  className="absolute w-full h-full"
                                  style={{ 
                                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                                    backgroundColor: colors.border
                                  }}
                                />
                                {/* Inner triangle */}
                                <div 
                                  className="absolute"
                                  style={{ 
                                    top: '1.5px',
                                    left: '1.5px',
                                    width: 'calc(100% - 6px)',
                                    height: 'calc(100% - 6px)',
                                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                                    backgroundColor: colors.background
                                  }}
                                />
                                <span 
                                  className="font-bold absolute z-10"
                                  style={{ 
                                    color: colors.text,
                                    fontSize: fontSize,
                                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                                    transformOrigin: 'center',
                                    top: '35%',
                                    left: '35%',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {p.badge}
                                </span>
                            </div>
                            )
                          })()}
                          <div className="absolute top-2 right-2 z-10">
                            <FavoriteButton 
                              productId={p.id} 
                              className="bg-white/80 hover:bg-white rounded-full p-1"
                              initialFavoriteState={isFavorited(p.id)}
                            />
                          </div>
                          <div className="mt-3 ml-2">
                            <h3 className="font-medium text-white truncate drop-shadow-lg">{p.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-white drop-shadow-lg">{formatUSD(p.price)}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/90 text-gray-800">
                                {p.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons and Follow Button */}
          <div className="absolute top-5 right-3 flex flex-col items-center gap-2 transform -translate-y-4 md:translate-y-0" style={{ pointerEvents: 'auto' }}>
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Brand Navigation Button */}
            {prevBrand && (
              <Link 
                href={`/${prevBrand.id}`}
                className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label={`Go to ${prevBrand.name}`}
              >
                <svg 
                  className="w-6 h-6 text-white drop-shadow-lg group-hover:-translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </Link>
            )}
            
            {/* Next Brand Navigation Button */}
            {nextBrand && (
              <Link 
                href={`/${nextBrand.id}`}
                className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label={`Go to ${nextBrand.name}`}
              >
                <svg 
                  className="w-6 h-6 text-white drop-shadow-lg group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </Link>
            )}
          </div>
          
          {/* Follow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isFollowLoading && brand) {
                handleToggleFollow(e)
              }
            }}
            disabled={isFollowLoading || !brand}
            style={{ 
              pointerEvents: 'auto', 
              zIndex: 50, 
              position: 'relative',
              WebkitTapHighlightColor: 'transparent'
            }}
            className={`
              px-4 py-1.5 rounded-lg backdrop-blur-md border 
              transition-all duration-200 hover:scale-105 
              text-sm font-medium
              ${isFollowed
                ? 'bg-white/10 border-white/20 text-black hover:bg-white/20'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
              ${isFollowLoading || !brand 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer active:scale-95'
              }
            `}
          >
            {isFollowLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{isFollowed ? 'Unfollowing...' : 'Following...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
              </span>
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Main Content - reuse the same structure as BrandPageWithoutClerk */}
      {/* For brevity, we'll reuse BrandPageWithoutClerk's JSX structure */}
      {/* In a real implementation, you'd copy the full JSX here */}
      <div className="relative z-10" style={{ marginTop: '-5rem', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <BrandPageWithoutClerk params={params} hideHeader={true} />
        </div>
      </div>
    </div>
  )
}

// Outer component
export default function BrandPage(props: PageProps) {
  if (isClerkConfigured) {
    return (
      <ClerkErrorBoundary fallback={<BrandPageWithoutClerk {...props} />}>
      <BrandPageInner {...props} />
    </ClerkErrorBoundary>
  )
  }
  return <BrandPageWithoutClerk {...props} />
}


