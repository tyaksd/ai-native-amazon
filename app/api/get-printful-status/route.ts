import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Get Printful order by external_id
async function getPrintfulOrderByExternalId(externalId: string) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY is not configured')
  }

  // Try to get order by external_id using the orders endpoint
  let response = await fetch('https://api.printful.com/orders?limit=100', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Printful API error: ${response.status} ${response.statusText}`)
  }

  const ordersData = await response.json()
  
  // Find order with matching external_id
  let matchingOrder = ordersData.result.find((order: { external_id: string }) => 
    order.external_id === externalId
  )

  // If not found in first 100, try to get more orders
  if (!matchingOrder && ordersData.paging?.total > 100) {
    response = await fetch('https://api.printful.com/orders?limit=100&offset=100', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const moreOrdersData = await response.json()
      matchingOrder = moreOrdersData.result.find((order: { external_id: string }) => 
        order.external_id === externalId
      )
    }
  }

  if (!matchingOrder) {
    return null // Return null instead of throwing error
  }

  return matchingOrder
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const orderItemId = url.searchParams.get('orderItemId')
    
    if (!orderItemId) {
      return NextResponse.json(
        { error: 'orderItemId parameter is required' },
        { status: 400 }
      )
    }

    console.log(`Fetching Printful status for order item: ${orderItemId}`)
    
    // Get Printful order status
    const printfulOrder = await getPrintfulOrderByExternalId(orderItemId)
    
    if (!printfulOrder) {
      return NextResponse.json({
        success: true,
        message: 'No Printful order found',
        data: null
      })
    }

    // Update database with latest status
    const { error: updateError } = await supabaseAdmin
      .from('order_items')
      .update({
        printful_status: printfulOrder.status,
        printful_fulfillment_status: printfulOrder.fulfillment_status,
        printful_tracking_number: printfulOrder.tracking_number,
        printful_shipment_id: printfulOrder.shipment_id,
        printful_last_updated: new Date().toISOString(),
        printful_error_message: printfulOrder.error_message || null
      })
      .eq('id', orderItemId)

    if (updateError) {
      console.error('Failed to update order item:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Printful status retrieved successfully',
      data: {
        status: printfulOrder.status,
        fulfillment_status: printfulOrder.fulfillment_status,
        tracking_number: printfulOrder.tracking_number,
        shipment_id: printfulOrder.shipment_id,
        error_message: printfulOrder.error_message,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to get Printful status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
