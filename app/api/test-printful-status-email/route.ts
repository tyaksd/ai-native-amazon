import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderItemId } = await req.json()

    if (!orderItemId) {
      return NextResponse.json({ error: 'orderItemId is required' }, { status: 400 })
    }

    console.log(`📧 Testing printful status email for order item: ${orderItemId}`)

    // Get order item details
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        product_name,
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        printful_shipment_id,
        size,
        color,
        product_id,
        orders(
          id,
          customer_email,
          currency
        )
      `)
      .eq('id', orderItemId)
      .single()

    // Get product image separately
    let productImage = null
    if (orderItem && orderItem.product_id) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('images')
        .eq('id', orderItem.product_id)
        .single()
      
      if (product && product.images && product.images.length > 0) {
        productImage = product.images[0]
      }
    }

    if (orderItemError || !orderItem) {
      console.error('❌ Error fetching order item:', orderItemError)
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    const customerEmail = orderItem.orders?.[0]?.customer_email
    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
    }

    console.log('📧 Sending status update email to:', customerEmail)

    console.log('📧 Order item found:', {
      id: orderItem.id,
      productName: orderItem.product_name,
      status: orderItem.printful_status,
      customerEmail: orderItem.orders?.[0]?.customer_email
    })

    // Create status update email
    const emailHtml = renderStatusUpdateEmail({
      orderId: orderItem.id,
      customerEmail,
      productName: orderItem.product_name,
      size: orderItem.size,
      color: orderItem.color,
      status: orderItem.printful_status,
      fulfillmentStatus: orderItem.printful_fulfillment_status,
      trackingNumber: orderItem.printful_tracking_number,
      shipmentId: orderItem.printful_shipment_id,
      currency: orderItem.orders?.[0]?.currency || 'USD',
      productImage
    })

    // Enable SMTP logging
    process.env.LOG_SMTP = '1'

    await sendEmail({
      to: customerEmail,
      subject: `Your Order Status Update - Godship`,
      html: emailHtml,
    })

    console.log(`✅ Status update email sent to ${customerEmail} for order item ${orderItemId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Status update email sent successfully',
      sentTo: customerEmail
    })

  } catch (error) {
    console.error('❌ Error sending status update email:', error)
    return NextResponse.json({ 
      error: 'Failed to send status update email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function renderStatusUpdateEmail(params: {
  orderId: string
  customerEmail: string
  productName: string
  size: string | null
  color: string | null
  status: string | null
  fulfillmentStatus: string | null
  trackingNumber: string | null
  shipmentId: string | null
  currency: string
  productImage: string | null
}) {
  const meta: string[] = []
  if (params.size) meta.push(`Size: ${params.size}`)
  if (params.color) meta.push(`Color: ${params.color}`)
  const metaText = meta.length ? ` (${meta.join(', ')})` : ''

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
      
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#111827;margin:0;font-size:28px;">Godship</h1>
      </div>
      
      <h2 style="margin:0 0 20px;color:#111827;font-size:24px;">Order Status Update</h2>
      
      <p style="margin:0 0 20px;color:#374151;font-size:16px;">
        Hello! We have an update about your order status.
      </p>
      
      <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="margin:0 0 15px;color:#111827;font-size:18px;">Order Details</h3>
        <p style="margin:0 0 8px;color:#374151;"><strong>Order ID:</strong> ${params.orderId}</p>
        <div style="display:flex;align-items:center;margin:0 0 8px;">
          ${params.productImage ? 
            `<img src="${params.productImage}" alt="${params.productName}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:12px;flex-shrink:0;">` : 
            `<div style="width:60px;height:60px;background-color:#f3f4f6;border-radius:8px;margin-right:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">No Image</div>`
          }
          <div>
            <p style="margin:0;color:#374151;"><strong>Product:</strong> ${params.productName}${metaText}</p>
          </div>
        </div>
        <p style="margin:0 0 8px;color:#374151;"><strong>Status:</strong> <span style="color:#059669;font-weight:600;">${params.status || 'N/A'}</span></p>
        <p style="margin:0 0 8px;color:#374151;"><strong>Fulfillment:</strong> <span style="color:#059669;font-weight:600;">${params.fulfillmentStatus || 'N/A'}</span></p>
        ${params.trackingNumber ? `<p style="margin:0 0 0;color:#374151;"><strong>Tracking Number:</strong> <span style="color:#1d4ed8;font-weight:600;">${params.trackingNumber}</span></p>` : ''}
      </div>
      
      <p style="margin:20px 0 0;color:#6b7280;font-size:14px;">
        If you have any questions about your order, please contact us through our website.
      </p>
      
      <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">
          This is an automated message from Godship. Please do not reply to this email.
        </p>
      </div>
    </div>
  `
}
