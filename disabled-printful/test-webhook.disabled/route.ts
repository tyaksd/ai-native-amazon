// Test Webhook Endpoint (No Signature Verification)
import { NextRequest, NextResponse } from 'next/server'
import { createEnhancedPrintfulOrder } from '@/lib/printful-v2-integration'

export async function POST(req: NextRequest) {
  try {
    console.log('=== TEST WEBHOOK CALLED ===')
    
    const body = await req.json()
    console.log('Webhook payload:', JSON.stringify(body, null, 2))

    // Extract payment intent data
    const paymentIntent = body.data?.object
    if (!paymentIntent) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 })
    }

    // Extract metadata
    const productId = paymentIntent.metadata?.product_id
    const size = paymentIntent.metadata?.size
    const color = paymentIntent.metadata?.color
    const quantity = parseInt(paymentIntent.metadata?.quantity || '1')

    if (!productId || !size || !color) {
      return NextResponse.json({ 
        error: 'Missing required metadata: product_id, size, color' 
      }, { status: 400 })
    }

    console.log(`Processing test order: ${productId}, ${size}, ${color}, qty: ${quantity}`)

    // Create order items array
    const items = [{
      product_id: productId,
      product_name: 'Test Product',
      size,
      color,
      quantity,
      price: 2999 // $29.99 in cents
    }]

    // Create shipping address
    const shippingAddress = paymentIntent.shipping?.address || {
      line1: '123 Test Street',
      city: 'Tokyo',
      state: 'Tokyo',
      country: 'JP',
      postal_code: '100-0001'
    }

    const shippingName = paymentIntent.shipping?.name || 'Test Customer'
    const customerEmail = paymentIntent.receipt_email || 'test@example.com'

    console.log('Creating Printful order with cache-first approach...')
    
    // Test the cache-first approach
    const result = await createEnhancedPrintfulOrder({
      items,
      shippingAddress,
      shippingName,
      customerEmail
    })

    console.log('✅ Test webhook completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Test webhook processed successfully',
      printfulOrder: result
    })

  } catch (error) {
    console.error('❌ Test webhook error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
