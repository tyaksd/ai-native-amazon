'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseFavoritesReturn {
  favoriteProductIds: Set<string>
  isLoading: boolean
  toggleFavorite: (productId: string) => Promise<void>
  checkFavorites: (productIds: string[]) => Promise<void>
  isFavorited: (productId: string) => boolean
}

export function useFavorites(userId?: string): UseFavoritesReturn {
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Get a simple user ID (for demo purposes, we'll use localStorage)
  const getUserId = useCallback(() => {
    if (userId) return userId
    let storedUserId = localStorage.getItem('user_id')
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('user_id', storedUserId)
    }
    return storedUserId
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
        .eq('user_id', currentUserId)
        .in('product_id', productIds)

      if (error) {
        console.error('Error checking favorites:', error)
        return
      }

      const favoriteIds = new Set(data?.map(fav => fav.product_id) || [])
      setFavoriteProductIds(favoriteIds)
    } catch (error) {
      console.error('Error checking favorites:', error)
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
          .eq('user_id', currentUserId)
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
            user_id: currentUserId,
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
