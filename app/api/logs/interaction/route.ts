import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      interactionType,
      elementType,
      elementId,
      elementClass,
      elementText,
      elementHref,
      pageUrl,
      xPosition,
      yPosition
    } = body

    // Validate required fields
    if (!sessionId || !interactionType || !pageUrl) {
      return NextResponse.json({ error: 'Session ID, interaction type, and page URL are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_interactions')
      .insert({
        session_id: sessionId,
        interaction_type: interactionType,
        element_type: elementType,
        element_id: elementId,
        element_class: elementClass,
        element_text: elementText,
        element_href: elementHref,
        page_url: pageUrl,
        x_position: xPosition,
        y_position: yPosition
      })

    if (error) {
      console.error('Error logging interaction:', error)
      return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Interaction logged' })
  } catch (error) {
    console.error('Interaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
