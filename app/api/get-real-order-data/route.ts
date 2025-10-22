import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderItemId = searchParams.get('orderItemId')

    if (!orderItemId) {
      return NextResponse.json({ error: 'orderItemId is required' }, { status: 400 })
    }

    console.log(`🔍 Getting real order data for: ${orderItemId}`)

    // Get real order item data
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        product_name,
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        printful_shipment_id,
        printful_item_id,
        printful_variant_id,
        printful_product_id,
        size,
        color,
        quantity,
        unit_price,
        orders(
          id,
          customer_email,
          currency,
          total_amount,
          created_at
        )
      `)
      .eq('id', orderItemId)
      .single()

    if (orderItemError || !orderItem) {
      console.error('❌ Error fetching order item:', orderItemError)
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    console.log('📦 Real order item data:', {
      id: orderItem.id,
      productName: orderItem.product_name,
      currentStatus: orderItem.printful_status,
      currentFulfillment: orderItem.printful_fulfillment_status,
      currentTracking: orderItem.printful_tracking_number,
      currentShipmentId: orderItem.printful_shipment_id,
      printfulItemId: orderItem.printful_item_id,
      printfulVariantId: orderItem.printful_variant_id,
      printfulProductId: orderItem.printful_product_id,
      customerEmail: orderItem.orders?.[0]?.customer_email,
      orderCreated: orderItem.orders?.[0]?.created_at
    })

    return NextResponse.json({
      success: true,
      orderItem: {
        id: orderItem.id,
        productName: orderItem.product_name,
        currentStatus: orderItem.printful_status,
        currentFulfillment: orderItem.printful_fulfillment_status,
        currentTracking: orderItem.printful_tracking_number,
        currentShipmentId: orderItem.printful_shipment_id,
        printfulItemId: orderItem.printful_item_id,
        printfulVariantId: orderItem.printful_variant_id,
        printfulProductId: orderItem.printful_product_id,
        size: orderItem.size,
        color: orderItem.color,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unit_price,
        customerEmail: orderItem.orders?.[0]?.customer_email,
        currency: orderItem.orders?.[0]?.currency,
        totalAmount: orderItem.orders?.[0]?.total_amount,
        orderCreated: orderItem.orders?.[0]?.created_at
      }
    })

  } catch (error) {
    console.error('❌ Error getting real order data:', error)
    return NextResponse.json({ 
      error: 'Failed to get real order data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
