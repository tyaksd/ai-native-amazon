import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      errorType,
      errorMessage,
      errorStack,
      pageUrl,
      userAgent,
      browserInfo
    } = body

    // Validate required fields
    if (!sessionId || !errorType || !errorMessage || !pageUrl) {
      return NextResponse.json({ error: 'Session ID, error type, error message, and page URL are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('error_logs')
      .insert({
        session_id: sessionId,
        error_type: errorType,
        error_message: errorMessage,
        error_stack: errorStack,
        page_url: pageUrl,
        user_agent: userAgent,
        browser_info: browserInfo
      })

    if (error) {
      console.error('Error logging error:', error)
      return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Error logged' })
  } catch (error) {
    console.error('Error logging API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
