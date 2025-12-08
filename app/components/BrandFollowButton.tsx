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

// Inner component that uses Clerk hooks
function BrandFollowButtonInner({ brandId, className = '', initialFollowState }: BrandFollowButtonProps) {
  const { user, isLoaded } = useUser()
  const [isFollowed, setIsFollowed] = useState(initialFollowState || false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if brand is followed - only if initialFollowState is not provided
  useEffect(() => {
    if (!isLoaded) return
    
    // Only check for logged-in users
    if (!user?.id) {
      setIsFollowed(false)
      return
    }

    if (initialFollowState !== undefined) {
      setIsFollowed(initialFollowState)
      return
    }

    const checkFollow = async () => {
      try {
        const { data, error } = await supabase
          .from('brand_follows')
          .select('id')
          .eq('clerk_id', user.id)
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
  }, [brandId, user?.id, initialFollowState, isLoaded])

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading || !user?.id) return

    setIsLoading(true)
    try {
      if (isFollowed) {
        // Unfollow brand
        const { error } = await supabase
          .from('brand_follows')
          .delete()
          .eq('clerk_id', user.id)
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
            clerk_id: user.id,
            brand_id: brandId
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

  // Don't show button if user is not logged in
  if (!isLoaded || !user?.id) {
    return null
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`absolute top-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg transition-all duration-200 hover:bg-white hover:scale-110 ${
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
  // If Clerk is not configured, don't render the button
  if (!isClerkConfigured) {
    return null
  }

  // Use error boundary to handle cases where ClerkProvider might not be present
  return (
    <ClerkErrorBoundary>
      <BrandFollowButtonInner {...props} />
    </ClerkErrorBoundary>
  )
}

