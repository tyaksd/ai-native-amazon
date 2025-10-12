import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .rpc('get_user_journey_analysis', {
        session_id_param: sessionId
      })

    if (error) {
      console.error('Error getting user journey:', error)
      return NextResponse.json({ error: 'Failed to get user journey' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      sessionId,
      journey: data
    })
  } catch (error) {
    console.error('User journey API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
