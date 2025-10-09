// Test Supabase Connection
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Test variant mappings table
    const { data: mappings, error: mappingsError } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('*')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      products: data,
      variantMappingsTable: mappingsError ? {
        exists: false,
        error: mappingsError.message
      } : {
        exists: true,
        count: mappings?.length || 0
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
