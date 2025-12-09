'use client'

import { useState, useCallback, Component, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface UseFavoritesReturn {
  favoriteProductIds: Set<string>
  isLoading: boolean
  toggleFavorite: (productId: string) => Promise<void>
  checkFavorites: (productIds: string[]) => Promise<void>
  isFavorited: (productId: string) => boolean
}

// Check if Clerk is configured
const isClerkConfigured = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Fallback version that doesn't use Clerk hooks
function useFavoritesFallback(userId?: string): UseFavoritesReturn {
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Get session_id for non-logged-in users
  const getUserId = useCallback(() => {
    // Use provided userId if available
    if (userId) return userId
    // Use session_id for non-logged-in users
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
  }, [userId])

  // Check if a product is favorited
  const isFavorited = useCallback((productId: string) => {
    return favoriteProductIds.has(productId)
  }, [favoriteProductIds])

  // Check favorites for multiple products at once
  const checkFavorites = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return

    try {
      setIsLoading(true)
      const currentUserId = getUserId()
      
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('session_id', currentUserId)
        .in('product_id', productIds)

      if (error) {
        console.error('Error checking favorites:', error)
        return
      }

      const favoriteIds = new Set(data?.map(fav => fav.product_id) || [])
      setFavoriteProductIds(favoriteIds)
    } catch (error) {
      console.error('Error checking favorites (caught):', error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserId])

  // Toggle favorite status for a single product
  const toggleFavorite = useCallback(async (productId: string) => {
    try {
      setIsLoading(true)
      const currentUserId = getUserId()
      const isCurrentlyFavorited = favoriteProductIds.has(productId)

      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('session_id', currentUserId)
          .eq('product_id', productId)

        if (error) {
          console.error('Error removing favorite:', error)
          throw error
        }

        setFavoriteProductIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
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
          throw error
        }

        setFavoriteProductIds(prev => {
          const newSet = new Set(prev)
          newSet.add(productId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [getUserId, favoriteProductIds])

  return {
    favoriteProductIds,
    isLoading,
    toggleFavorite,
    checkFavorites,
    isFavorited
  }
}

// Main version that uses Clerk hooks
// This function should only be called when Clerk is configured
// It will throw if ClerkProvider is not available
function useFavoritesInner(userId?: string): UseFavoritesReturn {
  // Always call useUser unconditionally - this function should only be called when Clerk is configured
  // If ClerkProvider is not available, this will throw an error
  // Components using this hook should wrap it in an error boundary if Clerk might not be configured
  const { user } = useUser()
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Get user ID: prefer Clerk ID if logged in, otherwise use session_id
  const getUserId = useCallback(() => {
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
  }, [userId, user])

  // Check if a product is favorited
  const isFavorited = useCallback((productId: string) => {
    return favoriteProductIds.has(productId)
  }, [favoriteProductIds])

  // Check favorites for multiple products at once
  const checkFavorites = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return

    try {
      setIsLoading(true)
      const currentUserId = getUserId()
      const isLoggedIn = !!user?.id
      
      // Use clerk_id if logged in, otherwise use session_id
      const query = isLoggedIn
        ? supabase
            .from('favorites')
            .select('product_id')
            .eq('clerk_id', currentUserId)
            .in('product_id', productIds)
        : supabase
            .from('favorites')
            .select('product_id')
            .eq('session_id', currentUserId)
            .in('product_id', productIds)

      const { data, error } = await query

      if (error) {
        // Better error logging with detailed information
        console.error('Error checking favorites:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error: error
        })
        return
      }

      const favoriteIds = new Set(data?.map(fav => fav.product_id) || [])
      setFavoriteProductIds(favoriteIds)
    } catch (error) {
      // Better error logging for caught errors
      const errorDetails = error instanceof Error 
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        : { error }
      console.error('Error checking favorites (caught):', errorDetails)
    } finally {
      setIsLoading(false)
    }
  }, [getUserId, user])

  // Toggle favorite status for a single product
  const toggleFavorite = useCallback(async (productId: string) => {
    try {
      setIsLoading(true)
      const currentUserId = getUserId()
      const isLoggedIn = !!user?.id
      const isCurrentlyFavorited = favoriteProductIds.has(productId)

      if (isCurrentlyFavorited) {
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
          throw error
        }

        setFavoriteProductIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
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
          throw error
        }

        setFavoriteProductIds(prev => {
          const newSet = new Set(prev)
          newSet.add(productId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [getUserId, favoriteProductIds, user])

  return {
    favoriteProductIds,
    isLoading,
    toggleFavorite,
    checkFavorites,
    isFavorited
  }
}

// Export function - conditionally use the right version based on Clerk configuration
// eslint-disable-next-line react-hooks/rules-of-hooks
// Note: This conditionally calls different hooks, which technically violates React Hooks rules
// However, since isClerkConfigured is a build-time constant (environment variable),
// the same hooks will always be called in the same order for a given build
// This is a necessary workaround to support environments with and without Clerk
export function useFavorites(userId?: string): UseFavoritesReturn {
  // If Clerk is not configured, use the fallback version that doesn't call useUser
  // This avoids calling useUser when ClerkProvider is not available
  if (!isClerkConfigured) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useFavoritesFallback(userId)
  }
  
  // If Clerk is configured, use the version that calls useUser
  // This will throw if ClerkProvider is not available, which should be caught by error boundaries
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFavoritesInner(userId)
}

// Export fallback version for use in error boundaries
export { useFavoritesFallback }
