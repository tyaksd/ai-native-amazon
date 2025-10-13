import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Fetching brands from Supabase...')
    
    // Get all brands from database
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .order('name')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log(`Found ${brands?.length || 0} brands`)
    return NextResponse.json({
      success: true,
      message: 'Brands fetched successfully',
      brands: brands || [],
      count: brands?.length || 0
    })

  } catch (error) {
    console.error('Brands API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
