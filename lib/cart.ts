'use client'

import { supabase } from './supabase'

export type CartItem = {
  id: string
  quantity: number
  size?: string | null
  color?: string | null
}

/**
 * Get the current user ID (Clerk ID if logged in, or session ID if not)
 */
export function getUserId(clerkId: string | null | undefined): string | null {
  if (clerkId) {
    return clerkId
  }
  
  // For non-logged-in users, use session ID from localStorage
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

/**
 * Load cart items from database
 */
export async function loadCartFromDB(clerkId: string | null | undefined): Promise<CartItem[]> {
  try {
    const userId = getUserId(clerkId)
    if (!userId) {
      console.log('loadCartFromDB: No userId available')
      return []
    }

    const isLoggedIn = !!clerkId
    console.log('loadCartFromDB:', { userId, isLoggedIn })
    
    const query = isLoggedIn
      ? supabase.from('cart_items').select('product_id, quantity, size, color').eq('clerk_id', userId)
      : supabase.from('cart_items').select('product_id, quantity, size, color').eq('session_id', userId)

    const { data, error } = await query

    if (error) {
      console.error('Error loading cart from DB:', error)
      return []
    }

    console.log('loadCartFromDB: Loaded items:', data?.length || 0)
    return (data || []).map(item => ({
      id: item.product_id,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    }))
  } catch (error) {
    console.error('Error loading cart from DB:', error)
    return []
  }
}

/**
 * Save cart item to database
 */
export async function saveCartItemToDB(
  clerkId: string | null | undefined,
  item: CartItem
): Promise<boolean> {
  try {
    const userId = getUserId(clerkId)
    if (!userId) {
      console.error('saveCartItemToDB: No userId available')
      return false
    }

    const isLoggedIn = !!clerkId
    console.log('saveCartItemToDB:', { userId, isLoggedIn, item })
    
    const cartData = {
      product_id: item.id,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
      ...(isLoggedIn ? { clerk_id: userId, session_id: null } : { session_id: userId, clerk_id: null }),
    }

    // Check if item already exists
    const existingQuery = isLoggedIn
      ? supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('clerk_id', userId)
          .eq('product_id', item.id)
          .eq('size', item.size || null)
          .eq('color', item.color || null)
          .maybeSingle()
      : supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('session_id', userId)
          .eq('product_id', item.id)
          .eq('size', item.size || null)
          .eq('color', item.color || null)
          .maybeSingle()

    const { data: existing, error: existingError } = await existingQuery

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('Error checking existing cart item:', existingError)
    }

    if (existing) {
      // Update existing item - add to existing quantity
      const newQuantity = existing.quantity + item.quantity
      console.log('saveCartItemToDB: Updating existing item', { existingId: existing.id, oldQuantity: existing.quantity, newQuantity })
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating cart item:', error)
        return false
      }
      console.log('saveCartItemToDB: Successfully updated')
    } else {
      // Insert new item
      console.log('saveCartItemToDB: Inserting new item', JSON.stringify(cartData, null, 2))
      
      // First, let's verify the table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('cart_items')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('Error accessing cart_items table:', testError)
        console.error('This might mean the table does not exist or RLS is blocking access')
        return false
      }
      
      const { data: insertData, error } = await supabase
        .from('cart_items')
        .insert(cartData)
        .select()

      if (error) {
        console.error('Error saving cart item:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('Cart data attempted:', JSON.stringify(cartData, null, 2))
        return false
      }
      
      if (!insertData || insertData.length === 0) {
        console.error('Insert succeeded but no data returned')
        return false
      }
      
      console.log('saveCartItemToDB: Successfully inserted', insertData)
    }

    return true
  } catch (error) {
    console.error('Error saving cart item to DB:', error)
    return false
  }
}

/**
 * Remove cart item from database
 */
export async function removeCartItemFromDB(
  clerkId: string | null | undefined,
  productId: string,
  size?: string | null,
  color?: string | null
): Promise<boolean> {
  try {
    const userId = getUserId(clerkId)
    if (!userId) return false

    const isLoggedIn = !!clerkId
    const query = isLoggedIn
      ? supabase
          .from('cart_items')
          .delete()
          .eq('clerk_id', userId)
          .eq('product_id', productId)
          .eq('size', size || null)
          .eq('color', color || null)
      : supabase
          .from('cart_items')
          .delete()
          .eq('session_id', userId)
          .eq('product_id', productId)
          .eq('size', size || null)
          .eq('color', color || null)

    const { error } = await query

    if (error) {
      console.error('Error removing cart item:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing cart item from DB:', error)
    return false
  }
}

/**
 * Clear all cart items from database
 */
export async function clearCartFromDB(clerkId: string | null | undefined): Promise<boolean> {
  try {
    const userId = getUserId(clerkId)
    if (!userId) return false

    const isLoggedIn = !!clerkId
    const query = isLoggedIn
      ? supabase.from('cart_items').delete().eq('clerk_id', userId)
      : supabase.from('cart_items').delete().eq('session_id', userId)

    const { error } = await query

    if (error) {
      console.error('Error clearing cart:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error clearing cart from DB:', error)
    return false
  }
}

/**
 * Migrate cart items from session_id to clerk_id when user logs in
 */
export async function migrateCartToLoggedInUser(
  sessionId: string,
  clerkId: string
): Promise<boolean> {
  try {
    // Get all cart items for the session
    const { data: sessionCartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)

    if (fetchError) {
      console.error('Error fetching session cart items:', fetchError)
      return false
    }

    if (!sessionCartItems || sessionCartItems.length === 0) {
      return true // No items to migrate
    }

    // For each session cart item, check if it already exists for the logged-in user
    for (const sessionItem of sessionCartItems) {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('clerk_id', clerkId)
        .eq('product_id', sessionItem.product_id)
        .eq('size', sessionItem.size || null)
        .eq('color', sessionItem.color || null)
        .maybeSingle()

      if (existingItem) {
        // Merge quantities
        const newQuantity = existingItem.quantity + sessionItem.quantity
        await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
      } else {
        // Move item to logged-in user
        await supabase
          .from('cart_items')
          .update({
            clerk_id: clerkId,
            session_id: null,
          })
          .eq('id', sessionItem.id)
      }
    }

    // Delete any remaining session items (they've been migrated)
    await supabase.from('cart_items').delete().eq('session_id', sessionId)

    return true
  } catch (error) {
    console.error('Error migrating cart to logged-in user:', error)
    return false
  }
}

