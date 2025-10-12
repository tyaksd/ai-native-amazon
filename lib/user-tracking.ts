// Enhanced user tracking system
// This module provides advanced user behavior analysis and tracking

import { supabase } from './supabase-admin'

interface UserProfile {
  sessionId: string
  userId?: string
  deviceFingerprint: string
  firstVisit: Date
  lastVisit: Date
  totalSessions: number
  totalPageViews: number
  totalTimeSpent: number
  preferredCategories: string[]
  preferredBrands: string[]
  searchHistory: string[]
  purchaseHistory: string[]
  [key: string]: unknown
}

interface UserJourney {
  sessionId: string
  steps: {
    step: number
    page: string
    timestamp: Date
    action: string
    duration: number
  }[]
  totalDuration: number
  conversionGoal?: string
  completed: boolean
}

class UserTracker {
  private static instance: UserTracker
  private userProfiles: Map<string, UserProfile> = new Map()

  static getInstance(): UserTracker {
    if (!UserTracker.instance) {
      UserTracker.instance = new UserTracker()
    }
    return UserTracker.instance
  }

  // Generate device fingerprint for user identification
  private generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side'

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('Device fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')

    return btoa(fingerprint).substring(0, 32)
  }

  // Get or create user profile
  async getUserProfile(sessionId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          page_views(*),
          user_interactions(*),
          product_interactions(*),
          search_behavior(*)
        `)
        .eq('session_id', sessionId)
        .single()

      if (error || !data) return null

      // Calculate user metrics
      const totalPageViews = data.page_views?.length || 0
      const totalTimeSpent = data.page_views?.reduce((sum: number, pv: Record<string, unknown>) => sum + (Number(pv.time_on_page) || 0), 0) || 0
      
      // Extract preferences
      const preferredCategories = this.extractCategories(data.product_interactions || [])
      const preferredBrands = this.extractBrands(data.product_interactions || [])
      const searchHistory = this.extractSearchHistory(data.search_behavior || [])

      return {
        sessionId,
        deviceFingerprint: this.generateDeviceFingerprint(),
        firstVisit: new Date(data.created_at),
        lastVisit: new Date(data.last_activity),
        totalSessions: 1,
        totalPageViews,
        totalTimeSpent,
        preferredCategories,
        preferredBrands,
        searchHistory,
        purchaseHistory: []
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Get user journey for a specific session
  async getUserJourney(sessionId: string): Promise<UserJourney | null> {
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select(`
          *,
          user_interactions(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error || !data) return null

      const steps = data.map((pv, index) => ({
        step: index + 1,
        page: pv.page_path,
        timestamp: new Date(pv.created_at),
        action: 'page_view',
        duration: pv.time_on_page || 0
      }))

      const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0)

      return {
        sessionId,
        steps,
        totalDuration,
        completed: steps.length > 0
      }
    } catch (error) {
      console.error('Error getting user journey:', error)
      return null
    }
  }

  // Get user behavior patterns
  async getUserBehaviorPatterns(sessionId: string): Promise<{
    browsingPattern: 'explorer' | 'focused' | 'casual'
    engagementLevel: 'high' | 'medium' | 'low'
    preferredTimeOfDay: string
    deviceType: string
    interests: string[]
  }> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          page_views(*),
          user_interactions(*),
          product_interactions(*)
        `)
        .eq('session_id', sessionId)
        .single()

      if (error || !data) return this.getDefaultPatterns()

      const pageViews = data.page_views || []
      const productInteractions = data.product_interactions || []

      // Analyze browsing pattern
      const uniquePages = new Set(pageViews.map((pv: Record<string, unknown>) => pv.page_path)).size
      const totalPages = pageViews.length
      const browsingPattern = uniquePages / totalPages > 0.7 ? 'explorer' : 
                             uniquePages / totalPages > 0.4 ? 'focused' : 'casual'

      // Analyze engagement level
      const avgTimeOnPage = pageViews.reduce((sum: number, pv: Record<string, unknown>) => sum + (Number(pv.time_on_page) || 0), 0) / pageViews.length
      const engagementLevel = avgTimeOnPage > 60 ? 'high' : 
                             avgTimeOnPage > 30 ? 'medium' : 'low'

      // Analyze preferred time of day
      const hour = new Date(data.created_at).getHours()
      const preferredTimeOfDay = hour < 6 ? 'night' : 
                                 hour < 12 ? 'morning' : 
                                 hour < 18 ? 'afternoon' : 'evening'

      // Extract interests from product interactions
      const interests = this.extractInterests(productInteractions)

      return {
        browsingPattern,
        engagementLevel,
        preferredTimeOfDay,
        deviceType: data.device_type || 'unknown',
        interests
      }
    } catch (error) {
      console.error('Error analyzing user behavior:', error)
      return this.getDefaultPatterns()
    }
  }

  // Get similar users based on behavior
  async getSimilarUsers(sessionId: string, limit: number = 10): Promise<string[]> {
    try {
      const currentUser = await this.getUserProfile(sessionId)
      if (!currentUser) return []

      const { data, error } = await supabase
        .from('user_sessions')
        .select('session_id, device_type, browser, os')
        .neq('session_id', sessionId)
        .limit(1000) // Get a large sample for comparison

      if (error || !data) return []

      // Simple similarity scoring based on device and browser
      const similarUsers = data
        .map(user => ({
          sessionId: user.session_id,
          similarity: this.calculateSimilarity(currentUser, user)
        }))
        .filter(user => user.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(user => user.sessionId)

      return similarUsers
    } catch (error) {
      console.error('Error finding similar users:', error)
      return []
    }
  }

  // Get user recommendations based on behavior
  async getUserRecommendations(sessionId: string): Promise<{
    recommendedProducts: string[]
    recommendedCategories: string[]
    recommendedBrands: string[]
  }> {
    try {
      const userProfile = await this.getUserProfile(sessionId)
      if (!userProfile) return this.getDefaultRecommendations()

      // Get products from preferred categories
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, category, brand_id')
        .in('category', userProfile.preferredCategories)
        .limit(10)

      if (productError) return this.getDefaultRecommendations()

      return {
        recommendedProducts: products?.map(p => p.id) || [],
        recommendedCategories: userProfile.preferredCategories,
        recommendedBrands: userProfile.preferredBrands
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return this.getDefaultRecommendations()
    }
  }

  // Helper methods
  private extractCategories(productInteractions: Record<string, unknown>[]): string[] {
    const categories = productInteractions
      .map(pi => pi.product_category)
      .filter(Boolean)
      .map(cat => String(cat))
    
    return [...new Set(categories)]
  }

  private extractBrands(productInteractions: Record<string, unknown>[]): string[] {
    const brands = productInteractions
      .map(pi => pi.brand_id)
      .filter(Boolean)
      .map(brand => String(brand))
    
    return [...new Set(brands)]
  }

  private extractSearchHistory(searchBehavior: Record<string, unknown>[]): string[] {
    return searchBehavior
      .map(sb => sb.search_query)
      .filter(Boolean)
      .map(query => String(query))
  }

  private extractInterests(productInteractions: Record<string, unknown>[]): string[] {
    const interests = productInteractions
      .map(pi => pi.product_type)
      .filter(Boolean)
      .map(interest => String(interest))
    
    return [...new Set(interests)]
  }

  private calculateSimilarity(user1: Record<string, unknown>, user2: Record<string, unknown>): number {
    let score = 0
    
    if (user1.deviceType === user2.device_type) score += 0.3
    if (user1.browser === user2.browser) score += 0.3
    if (user1.os === user2.os) score += 0.2
    
    // Add more sophisticated similarity calculations here
    
    return score
  }

  private getDefaultPatterns() {
    return {
      browsingPattern: 'casual' as const,
      engagementLevel: 'medium' as const,
      preferredTimeOfDay: 'afternoon',
      deviceType: 'unknown',
      interests: []
    }
  }

  private getDefaultRecommendations() {
    return {
      recommendedProducts: [],
      recommendedCategories: [],
      recommendedBrands: []
    }
  }
}

export const userTracker = UserTracker.getInstance()
export type { UserProfile, UserJourney }
