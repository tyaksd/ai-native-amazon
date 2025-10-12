import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      fromPage,
      toPage,
      navigationType,
      navigationMethod,
      timeBetweenPages
    } = body

    // Validate required fields
    if (!sessionId || !toPage) {
      return NextResponse.json({ error: 'Session ID and destination page are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('navigation_behavior')
      .insert({
        session_id: sessionId,
        from_page: fromPage,
        to_page: toPage,
        navigation_type: navigationType,
        navigation_method: navigationMethod,
        time_between_pages: timeBetweenPages
      })

    if (error) {
      console.error('Error logging navigation behavior:', error)
      return NextResponse.json({ error: 'Failed to log navigation behavior' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Navigation behavior logged' })
  } catch (error) {
    console.error('Navigation behavior API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
