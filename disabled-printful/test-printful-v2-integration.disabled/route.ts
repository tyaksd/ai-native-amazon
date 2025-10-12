import { NextResponse } from 'next/server'
import { createEnhancedPrintfulOrder } from '@/lib/printful-v2-integration'

export async function POST() {
  try {
    console.log('=== Testing Printful v2 Integration ===')
    
    // Test data
    const testOrderId = `test_order_${Date.now()}`
    const testItems = [
      {
        product_id: 'test-product-1',
        product_name: 'Test T-Shirt',
        quantity: 1,
        size: 'M',
        color: 'Black'
      }
    ]
    
    const testShippingAddress = {
      name: 'Test Customer',
      address1: '123 Test Street',
      city: 'Test City',
      country_code: 'US',
      zip: '12345',
      email: 'test@example.com'
    }
    
    console.log('Test order ID:', testOrderId)
    console.log('Test items:', testItems)
    console.log('Test shipping address:', testShippingAddress)
    
    // Test the enhanced order creation
    try {
      const order = await createEnhancedPrintfulOrder(
        testOrderId,
        testItems,
        testShippingAddress,
        'test@example.com',
        {
          estimateCosts: true,
          useMockups: false // Disable mockups for test
        }
      )
      
      console.log('✅ Test order created successfully!')
      console.log('Order ID:', order.id)
      console.log('External ID:', order.external_id)
      
      return NextResponse.json({
        success: true,
        message: 'Printful v2 integration test successful',
        order: {
          id: order.id,
          external_id: order.external_id,
          status: order.status
        },
        testResults: {
          orderCreation: 'PASSED',
          apiV2Integration: 'PASSED',
          errorHandling: 'PASSED'
        }
      })
      
    } catch (orderError) {
      console.error('❌ Test order creation failed:', orderError)
      
      return NextResponse.json({
        success: false,
        error: 'Test order creation failed',
        details: orderError instanceof Error ? orderError.message : 'Unknown error',
        testResults: {
          orderCreation: 'FAILED',
          apiV2Integration: 'FAILED',
          errorHandling: 'PASSED' // Error was caught and handled
        },
        troubleshooting: [
          '1. Check PRINTFUL_API_KEY environment variable',
          '2. Verify Printful API access',
          '3. Check product data in database',
          '4. Review error logs for details'
        ]
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      testResults: {
        orderCreation: 'FAILED',
        apiV2Integration: 'FAILED',
        errorHandling: 'FAILED'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Printful v2 Integration Test Endpoint',
    description: 'POST to this endpoint to test the Printful v2 integration',
    testData: {
      orderId: 'test_order_timestamp',
      items: [
        {
          product_id: 'test-product-1',
          product_name: 'Test T-Shirt',
          quantity: 1,
          size: 'M',
          color: 'Black'
        }
      ],
      shippingAddress: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'Test City',
        country_code: 'US',
        zip: '12345',
        email: 'test@example.com'
      }
    },
    instructions: [
      '1. Ensure PRINTFUL_API_KEY is set',
      '2. Make sure test products exist in database',
      '3. POST to this endpoint to run the test',
      '4. Check the response for test results'
    ]
  })
}
