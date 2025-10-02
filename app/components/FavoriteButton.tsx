'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FavoriteButtonProps {
  productId: string
  userId?: string
  className?: string
  onFavoriteRemoved?: (productId: string) => void
}

export default function FavoriteButton({ productId, userId, className = '', onFavoriteRemoved }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')

  // Get a simple user ID (for demo purposes, we'll use localStorage)
  const getUserId = () => {
    if (userId) return userId
    let storedUserId = localStorage.getItem('user_id')
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('user_id', storedUserId)
    }
    return storedUserId
  }

  // Check if product is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const currentUserId = getUserId()
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('product_id', productId)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking favorite:', error)
        } else {
          setIsFavorited(!!data)
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }

    checkFavorite()
  }, [productId])

  const toggleFavorite = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const currentUserId = getUserId()

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUserId)
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
            user_id: currentUserId,
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
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5"
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
