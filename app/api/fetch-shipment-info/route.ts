import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Get Printful order by external_id and extract estimated delivery
async function getPrintfulOrderWithEstimatedDelivery(externalId: string) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    console.log('PRINTFUL_API_KEY not configured, using fallback data')
    return null
  }

  try {
    // First, get all orders to find the one with matching external_id
    const response = await fetch('https://api.printful.com/orders?limit=100', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Printful API error: ${response.status} ${response.statusText}`)
      return null
    }

    const ordersData = await response.json()
    
    // Find order with matching external_id
    const matchingOrder = ordersData.result.find((order: { external_id: string }) => 
      order.external_id === externalId
    )

    if (!matchingOrder) {
      console.log(`No Printful order found with external_id: ${externalId}`)
      return null
    }

    console.log('Found matching Printful order:', matchingOrder.id)
    return matchingOrder
  } catch (error) {
    console.error('Error fetching Printful order:', error)
    return null
  }
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

    console.log(`Fetching shipment info for order item: ${orderItemId}`)
    
    // Try to get Printful order data
    const printfulOrder = await getPrintfulOrderWithEstimatedDelivery(orderItemId)
    
    // Extract estimated delivery from Printful order
    let estimatedDeliveryDate = null
    
    if (printfulOrder) {
      console.log('Printful order data:', JSON.stringify(printfulOrder, null, 2))
      
      // Check for estimated delivery in various possible fields
      console.log('Checking for estimated delivery in Printful order data...')
      
      // Check all possible fields for estimated delivery
      const possibleFields = [
        'estimated_delivery_date',
        'estimated_delivery',
        'delivery_date',
        'expected_delivery',
        'shipping_date',
        'fulfillment_date'
      ]
      
      for (const field of possibleFields) {
        if (printfulOrder[field]) {
          estimatedDeliveryDate = printfulOrder[field]
          console.log(`Found estimated delivery in ${field}:`, estimatedDeliveryDate)
          break
        }
      }
      
      // Check in shipping info
      if (printfulOrder.shipping) {
        console.log('Checking shipping object:', printfulOrder.shipping)
        for (const field of possibleFields) {
          if (printfulOrder.shipping[field]) {
            estimatedDeliveryDate = printfulOrder.shipping[field]
            console.log(`Found estimated delivery in shipping.${field}:`, estimatedDeliveryDate)
            break
          }
        }
      }
      
      // Check in items for delivery info
      if (printfulOrder.items && printfulOrder.items.length > 0) {
        console.log('Checking items for delivery info...')
        for (const item of printfulOrder.items) {
          for (const field of possibleFields) {
            if (item[field]) {
              estimatedDeliveryDate = item[field]
              console.log(`Found estimated delivery in item.${field}:`, estimatedDeliveryDate)
              break
            }
          }
        }
      }
      
      // If no estimated delivery found in API, leave it as null (don't calculate)
      if (!estimatedDeliveryDate) {
        console.log('No estimated delivery found in Printful API - leaving as null')
      }
    }
    
    // Extract Printful Order ID and Shipment ID from API response
    let shipmentNumber = null
    let trackingNumber = null
    
    if (printfulOrder) {
      const printfulOrderId = printfulOrder.id
      console.log('Printful Order ID:', printfulOrderId)
      
      // Check if there are shipments
      if (printfulOrder.shipments && printfulOrder.shipments.length > 0) {
        const latestShipment = printfulOrder.shipments[printfulOrder.shipments.length - 1]
        const shipmentId = latestShipment.id
        console.log('Shipment ID:', shipmentId)
        
        // Create shipment number in format: OrderID-ShipmentID
        shipmentNumber = `Shipment #${printfulOrderId}-${shipmentId}`
        console.log('Created shipment number:', shipmentNumber)
        
        // Get tracking number if available
        if (latestShipment.tracking_number) {
          trackingNumber = latestShipment.tracking_number
          console.log('Found tracking number:', trackingNumber)
        }
      } else {
        // Fallback: use just the Printful Order ID
        shipmentNumber = `Shipment #${printfulOrderId}`
        console.log('No shipments found, using Order ID only:', shipmentNumber)
      }
    } else {
      // Fallback: use order item ID
      shipmentNumber = `Shipment #${orderItemId}`
      console.log('No Printful order found, using order item ID:', shipmentNumber)
    }
    
    // Update database with shipment and estimated delivery information
    try {
      const updateData: Record<string, string | null> = {
        printful_shipment_number: shipmentNumber,
        printful_last_updated: new Date().toISOString()
      }
      
      // Add estimated delivery if found
      if (estimatedDeliveryDate) {
        updateData.printful_estimated_delivery_date = estimatedDeliveryDate
        updateData.printful_estimated_delivery_timestamp = new Date().toISOString()
        console.log('Adding estimated delivery to database:', estimatedDeliveryDate)
      }
      
      const { error } = await supabaseAdmin
        .from('order_items')
        .update(updateData)
        .eq('id', orderItemId)
      
      if (error) {
        console.error('Failed to update order item:', error)
        // Don't throw error, just log it and continue
      } else {
        console.log('Successfully updated order item with shipment and delivery info')
      }
    } catch (dbError) {
      console.error('Database update error:', dbError)
      // Don't throw error, just log it and continue
    }
    
    return NextResponse.json({
      success: true,
      message: 'Shipment information retrieved successfully',
      data: {
        shipment_number: shipmentNumber,
        tracking_number: trackingNumber,
        estimated_delivery_date: estimatedDeliveryDate,
        printful_order: printfulOrder
      }
    })

  } catch (error) {
    console.error('Failed to fetch shipment info:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}