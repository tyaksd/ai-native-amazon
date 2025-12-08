'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface BrandFollowButtonProps {
  brandId: string
  className?: string
  initialFollowState?: boolean
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
      console.warn('BrandFollowButton: Clerk not available')
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
function getUserId(user: { id?: string } | null | undefined): string | null {
  // Use Clerk ID if logged in
  if (user?.id) {
    return user.id
  }
  // Use session_id for non-logged-in users (same as cart and favorites)
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

// Fallback component that doesn't use Clerk hooks (for non-ClerkProvider environments)
function BrandFollowButtonFallback({ brandId, className = '', initialFollowState }: BrandFollowButtonProps) {
  const [isFollowed, setIsFollowed] = useState(initialFollowState || false)
  const [isLoading, setIsLoading] = useState(false)

  // Get session_id for non-logged-in users
  const getSessionId = (): string | null => {
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
    if (initialFollowState !== undefined) {
      setIsFollowed(initialFollowState)
      return
    }

    const checkFollow = async () => {
      try {
        const sessionId = getSessionId()
        if (!sessionId) {
          setIsFollowed(false)
          return
        }
        
        const { data, error } = await supabase
          .from('brand_follows')
          .select('id')
          .eq('session_id', sessionId)
          .eq('brand_id', brandId)
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

    checkFollow()
  }, [brandId, initialFollowState])

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return

    const sessionId = getSessionId()
    if (!sessionId) return

    setIsLoading(true)
    try {
      if (isFollowed) {
        // Unfollow brand
        const { error } = await supabase
          .from('brand_follows')
          .delete()
          .eq('session_id', sessionId)
          .eq('brand_id', brandId)

        if (error) {
          console.error('Error unfollowing brand:', error)
        } else {
          setIsFollowed(false)
        }
      } else {
        // Follow brand
        const { error } = await supabase
          .from('brand_follows')
          .insert({
            session_id: sessionId,
            brand_id: brandId,
            clerk_id: null
          })

        if (error) {
          console.error('Error following brand:', error)
        } else {
          setIsFollowed(true)
        }
      }
    } catch (error) {
      console.error('Error toggling brand follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`absolute top-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 hover:bg-white/20 hover:scale-110 ${
        isFollowed
          ? 'text-black'
          : 'text-white'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title={isFollowed ? 'Unfollow brand' : 'Follow brand'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </button>
  )
}

// Inner component that uses Clerk hooks
function BrandFollowButtonInner({ brandId, className = '', initialFollowState }: BrandFollowButtonProps) {
  const { user, isLoaded } = useUser()

  const [isFollowed, setIsFollowed] = useState(initialFollowState || false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if brand is followed - only if initialFollowState is not provided
  useEffect(() => {
    if (!isLoaded) return

    if (initialFollowState !== undefined) {
      setIsFollowed(initialFollowState)
      return
    }

    const checkFollow = async () => {
      try {
        const currentUserId = getUserId(user)
        if (!currentUserId) {
          setIsFollowed(false)
          return
        }

        const isLoggedIn = !!user?.id
        
        const { data, error } = await supabase
          .from('brand_follows')
          .select('id')
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brandId)
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

    checkFollow()
  }, [brandId, user?.id, initialFollowState, isLoaded, user])

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return

    const currentUserId = getUserId(user)
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const isLoggedIn = !!user?.id

      if (isFollowed) {
        // Unfollow brand
        const { error } = await supabase
          .from('brand_follows')
          .delete()
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .eq('brand_id', brandId)

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
              brand_id: brandId,
              session_id: null
            }
          : {
              session_id: currentUserId,
              brand_id: brandId,
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
      setIsLoading(false)
    }
  }

  // Show button for both logged-in and non-logged-in users
  if (!isLoaded) {
    return null
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`absolute top-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 hover:bg-white/20 hover:scale-110 ${
        isFollowed
          ? 'text-black'
          : 'text-white'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title={isFollowed ? 'Unfollow brand' : 'Follow brand'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          {/* Plus icon (cross) - always shown */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </button>
  )
}

// Outer component that conditionally renders based on Clerk configuration
export default function BrandFollowButton(props: BrandFollowButtonProps) {
  // If Clerk is not configured, use fallback component
  if (!isClerkConfigured) {
    return <BrandFollowButtonFallback {...props} />
  }

  // If Clerk is configured, use error boundary with fallback
  return (
    <ClerkErrorBoundary fallback={<BrandFollowButtonFallback {...props} />}>
      <BrandFollowButtonInner {...props} />
    </ClerkErrorBoundary>
  )
}

