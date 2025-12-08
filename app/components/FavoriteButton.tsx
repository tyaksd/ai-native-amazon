'use client'

import { useState, useEffect, useCallback, Component, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface FavoriteButtonProps {
  productId: string
  userId?: string
  className?: string
  onFavoriteRemoved?: (productId: string) => void
  initialFavoriteState?: boolean
}

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Error boundary component to catch Clerk hook errors
class ClerkErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Only log if it's a Clerk-related error
    if (error.message?.includes('ClerkProvider') || error.message?.includes('useUser')) {
      console.warn('FavoriteButton: Clerk not available')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}

// Get user ID: prefer Clerk ID if logged in, otherwise use session_id
function getUserIdentifier(user: { id?: string } | null | undefined, userId?: string): string | null {
  // Use Clerk ID if logged in
  if (user?.id) {
    return user.id
  }
  // Use provided userId if available
  if (userId) return userId
  // Use session_id for non-logged-in users (same as cart)
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }
  // Fallback (should not happen in browser)
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Fallback component that doesn't use Clerk hooks
function FavoriteButtonFallback({ productId, userId, className = '', onFavoriteRemoved, initialFavoriteState }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavoriteState || false)
  const [isLoading, setIsLoading] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')

  // Check if product is favorited - only if initialFavoriteState is not provided
  useEffect(() => {
    if (initialFavoriteState !== undefined) {
      setIsFavorited(initialFavoriteState)
      return
    }

    const checkFavorite = async () => {
      try {
        const currentUserId = getUserIdentifier(null, userId)
        if (!currentUserId) return
        
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('session_id', currentUserId)
          .eq('product_id', productId)
          .maybeSingle()

        if (error) {
          console.error('Error checking favorite:', error)
          return
        }
        
        setIsFavorited(!!data)
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }

    checkFavorite()
  }, [productId, userId, initialFavoriteState])

  const toggleFavorite = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const currentUserId = getUserIdentifier(null, userId)
      if (!currentUserId) return

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('session_id', currentUserId)
          .eq('product_id', productId)

        if (error) {
          console.error('Error removing favorite:', error)
          setMessage('Failed to remove from favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        } else {
          setIsFavorited(false)
          setMessage('Removed from favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
          onFavoriteRemoved?.(productId)
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            session_id: currentUserId,
            product_id: productId
          })

        if (error) {
          console.error('Error adding favorite:', error)
          setMessage('Failed to add to favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        } else {
          setIsFavorited(true)
          setMessage('Added to favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setMessage('Something went wrong')
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${
          isFavorited
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLoading ? (
          <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-7 h-7"
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
      
      {/* Message Banner */}
      {showMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {message}
        </div>
      )}
    </>
  )
}

// Inner component that uses Clerk hooks
function FavoriteButtonInner({ productId, userId, className = '', onFavoriteRemoved, initialFavoriteState }: FavoriteButtonProps) {
  const { user } = useUser()
  const [isFavorited, setIsFavorited] = useState(initialFavoriteState || false)
  const [isLoading, setIsLoading] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')

  // Get user ID: prefer Clerk ID if logged in, otherwise use session_id
  const getUserId = useCallback(() => {
    return getUserIdentifier(user, userId) || ''
  }, [userId, user])

  // Check if product is favorited - only if initialFavoriteState is not provided
  useEffect(() => {
    if (initialFavoriteState !== undefined) {
      setIsFavorited(initialFavoriteState)
      return
    }

    const checkFavorite = async () => {
      try {
        const currentUserId = getUserId()
        const isLoggedIn = !!user?.id
        
        // Use clerk_id if logged in, otherwise use session_id
        const query = isLoggedIn
          ? supabase
              .from('favorites')
              .select('id')
              .eq('clerk_id', currentUserId)
              .eq('product_id', productId)
              .maybeSingle()
          : supabase
              .from('favorites')
              .select('id')
              .eq('session_id', currentUserId)
              .eq('product_id', productId)
              .maybeSingle()

        const { data, error } = await query

        if (error) {
          console.error('Error checking favorite:', error)
          return
        }
        
        setIsFavorited(!!data)
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }

    checkFavorite()
  }, [productId, getUserId, initialFavoriteState, user])

  const toggleFavorite = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const currentUserId = getUserId()
      const isLoggedIn = !!user?.id

      if (isFavorited) {
        // Remove from favorites
        const deleteQuery = isLoggedIn
          ? supabase
              .from('favorites')
              .delete()
              .eq('clerk_id', currentUserId)
              .eq('product_id', productId)
          : supabase
              .from('favorites')
              .delete()
              .eq('session_id', currentUserId)
              .eq('product_id', productId)

        const { error } = await deleteQuery

        if (error) {
          console.error('Error removing favorite:', error)
          setMessage('Failed to remove from favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        } else {
          setIsFavorited(false)
          setMessage('Removed from favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
          onFavoriteRemoved?.(productId)
        }
      } else {
        // Add to favorites
        // For logged-in users, use clerk_id; for non-logged-in users, use session_id
        const insertData = isLoggedIn
          ? {
              clerk_id: currentUserId,
              product_id: productId
            }
          : {
              session_id: currentUserId,
              product_id: productId
            }
        
        console.log('Adding favorite:', { insertData, isLoggedIn, currentUserId, user: user?.id })

        const { error } = await supabase
          .from('favorites')
          .insert(insertData)

        if (error) {
          console.error('Error adding favorite:', error)
          setMessage('Failed to add to favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        } else {
          setIsFavorited(true)
          setMessage('Added to favorites')
          setShowMessage(true)
          setTimeout(() => setShowMessage(false), 2000)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setMessage('Something went wrong')
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${
          isFavorited
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLoading ? (
          <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-7 h-7"
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
      
      {/* Message Banner */}
      {showMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {message}
        </div>
      )}
    </>
  )
}

// Outer component that conditionally renders based on Clerk configuration
export default function FavoriteButton(props: FavoriteButtonProps) {
  // If Clerk is not configured, use fallback component
  if (!isClerkConfigured) {
    return <FavoriteButtonFallback {...props} />
  }

  // If Clerk is configured, use error boundary with fallback
  return (
    <ClerkErrorBoundary fallback={<FavoriteButtonFallback {...props} />}>
      <FavoriteButtonInner {...props} />
    </ClerkErrorBoundary>
  )
}
