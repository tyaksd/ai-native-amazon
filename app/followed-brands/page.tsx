'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getBrandById, Brand } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'
import BrandFollowButton from '@/app/components/BrandFollowButton'

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

// Style display name helper function
function getStyleDisplayName(style: string | null | undefined): string {
  if (!style) return ''
  
  const styleMap: Record<string, string> = {
    'streetwear': 'Streetwear',
    'casual': 'Casual',
    'mode': 'Mode',
    'luxury': 'Luxury',
    'sports': 'Sports',
    'traditional': 'Traditional',
    'feminine': 'Feminine',
    'workwear': 'Workwear',
    'sustainable': 'Sustainable',
    'culture': 'Culture',
    'anime': 'Anime',
  }
  
  return styleMap[style.toLowerCase()] || style
}

export default function FollowedBrandsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [followedBrands, setFollowedBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFollowedBrands = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return
      
      // Redirect to home if not logged in
      if (!user?.id) {
        router.push('/')
        return
      }
      
      try {
        setLoading(true)
        
        // Get followed brand IDs for logged-in user
        const { data: follows, error: followsError } = await supabase
          .from('brand_follows')
          .select('brand_id')
          .eq('clerk_id', user.id)
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
  }, [user, isLoaded, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user?.id) {
    return null // Will redirect
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
      <div className="px-6 py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    )
  }

  if (followedBrands.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <div className="text-gray-500 text-lg mb-4">No followed brands yet</div>
        <p className="text-gray-400 mb-6">Start exploring and follow brands you love!</p>
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
    <div className="px-3 sm:px-10 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Followed Brands</h1>
        <p className="text-gray-600">{followedBrands.length} brand(s) you're following</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
        {followedBrands.map((brand) => (
          <CompactBrandCard 
            key={brand.id} 
            brand={brand} 
            getStyleDisplayName={getStyleDisplayName}
          />
        ))}
      </div>
    </div>
  )
}

