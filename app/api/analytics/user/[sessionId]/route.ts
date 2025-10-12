import { NextRequest, NextResponse } from 'next/server'
import { userTracker } from '@/lib/user-tracking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get user profile
    const userProfile = await userTracker.getUserProfile(sessionId)
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get user journey
    const userJourney = await userTracker.getUserJourney(sessionId)
    
    // Get behavior patterns
    const behaviorPatterns = await userTracker.getUserBehaviorPatterns(sessionId)
    
    // Get similar users
    const similarUsers = await userTracker.getSimilarUsers(sessionId, 5)
    
    // Get recommendations
    const recommendations = await userTracker.getUserRecommendations(sessionId)

    return NextResponse.json({
      success: true,
      sessionId,
      userProfile,
      userJourney,
      behaviorPatterns,
      similarUsers,
      recommendations
    })
  } catch (error) {
    console.error('User analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
