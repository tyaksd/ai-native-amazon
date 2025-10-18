import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Printful API client for fetching order status (unused but kept for potential future use)
/*
async function getPrintfulOrderStatus(orderId: string) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY is not configured')
  }

  const response = await fetch(`https://api.printful.com/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Printful API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}
*/

interface PrintfulOrderData {
  status?: string;
  fulfillment_status?: string;
  tracking_number?: string;
  shipment_id?: string;
  error_message?: string;
}

// Update order item with Printful status
async function updateOrderItemStatus(
  orderItemId: string, 
  printfulData: PrintfulOrderData
) {
  const { error } = await supabaseAdmin
    .from('order_items')
    .update({
      printful_status: printfulData.status,
      printful_fulfillment_status: printfulData.fulfillment_status,
      printful_tracking_number: printfulData.tracking_number,
      printful_shipment_id: printfulData.shipment_id,
      printful_last_updated: new Date().toISOString(),
      printful_error_message: printfulData.error_message || null
    })
    .eq('id', orderItemId)

  if (error) {
    console.error('Failed to update order item:', error)
    throw error
  }
}

// Get all order items that need status updates
async function getOrderItemsToSync() {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      printful_item_id,
      printful_last_updated,
      printful_status,
      printful_retry_count
    `)
    .not('printful_item_id', 'is', null)
    .or('printful_status.is.null,printful_status.neq.fulfilled')

  if (error) {
    throw error
  }

  return data || []
}

// Get Printful order by external_id (which should be the order_items.id)
async function getPrintfulOrderByExternalId(externalId: string) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY is not configured')
  }

  // Try to get order by external_id using the orders endpoint with limit
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
    throw new Error(`No Printful order found with external_id: ${externalId}`)
  }

  return matchingOrder
}

export async function POST() {
  try {
    console.log('=== Starting Printful Order Sync ===')
    
    // Get all order items that need status updates
    const orderItems = await getOrderItemsToSync()
    console.log(`Found ${orderItems.length} order items to sync`)

    const results = {
      total: orderItems.length,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    // Process each order item
    for (const item of orderItems) {
      try {
        console.log(`Syncing order item: ${item.id}`)
        
        // Fetch status from Printful using the order item ID as external_id
        // The external_id in Printful should match the order_items.id
        const printfulData = await getPrintfulOrderByExternalId(item.id)
        
        // Update the order item with new status
        await updateOrderItemStatus(item.id, printfulData)
        
        results.updated++
        console.log(`✅ Updated order item ${item.id}: ${printfulData.status}`)
        
      } catch (error) {
        results.errors++
        const errorMsg = `Failed to sync order item ${item.id}: ${error}`
        results.errorDetails.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
        
        // Update retry count
        await supabaseAdmin
          .from('order_items')
          .update({
            printful_retry_count: (item.printful_retry_count || 0) + 1,
            printful_error_message: error instanceof Error ? error.message : String(error)
          })
          .eq('id', item.id)
      }
    }

    console.log('=== Printful Order Sync Complete ===')
    console.log(`Results: ${results.updated} updated, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      message: 'Printful order sync completed',
      results
    })

  } catch (error) {
    console.error('Printful order sync failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Manual sync endpoint for testing
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const orderItemId = url.searchParams.get('orderItemId')
  
  if (!orderItemId) {
    return NextResponse.json(
      { error: 'orderItemId parameter is required' },
      { status: 400 }
    )
  }

  try {
    console.log(`Manual sync for order item: ${orderItemId}`)
    
    const printfulData = await getPrintfulOrderByExternalId(orderItemId)
    await updateOrderItemStatus(orderItemId, printfulData)
    
    return NextResponse.json({
      success: true,
      message: 'Order item synced successfully',
      data: printfulData
    })

  } catch (error) {
    console.error('Manual sync failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
