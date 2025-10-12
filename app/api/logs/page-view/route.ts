import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      pageUrl,
      pageTitle,
      pagePath,
      referrer,
      viewportWidth,
      viewportHeight,
      scrollDepth,
      timeOnPage
    } = body

    // Validate required fields
    if (!sessionId || !pageUrl || !pagePath) {
      return NextResponse.json({ error: 'Session ID, page URL, and page path are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('page_views')
      .insert({
        session_id: sessionId,
        page_url: pageUrl,
        page_title: pageTitle,
        page_path: pagePath,
        referrer: referrer,
        viewport_width: viewportWidth,
        viewport_height: viewportHeight,
        scroll_depth: scrollDepth,
        time_on_page: timeOnPage
      })

    if (error) {
      console.error('Error logging page view:', error)
      return NextResponse.json({ error: 'Failed to log page view' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Page view logged' })
  } catch (error) {
    console.error('Page view API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
