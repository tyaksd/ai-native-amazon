import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1)

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Table access error',
        details: {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details,
          hint: tableError.hint
        }
      }, { status: 500 })
    }

    // Test 2: Try to insert a test item
    const testItem = {
      clerk_id: 'test_user_123',
      session_id: null,
      product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      quantity: 1,
      size: null,
      color: null
    }

    const { data: insertData, error: insertError } = await supabase
      .from('cart_items')
      .insert(testItem)
      .select()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert error',
        details: {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        },
        testItem
      }, { status: 500 })
    }

    // Test 3: Try to read it back
    const { data: readData, error: readError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('clerk_id', 'test_user_123')

    if (readError) {
      return NextResponse.json({
        success: false,
        error: 'Read error',
        details: {
          message: readError.message,
          code: readError.code
        }
      }, { status: 500 })
    }

    // Clean up test data
    await supabase
      .from('cart_items')
      .delete()
      .eq('clerk_id', 'test_user_123')

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      tableCheck: tableCheck ? 'Table accessible' : 'No data in table',
      insertData,
      readData
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

