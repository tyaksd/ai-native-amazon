import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()

    const { data, error } = await supabase
      .rpc('get_analytics_summary', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.error('Error getting analytics summary:', error)
      return NextResponse.json({ error: 'Failed to get analytics summary' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0],
      period: { start_date: startDate, end_date: endDate }
    })
  } catch (error) {
    console.error('Analytics summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
