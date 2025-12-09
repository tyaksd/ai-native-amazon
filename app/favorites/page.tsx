'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { getProductById, Product } from '@/lib/data'
import FavoriteButton from '@/app/components/FavoriteButton'

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
      console.warn('FavoritesPage: Clerk not available, using session_id only')
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

// Fallback version that doesn't use Clerk hooks
function FavoritesPageFallback() {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true)
        
        // Use session_id for non-logged-in users
        let sessionId = localStorage.getItem('session_id')
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('session_id', sessionId)
        }
        
        // Get favorite product IDs using session_id
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })

        if (favoritesError) {
          console.error('Error loading favorites:', favoritesError)
          setError('Failed to load favorites')
          return
        }

        if (!favorites || favorites.length === 0) {
          setFavoriteProducts([])
          return
        }

        // Get product details for each favorite
        const products = await Promise.all(
          favorites.map(async (favorite) => {
            try {
              const product = await getProductById(favorite.product_id)
              return product
            } catch (error) {
              console.error(`Error loading product ${favorite.product_id}:`, error)
              return null
            }
          })
        )

        // Filter out null products (products that might have been deleted)
        const validProducts = products.filter((product): product is Product => product !== null)
        setFavoriteProducts(validProducts)
      } catch (error) {
        console.error('Error loading favorites:', error)
        setError('Failed to load favorites')
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const handleFavoriteRemoved = (productId: string) => {
    setFavoriteProducts(prev => prev.filter(product => product.id !== productId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-10 bg-black min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-400 underline">Back to Home</Link>
      </div>
    )
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="px-6 py-10 text-center bg-black min-h-screen">
        <div className="text-gray-400 text-lg mb-4">No favorite products yet</div>
        <p className="text-gray-500 mb-6">Start exploring and add products to your favorites!</p>
        <Link 
          href="/brands" 
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-10 py-6 bg-black min-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">MY FAVORITES</h1>
        <p className="text-gray-400">{favoriteProducts.length} item(s) in your favorites</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-6">
        {favoriteProducts.map((product) => (
          <div key={product.id} className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Link href={`/product/${product.id}`} className="block">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-white flex items-center justify-center rounded-t-lg overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    width={200} 
                    height={200} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="text-gray-400">No image available</div>
                )}
              </div>
            </Link>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Link href={`/product/${product.id}`} className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors line-clamp-2 text-sm sm:text-base">
                    {product.name}
                  </h3>
                </Link>
                <FavoriteButton 
                  productId={product.id} 
                  className="ml-2 flex-shrink-0"
                  onFavoriteRemoved={() => handleFavoriteRemoved(product.id)}
                />
              </div>
              
              <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {formatUSD(product.price)}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                  {product.type}
                </span>
                <Link 
                  href={`/product/${product.id}`}
                  className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors w-fit"
                >
                  View Details →
                </Link>
              </div>
              
              {/* Choose Color & Size Button */}
              <Link
                href={`/product/${product.id}`}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium"
              >
                <span>Choose Color & Size</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main version that uses Clerk hooks
function FavoritesPageInner() {
  const { user, isLoaded } = useUser()
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFavorites = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return
      
      try {
        setLoading(true)
        
        // Get user ID: prefer Clerk ID if logged in, otherwise use session_id
        let userId: string
        const isLoggedIn = !!user?.id
        
        if (isLoggedIn && user.id) {
          // Use Clerk ID if logged in
          userId = user.id
        } else {
          // Fallback to session_id from localStorage for non-logged-in users (same as cart)
          let sessionId = localStorage.getItem('session_id')
          if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            localStorage.setItem('session_id', sessionId)
          }
          userId = sessionId
        }
        
        // Get favorite product IDs - use clerk_id if logged in, otherwise session_id
        const query = isLoggedIn
          ? supabase
              .from('favorites')
              .select('product_id')
              .eq('clerk_id', userId)
              .order('created_at', { ascending: false })
          : supabase
              .from('favorites')
              .select('product_id')
              .eq('session_id', userId)
              .order('created_at', { ascending: false })
        
        const { data: favorites, error: favoritesError } = await query

        if (favoritesError) {
          console.error('Error loading favorites:', favoritesError)
          setError('Failed to load favorites')
          return
        }

        if (!favorites || favorites.length === 0) {
          setFavoriteProducts([])
          return
        }

        // Get product details for each favorite
        const products = await Promise.all(
          favorites.map(async (favorite) => {
            try {
              const product = await getProductById(favorite.product_id)
              return product
            } catch (error) {
              console.error(`Error loading product ${favorite.product_id}:`, error)
              return null
            }
          })
        )

        // Filter out null products (products that might have been deleted)
        const validProducts = products.filter((product): product is Product => product !== null)
        setFavoriteProducts(validProducts)
      } catch (error) {
        console.error('Error loading favorites:', error)
        setError('Failed to load favorites')
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [user, isLoaded])

  const handleFavoriteRemoved = (productId: string) => {
    setFavoriteProducts(prev => prev.filter(product => product.id !== productId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-10 bg-black min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-400 underline">Back to Home</Link>
      </div>
    )
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="px-6 py-10 text-center bg-black min-h-screen">
        <div className="text-gray-400 text-lg mb-4">No favorite products yet</div>
        <p className="text-gray-500 mb-6">Start exploring and add products to your favorites!</p>
        <Link 
          href="/brands" 
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-10 py-6 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
        <p className="text-gray-400">{favoriteProducts.length} item(s) in your favorites</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-6">
        {favoriteProducts.map((product) => (
          <div key={product.id} className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Link href={`/product/${product.id}`} className="block">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-white flex items-center justify-center rounded-t-lg overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    width={200} 
                    height={200} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="text-gray-400">No image available</div>
                )}
              </div>
            </Link>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Link href={`/product/${product.id}`} className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors line-clamp-2 text-sm sm:text-base">
                    {product.name}
                  </h3>
                </Link>
                <FavoriteButton 
                  productId={product.id} 
                  className="ml-2 flex-shrink-0"
                  onFavoriteRemoved={() => handleFavoriteRemoved(product.id)}
                />
              </div>
              
              <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {formatUSD(product.price)}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                  {product.type}
                </span>
                <Link 
                  href={`/product/${product.id}`}
                  className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors w-fit"
                >
                  View Details →
                </Link>
              </div>
              
              {/* Choose Color & Size Button */}
              <Link
                href={`/product/${product.id}`}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium"
              >
                <span>Choose Color & Size</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Outer component that conditionally renders based on Clerk configuration
export default function FavoritesPage() {
  // If Clerk is not configured, use fallback component
  if (!isClerkConfigured) {
    return <FavoritesPageFallback />
  }

  // If Clerk is configured, use error boundary with fallback
  return (
    <ClerkErrorBoundary fallback={<FavoritesPageFallback />}>
      <FavoritesPageInner />
    </ClerkErrorBoundary>
  )
}
