import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Fetching products from Supabase...')
    
    // Get all products from database
    const { data: products, error } = await supabaseAdmin
      .from('products')
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

    console.log(`Found ${products?.length || 0} products`)
    return NextResponse.json({
      success: true,
      message: 'Products fetched successfully',
      products: products || [],
      count: products?.length || 0
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
