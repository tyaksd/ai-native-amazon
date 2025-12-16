'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { getBrandById, Brand } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'
import BrandFollowButton from '@/app/components/BrandFollowButton'

// Import BrandCard from brands page
function BrandCard({ brand, compact, getStyleDisplayName }: { brand: Brand; compact?: boolean; getStyleDisplayName?: (style: string | null | undefined) => string }) {
  // Regular layout for desktop (when compact is false or undefined)
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
        
        {/* Follow button - positioned at top right */}
        <div className="absolute top-4 right-4 z-10">
          <BrandFollowButton brandId={brand.id} />
        </div>
      </div>
    </Link>
  )
}

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
      console.warn('FollowedBrandsPage: Clerk not available, using session_id only')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Get user ID: prefer Clerk ID if logged in, otherwise use session_id
function getUserIdentifier(user: { id?: string } | null | undefined): string | null {
  // Use Clerk ID if logged in
  if (user?.id) {
    return user.id
  }
  // Use session_id for non-logged-in users
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

// Compact brand card component (same as in brands/page.tsx)
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
        
        {/* Follow button - positioned at top right */}
        <BrandFollowButton brandId={brand.id} />
        
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
        
        {/* Brand name and style button with glass design - positioned at bottom right */}
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
    </Link>
  )
}

// Style display name helper function (same as brands page)
function getStyleDisplayName(style: string | null | undefined): string {
  if (!style) return ''
  
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
  
  return styleDisplayNames[style] || style
}

// Fallback component that doesn't use Clerk hooks
// Can also be used by Inner component with authentication props
function FollowedBrandsPageFallback({ 
  user: providedUser,
  clerkId: providedClerkId
}: {
  user?: { id?: string } | null
  clerkId?: string | null
} = {}) {
  const [followedBrands, setFollowedBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = providedUser ?? null
  const clerkId = providedClerkId ?? null

  useEffect(() => {
    const loadFollowedBrands = async () => {
      try {
        setLoading(true)
        
        const currentUserId = getUserIdentifier(user)
        if (!currentUserId) {
          setFollowedBrands([])
          return
        }
        
        const isLoggedIn = !!(clerkId && user?.id)
        
        // Get followed brand IDs - use clerk_id if logged in, otherwise session_id
        const { data: follows, error: followsError } = await supabase
          .from('brand_follows')
          .select('brand_id')
          .eq(isLoggedIn ? 'clerk_id' : 'session_id', currentUserId)
          .order('created_at', { ascending: false })

        if (followsError) {
          console.error('Error loading followed brands:', followsError)
          setError('Failed to load followed brands')
          return
        }

        if (!follows || follows.length === 0) {
          setFollowedBrands([])
          return
        }

        // Get brand details for each followed brand
        const brands = await Promise.all(
          follows.map(async (follow) => {
            try {
              const brand = await getBrandById(follow.brand_id)
              return brand
            } catch (error) {
              console.error(`Error loading brand ${follow.brand_id}:`, error)
              return null
            }
          })
        )

        // Filter out null brands (brands that might have been deleted)
        const validBrands = brands.filter((brand): brand is Brand => brand !== null)
        setFollowedBrands(validBrands)
      } catch (error) {
        console.error('Error loading followed brands:', error)
        setError('Failed to load followed brands')
      } finally {
        setLoading(false)
      }
    }

    loadFollowedBrands()
  }, [user, clerkId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-[#151920]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-10 bg-[#151920] min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-400 underline">Back to Home</Link>
      </div>
    )
  }

  if (followedBrands.length === 0) {
    return (
      <div className="px-6 py-10 text-center bg-[#151920] min-h-screen">
        <div className="text-gray-400 text-lg mb-4">No followed brands yet</div>
        <p className="text-gray-500 mb-6">Start exploring and follow brands you love!</p>
        <Link 
          href="/brands" 
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Explore Brands
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-10 py-6 bg-[#151920] min-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">FOLLOWED BRANDS</h1>
        <p className="text-gray-400">{followedBrands.length} brand(s) you&apos;re following</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {followedBrands.map((brand) => (
          <div key={brand.id}>
            {/* Mobile: CompactBrandCard */}
            <div className="block sm:hidden">
              <CompactBrandCard 
                brand={brand} 
                getStyleDisplayName={getStyleDisplayName}
              />
            </div>
            {/* Tablet/Desktop: BrandCard */}
            <div className="hidden sm:block">
              <BrandCard 
                brand={brand} 
                getStyleDisplayName={getStyleDisplayName}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main component that uses Clerk hooks
function FollowedBrandsPageInner() {
  const { user, isLoaded } = useUser()

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-[#151920]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  // Reuse FollowedBrandsPageFallback for layout - only authentication logic differs
  return (
    <FollowedBrandsPageFallback 
      user={user}
      clerkId={user?.id || null}
    />
  )
}

// Outer component that conditionally renders based on Clerk configuration
export default function FollowedBrandsPage() {
  // If Clerk is not configured, use fallback component
  if (!isClerkConfigured) {
    return <FollowedBrandsPageFallback />
  }

  // If Clerk is configured, use error boundary with fallback
  return (
    <ClerkErrorBoundary fallback={<FollowedBrandsPageFallback />}>
      <FollowedBrandsPageInner />
    </ClerkErrorBoundary>
  )
}
