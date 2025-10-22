import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderItemId, newStatus, newFulfillmentStatus, trackingNumber } = await req.json()

    if (!orderItemId) {
      return NextResponse.json({ error: 'orderItemId is required' }, { status: 400 })
    }

    console.log(`🔄 Testing printful status update for order item: ${orderItemId}`)
    console.log(`📊 New status: ${newStatus}, fulfillment: ${newFulfillmentStatus}`)

    // First, get current order item details
    const { data: currentItem, error: fetchError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        product_name,
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        orders!inner(
          id,
          customer_email
        )
      `)
      .eq('id', orderItemId)
      .single()

    if (fetchError || !currentItem) {
      console.error('❌ Error fetching order item:', fetchError)
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    console.log('📦 Current order item:', {
      id: currentItem.id,
      productName: currentItem.product_name,
      currentStatus: currentItem.printful_status,
      currentFulfillment: currentItem.printful_fulfillment_status,
      customerEmail: currentItem.orders?.customer_email
    })

    // Update the printful status
    const updateData = {
      printful_status: newStatus || 'shipped',
      printful_fulfillment_status: newFulfillmentStatus || 'shipped',
      printful_tracking_number: trackingNumber || 'TEST123456789',
      printful_shipment_id: `test-shipment-${Date.now()}`,
      printful_last_updated: new Date().toISOString()
    }

    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('order_items')
      .update(updateData)
      .eq('id', orderItemId)
      .select(`
        id,
        product_name,
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        printful_shipment_id,
        printful_last_updated,
        orders!inner(
          id,
          customer_email
        )
      `)
      .single()

    if (updateError) {
      console.error('❌ Error updating order item:', updateError)
      return NextResponse.json({ error: 'Failed to update order item' }, { status: 500 })
    }

    console.log('✅ Order item updated successfully:', {
      id: updatedItem.id,
      newStatus: updatedItem.printful_status,
      newFulfillment: updatedItem.printful_fulfillment_status,
      trackingNumber: updatedItem.printful_tracking_number,
      customerEmail: updatedItem.orders?.customer_email
    })

    return NextResponse.json({
      success: true,
      message: 'Printful status updated successfully',
      updatedItem: {
        id: updatedItem.id,
        productName: updatedItem.product_name,
        printfulStatus: updatedItem.printful_status,
        printfulFulfillmentStatus: updatedItem.printful_fulfillment_status,
        trackingNumber: updatedItem.printful_tracking_number,
        shipmentId: updatedItem.printful_shipment_id,
        lastUpdated: updatedItem.printful_last_updated,
        customerEmail: updatedItem.orders?.customer_email
      }
    })

  } catch (error) {
    console.error('❌ Error in test printful status update:', error)
    return NextResponse.json({ 
      error: 'Failed to test printful status update',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
