import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, calculateDesignPosition } from '@/lib/printful'

export async function POST(_req: NextRequest) {
  try {
    // const client = getPrintfulClient()
    
    // Test data for "Rebel Mark Graphic Tee"
    const testOrderData = {
      external_id: `real-test-order-${Date.now()}`,
      shipping: 'STANDARD',
      recipient: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'Tokyo',
        country_code: 'JP',
        zip: '100-0001',
        email: 'test@example.com'
      },
      items: [] as Array<{variant_id: number; quantity: number; retail_price: string; name: string; files: Array<{id: number; type: string; hash: string; url: string; filename: string; mime_type: string; size: number; width: number; height: number; dpi: number; status: string; created: number; thumbnail_url: string; preview_url: string; visible: boolean; position: {area_width: number; area_height: number; width: number; height: number; top: number; left: number}}>}>
    }
    
    // Test product data
    const testProduct = {
      id: 'test-product-1',
      name: 'Rebel Mark Graphic Tee',
      gender: 'unisex',
      design_png: ['https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'],
      brand: {
        name: 'Test Brand',
        icon: 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759641568/k2au4bustwowanf7dk5q.png'
      }
    }
    
    console.log('Creating REAL Printful order...')
    console.log('WARNING: This will create an actual order in Printful!')
    
    // Calculate design position
    const designPosition = calculateDesignPosition(1000, 1000, 'unisex')
    console.log('Design position:', designPosition)
    
    // Create mock files (in real implementation, these would be uploaded to Printful)
    const mockDesignFile = {
      id: 12345,
      type: 'default',
      hash: 'mock-hash',
      url: testProduct.design_png[0],
      filename: 'rebel_mark_design.png',
      mime_type: 'image/png',
      size: 1024000,
      width: 1000,
      height: 1000,
      dpi: 150,
      status: 'ok',
      created: Date.now(),
      thumbnail_url: 'https://example.com/thumbnail.png',
      preview_url: 'https://example.com/preview.png',
      visible: true,
      position: designPosition
    }
    
    const mockInsideLabel = {
      id: 12346,
      type: 'default',
      hash: 'mock-label-hash',
      url: testProduct.brand.icon,
      filename: 'test_brand_inside_label.png',
      mime_type: 'image/png',
      size: 51200,
      width: 150,
      height: 50,
      dpi: 150,
      status: 'ok',
      created: Date.now(),
      thumbnail_url: 'https://example.com/label-thumbnail.png',
      preview_url: 'https://example.com/label-preview.png',
      visible: true,
      position: {
        area_width: 200,
        area_height: 200,
        width: 150,
        height: 50,
        top: 75,
        left: 25
      }
    }
    
    // Create test order item
    const testOrderItem = {
      variant_id: 71, // Mock variant ID for Gildan 64000
      quantity: 1,
      retail_price: '0.00',
      name: testProduct.name,
      files: [mockDesignFile, mockInsideLabel]
    }
    
    testOrderData.items = [testOrderItem]
    
    console.log('Creating order with data:', testOrderData)
    
    // ⚠️ WARNING: This will create a REAL order in Printful
    // Uncomment the following lines to actually create the order
    /*
    const printfulOrder = await client.createOrder(testOrderData)
    console.log('Printful order created:', printfulOrder.id)
    
    return NextResponse.json({
      success: true,
      message: 'Real Printful order created successfully',
      orderId: printfulOrder.id,
      externalId: printfulOrder.external_id,
      order: printfulOrder
    })
    */
    
    // For safety, return the order data without creating it
    return NextResponse.json({
      success: true,
      message: 'Order data prepared (NOT CREATED - uncomment code to create real order)',
      orderData: testOrderData,
      warning: 'To create a real order, uncomment the createOrder call in the code'
    })
    
  } catch (error) {
    console.error('Printful real order test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
