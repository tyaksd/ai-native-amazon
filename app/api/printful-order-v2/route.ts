import { NextResponse } from 'next/server'
import { getPrintfulV2Client } from '@/lib/printful-v2'

export async function POST(req: Request) {
  try {
    const { 
      externalId, 
      items, 
      shippingAddress, 
      customerEmail,
      estimateCosts = false 
    } = await req.json()

    if (!externalId || !items || !shippingAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: externalId, items, shippingAddress'
      }, { status: 400 })
    }

    const client = getPrintfulV2Client()
    
    console.log('Creating Printful order with API v2...')
    console.log('External ID:', externalId)
    console.log('Items count:', items.length)
    console.log('Shipping address:', shippingAddress)

    // Step 1: Estimate costs if requested
    if (estimateCosts) {
      console.log('Estimating order costs...')
      try {
        const costEstimate = await client.estimateOrderCosts({
          recipient: {
            country_code: shippingAddress.country_code,
            state_code: shippingAddress.state_code,
            city: shippingAddress.city,
            zip: shippingAddress.zip
          },
          items: items.map((item: { variant_id: number; quantity: number }) => ({
            variant_id: item.variant_id,
            quantity: item.quantity
          }))
        })
        
        console.log('Cost estimate:', costEstimate)
        
        return NextResponse.json({
          success: true,
          message: 'Order cost estimated successfully',
          estimate: costEstimate,
          nextSteps: [
            'Review the cost estimate',
            'Create the actual order if costs are acceptable'
          ]
        })
      } catch (error) {
        console.error('Cost estimation failed:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to estimate order costs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Step 2: Create the actual order
    console.log('Creating order...')
    const orderData = {
      external_id: externalId,
      shipping: 'STANDARD',
      recipient: {
        name: shippingAddress.name,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state_code: shippingAddress.state_code,
        country_code: shippingAddress.country_code,
        zip: shippingAddress.zip,
        phone: shippingAddress.phone,
        email: customerEmail || shippingAddress.email
      },
      items: items.map((item: { 
        variant_id: number; 
        quantity: number; 
        name: string; 
        files?: Array<{ 
          id: number; 
          type: string; 
          url: string; 
          position?: {
            area_width: number;
            area_height: number;
            width: number;
            height: number;
            top: number;
            left: number;
          }
        }> 
      }) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        name: item.name,
        files: item.files || []
      }))
    }

    console.log('Order data:', JSON.stringify(orderData, null, 2))

    const order = await client.createOrder(orderData)
    
    console.log('✅ Order created successfully!')
    console.log('Order ID:', order.id)
    console.log('External ID:', order.external_id)
    console.log('Status:', order.status)

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        external_id: order.external_id,
        status: order.status,
        shipping: order.shipping,
        created: order.created,
        updated: order.updated
      },
      costs: order.costs,
      retail_costs: order.retail_costs,
      nextSteps: [
        '1. Monitor order status in Printful dashboard',
        '2. Track shipment when available',
        '3. Handle any fulfillment issues'
      ],
      dashboardLinks: {
        printfulDashboard: 'https://www.printful.com/dashboard/default/orders',
        orderDetails: `https://www.printful.com/dashboard/default/orders/${order.id}`
      }
    })

  } catch (error) {
    console.error('Order creation error:', error)
    
    // Enhanced error handling based on API v2 error format
    let errorMessage = 'Unknown error'
    let errorCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Parse specific Printful API errors
      if (error.message.includes('variant_id')) {
        errorCode = 400
        errorMessage = 'Invalid variant ID provided'
      } else if (error.message.includes('recipient')) {
        errorCode = 400
        errorMessage = 'Invalid recipient information'
      } else if (error.message.includes('files')) {
        errorCode = 400
        errorMessage = 'Invalid file information'
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: error,
      troubleshooting: [
        '1. Verify all variant IDs are valid',
        '2. Check recipient address format',
        '3. Ensure file URLs are accessible',
        '4. Review Printful API documentation'
      ]
    }, { status: errorCode })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const externalId = searchParams.get('externalId')
    
    if (!externalId) {
      return NextResponse.json({
        success: false,
        error: 'externalId parameter is required'
      }, { status: 400 })
    }

    const client = getPrintfulV2Client()
    
    console.log('Getting order details:', externalId)
    const order = await client.getOrder(externalId)
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        external_id: order.external_id,
        status: order.status,
        shipping: order.shipping,
        created: order.created,
        updated: order.updated,
        recipient: order.recipient,
        items: order.items,
        costs: order.costs,
        retail_costs: order.retail_costs,
        shipments: order.shipments
      }
    })

  } catch (error) {
    console.error('Order retrieval error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
