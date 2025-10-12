import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()

    const { data, error } = await supabase
      .rpc('get_product_performance_analysis', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.error('Error getting product performance:', error)
      return NextResponse.json({ error: 'Failed to get product performance' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      period: { start_date: startDate, end_date: endDate }
    })
  } catch (error) {
    console.error('Product performance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
