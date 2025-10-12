import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      userAgent,
      ipAddress,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      deviceType,
      browser,
      os,
      screenResolution,
      language,
      timezone
    } = body

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (existingSession) {
      // Update last activity
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error updating session:', error)
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Session updated' })
    }

    // Create new session
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        device_type: deviceType,
        browser: browser,
        os: os,
        screen_resolution: screenResolution,
        language: language,
        timezone: timezone
      })

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Session created' })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
