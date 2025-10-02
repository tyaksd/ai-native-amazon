'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProductById, Product } from '@/lib/data'
import FavoriteButton from '@/app/components/FavoriteButton'

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function FavoritesPage() {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdded, setShowAdded] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')

  // Get user ID (same logic as FavoriteButton)
  const getUserId = () => {
    let storedUserId = localStorage.getItem('user_id')
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('user_id', storedUserId)
    }
    return storedUserId
  }

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userId = getUserId()
        
        // Get favorite product IDs
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId)
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

  const addToCart = (product: Product) => {
    try {
      type CartItemLocal = { id: string; quantity: number; size?: string | null; color?: string | null };
      const cart: CartItemLocal[] = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if product already exists in cart
      const existingItem = cart.find((item) => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ 
          id: product.id, 
          quantity: 1,
          size: null,
          color: null,
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      setAddedMessage(`Added ${product.name} to cart`);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddedMessage('Failed to add to cart');
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    )
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <div className="text-gray-500 text-lg mb-4">No favorite products yet</div>
        <p className="text-gray-400 mb-6">Start exploring and add products to your favorites!</p>
        <Link 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-10 py-6">
      {/* Added to Cart Banner */}
      {showAdded && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {addedMessage}
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">{favoriteProducts.length} item(s) in your favorites</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                  {product.category}
                </span>
                <Link 
                  href={`/product/${product.id}`}
                  className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors w-fit"
                >
                  View Details →
                </Link>
              </div>
              
              {/* Add to Cart Button */}
              <button
                onClick={() => addToCart(product)}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 3.75a.75.75 0 000 1.5h1.862c.27 0 .505.181.574.442l2.14 8.023A2.25 2.25 0 008.996 15h7.258a2.25 2.25 0 002.17-1.607l1.6-5.6a.75.75 0 00-.72-.968H6.615l-.36-1.35A2.25 2.25 0 004.112 3.75H2.25z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9.75 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
