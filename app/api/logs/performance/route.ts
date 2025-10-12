import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      pageUrl,
      loadTime,
      domContentLoaded,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay,
      cumulativeLayoutShift,
      networkInfo
    } = body

    // Validate required fields
    if (!sessionId || !pageUrl) {
      return NextResponse.json({ error: 'Session ID and page URL are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        session_id: sessionId,
        page_url: pageUrl,
        load_time: loadTime,
        dom_content_loaded: domContentLoaded,
        first_contentful_paint: firstContentfulPaint,
        largest_contentful_paint: largestContentfulPaint,
        first_input_delay: firstInputDelay,
        cumulative_layout_shift: cumulativeLayoutShift,
        network_info: networkInfo
      })

    if (error) {
      console.error('Error logging performance metrics:', error)
      return NextResponse.json({ error: 'Failed to log performance metrics' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Performance metrics logged' })
  } catch (error) {
    console.error('Performance metrics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
