import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

// Verify Printful webhook signature
function verifyPrintfulSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

interface PrintfulData {
  status?: string;
  fulfillment_status?: string;
  tracking_number?: string;
  shipment_id?: string;
  shipment_number?: string;
  shipment?: string;
  error_message?: string;
  shipments?: Array<{
    id?: string;
    shipment_id?: string;
    shipment_number?: string;
    estimated_delivery_date?: string;
    estimated_delivery_timestamp?: string;
  }>;
  estimated_delivery_date?: string;
  estimated_delivery_timestamp?: string;
}

// Update order item with Printful status
async function updateOrderItemStatus(
  externalId: string,
  printfulData: PrintfulData
) {
  console.log(`Updating order item ${externalId} with Printful data:`, JSON.stringify(printfulData, null, 2))
  
  // Extract estimated delivery information
  let estimatedDeliveryDate = null
  let estimatedDeliveryTimestamp = null
  let shipmentNumber = null
  
  // Debug: Log shipment information
  console.log('Shipments data:', printfulData.shipments)
  console.log('Shipment ID:', printfulData.shipment_id)
  
  if (printfulData.estimated_delivery_date) {
    estimatedDeliveryDate = printfulData.estimated_delivery_date
  }
  
  if (printfulData.estimated_delivery_timestamp) {
    estimatedDeliveryTimestamp = printfulData.estimated_delivery_timestamp
  }
  
  // Extract shipment information from webhook data
  if (printfulData.shipments && printfulData.shipments.length > 0) {
    const latestShipment = printfulData.shipments[printfulData.shipments.length - 1]
    console.log('Latest shipment from webhook:', latestShipment)
    
    // Try different possible field names for shipment ID
    if (latestShipment.id) {
      shipmentNumber = `Shipment #${latestShipment.id}`
      console.log('Found shipment ID from webhook shipments[].id:', latestShipment.id)
    } else if (latestShipment.shipment_id) {
      shipmentNumber = `Shipment #${latestShipment.shipment_id}`
      console.log('Found shipment ID from webhook shipments[].shipment_id:', latestShipment.shipment_id)
    } else if (latestShipment.shipment_number) {
      shipmentNumber = latestShipment.shipment_number
      console.log('Found shipment number from webhook shipments[].shipment_number:', latestShipment.shipment_number)
    }
    
    // Get estimated delivery from shipment
    if (latestShipment.estimated_delivery_date) {
      estimatedDeliveryDate = latestShipment.estimated_delivery_date
    }
    if (latestShipment.estimated_delivery_timestamp) {
      estimatedDeliveryTimestamp = latestShipment.estimated_delivery_timestamp
    }
  }
  
  // Check for shipment ID in other possible locations
  if (!shipmentNumber) {
    if (printfulData.shipment_id) {
      shipmentNumber = `Shipment #${printfulData.shipment_id}`
      console.log('Found shipment ID from shipment_id:', printfulData.shipment_id)
    } else if (printfulData.shipment_number) {
      shipmentNumber = printfulData.shipment_number
      console.log('Found shipment number from shipment_number:', printfulData.shipment_number)
    } else if (printfulData.shipment) {
      shipmentNumber = `Shipment #${printfulData.shipment}`
      console.log('Found shipment ID from shipment:', printfulData.shipment)
    }
  }
  
  console.log('Final shipment number:', shipmentNumber)
  
  const { error } = await supabaseAdmin
    .from('order_items')
    .update({
      printful_status: printfulData.status,
      printful_fulfillment_status: printfulData.fulfillment_status,
      printful_tracking_number: printfulData.tracking_number,
      printful_shipment_id: printfulData.shipment_id,
      printful_shipment_number: shipmentNumber,
      printful_estimated_delivery_date: estimatedDeliveryDate,
      printful_estimated_delivery_timestamp: estimatedDeliveryTimestamp,
      printful_last_updated: new Date().toISOString(),
      printful_error_message: printfulData.error_message || null
    })
    .eq('id', externalId)

  if (error) {
    console.error('Failed to update order item:', error)
    throw error
  }

  console.log(`✅ Successfully updated order item ${externalId}`)
  if (estimatedDeliveryDate) {
    console.log(`📅 Estimated delivery: ${estimatedDeliveryDate}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== Printful Webhook Received ===')
    
    const body = await req.text()
    const signature = req.headers.get('x-printful-signature')
    
    // Verify webhook signature
    const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('PRINTFUL_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature || !verifyPrintfulSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)
    console.log('Webhook data:', JSON.stringify(data, null, 2))

    // Handle different webhook types
    const { type, data: webhookData } = data

    switch (type) {
      case 'order_updated':
        console.log('Order updated webhook received')
        if (webhookData?.external_id) {
          await updateOrderItemStatus(webhookData.external_id, webhookData)
        }
        break

      case 'order_failed':
        console.log('Order failed webhook received')
        if (webhookData?.external_id) {
          await updateOrderItemStatus(webhookData.external_id, {
            ...webhookData,
            status: 'failed',
            error_message: webhookData.error_message || 'Order failed'
          })
        }
        break

      case 'order_fulfilled':
        console.log('Order fulfilled webhook received')
        if (webhookData?.external_id) {
          await updateOrderItemStatus(webhookData.external_id, {
            ...webhookData,
            status: 'fulfilled',
            fulfillment_status: 'fulfilled'
          })
        }
        break

      case 'order_shipped':
        console.log('Order shipped webhook received')
        if (webhookData?.external_id) {
          await updateOrderItemStatus(webhookData.external_id, {
            ...webhookData,
            fulfillment_status: 'shipped',
            tracking_number: webhookData.tracking_number
          })
        }
        break

      case 'order_returned':
        console.log('Order returned webhook received')
        if (webhookData?.external_id) {
          await updateOrderItemStatus(webhookData.external_id, {
            ...webhookData,
            fulfillment_status: 'returned'
          })
        }
        break

      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    console.log('=== Printful Webhook Processed Successfully ===')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Printful webhook processing failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
