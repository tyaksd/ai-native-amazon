import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderItemId, estimatedDelivery } = await req.json()

    console.log('📧 Email API called with:', { orderItemId, estimatedDelivery })

    if (!orderItemId || !estimatedDelivery) {
      console.error('❌ Missing required parameters')
      return NextResponse.json({ error: 'orderItemId and estimatedDelivery are required' }, { status: 400 })
    }

    // Get order item details with customer email and product image
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_name,
        unit_price,
        quantity,
        size,
        color,
        product_id,
        order_id,
        orders(
          id,
          customer_email,
          total_amount,
          currency
        )
      `)
      .eq('id', orderItemId)
      .single()

    // Get product image separately
    let productImage = null
    if (orderItem && orderItem.product_id) {
      const { data: product } = await supabase
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
      console.error('❌ Order item data:', orderItem)
      return NextResponse.json({ error: 'Order item not found', details: orderItemError }, { status: 404 })
    }

    console.log('✅ Order item found:', { 
      id: orderItem.id, 
      productName: orderItem.product_name,
      hasOrders: !!orderItem.orders,
      productId: orderItem.product_id
    })

    const customerEmail = (orderItem.orders as any)?.customer_email
    console.log('📧 Customer email:', customerEmail)
    console.log('📧 Orders data:', orderItem.orders)
    
    if (!customerEmail) {
      console.error('❌ No customer email found')
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
    }

    console.log('🖼️ Product image:', productImage)

    // Send estimated delivery email
    const emailHtml = renderEstimatedDeliveryEmail({
      orderId: orderItem.id, // Use order_item ID instead of order ID
      customerEmail,
      productName: orderItem.product_name,
      size: orderItem.size,
      color: orderItem.color,
      estimatedDelivery,
      currency: orderItem.orders && orderItem.orders.length > 0 ? orderItem.orders[0].currency : 'USD',
      productImage
    })

    await sendEmail({
      to: customerEmail,
      subject: 'Your Order Estimated Delivery Update - Godship',
      html: emailHtml,
    })

    console.log(`✅ Estimated delivery email sent to ${customerEmail} for order item ${orderItemId}`)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })

  } catch (error) {
    console.error('Error sending estimated delivery email:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function renderEstimatedDeliveryEmail(params: {
  orderId: string
  customerEmail: string
  productName: string
  size: string | null
  color: string | null
  estimatedDelivery: string
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
      
      <h2 style="margin:0 0 20px;color:#111827;font-size:24px;">Estimated Delivery Update</h2>
      
      <p style="margin:0 0 20px;color:#374151;font-size:16px;">
        Hello! We have an important update about your order.
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
        <p style="margin:0 0 0;color:#374151;"><strong>Estimated Delivery:</strong> <span style="color:#059669;font-weight:600;">${params.estimatedDelivery}</span></p>
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
