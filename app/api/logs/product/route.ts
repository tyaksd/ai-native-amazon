import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      productId,
      brandId,
      interactionType,
      productName,
      productPrice,
      productCategory,
      productType,
      positionInList,
      timeOnProduct
    } = body

    // Validate required fields
    if (!sessionId || !productId || !interactionType) {
      return NextResponse.json({ error: 'Session ID, product ID, and interaction type are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('product_interactions')
      .insert({
        session_id: sessionId,
        product_id: productId,
        brand_id: brandId,
        interaction_type: interactionType,
        product_name: productName,
        product_price: productPrice,
        product_category: productCategory,
        product_type: productType,
        position_in_list: positionInList,
        time_on_product: timeOnProduct
      })

    if (error) {
      console.error('Error logging product interaction:', error)
      return NextResponse.json({ error: 'Failed to log product interaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Product interaction logged' })
  } catch (error) {
    console.error('Product interaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
