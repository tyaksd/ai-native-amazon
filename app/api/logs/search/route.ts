import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      searchQuery,
      searchType,
      filtersApplied,
      resultsCount,
      clickedResultId,
      clickedResultType,
      searchDuration
    } = body

    // Validate required fields
    if (!sessionId || !searchQuery) {
      return NextResponse.json({ error: 'Session ID and search query are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('search_behavior')
      .insert({
        session_id: sessionId,
        search_query: searchQuery,
        search_type: searchType,
        filters_applied: filtersApplied,
        results_count: resultsCount,
        clicked_result_id: clickedResultId,
        clicked_result_type: clickedResultType,
        search_duration: searchDuration
      })

    if (error) {
      console.error('Error logging search behavior:', error)
      return NextResponse.json({ error: 'Failed to log search behavior' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Search behavior logged' })
  } catch (error) {
    console.error('Search behavior API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
