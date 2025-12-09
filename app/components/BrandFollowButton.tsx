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
// Can also be used by Inner component with authentication props
function BrandFollowButtonFallback({ 
  brandId, 
  className = '', 
  initialFollowState,
  user: providedUser,
  clerkId: providedClerkId
}: BrandFollowButtonProps & {
  user?: { id?: string } | null
  clerkId?: string | null
}) {
  const [isFollowed, setIsFollowed] = useState(initialFollowState || false)
  const [isLoading, setIsLoading] = useState(false)
  const user = providedUser ?? null
  const clerkId = providedClerkId ?? null

  // Check if brand is followed
  useEffect(() => {
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

        const isLoggedIn = !!(clerkId && user?.id)
        
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
  }, [brandId, initialFollowState, user, clerkId])

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return

    const currentUserId = getUserId(user)
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const isLoggedIn = !!(clerkId && user?.id)

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

  // Wait for Clerk to load
  if (!isLoaded) {
    return null
  }

  // Reuse BrandFollowButtonFallback for layout - only authentication logic differs
  return (
    <BrandFollowButtonFallback 
      brandId={brandId}
      className={className}
      initialFollowState={initialFollowState}
      user={user}
      clerkId={user?.id || null}
    />
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

