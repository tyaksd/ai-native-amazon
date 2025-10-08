import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, calculateDesignPosition, createInsideLabelFile, getImageDimensions } from '@/lib/printful'

export async function POST(req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    // Test data for "Rebel Mark Graphic Tee"
    const testOrderData = {
      external_id: `test-order-${Date.now()}`,
      shipping: 'STANDARD',
      recipient: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'Tokyo',
        country_code: 'JP',
        zip: '100-0001',
        email: 'test@example.com'
      },
      items: [] as any[]
    }
    
    // Test product data
    const testProduct = {
      id: 'test-product-1',
      name: 'Rebel Mark Graphic Tee',
      gender: 'unisex',
      design_png: ['https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'], // Replace with actual design URL
      brand: {
        name: 'Test Brand',
        icon: 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759641568/k2au4bustwowanf7dk5q.png' // Replace with actual brand logo URL
      }
    }
    
    console.log('Testing Printful order creation...')
    console.log('Test product:', testProduct)
    
    // Test 1: Test design position calculation
    console.log('\n1. Testing design position calculation...')
    const designPosition = calculateDesignPosition(1000, 1000, 'unisex')
    console.log('Design position:', designPosition)
    
    // Test 2: Test image dimensions
    console.log('\n2. Testing image dimensions...')
    try {
      const dimensions = await getImageDimensions(testProduct.design_png[0])
      console.log('Image dimensions:', dimensions)
    } catch (error) {
      console.log('Image dimensions test failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Test 3: Test file upload structure (mock)
    console.log('\n3. Testing file upload structure...')
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
      placement: "front_large",
      position: designPosition
    }
    
    // Test 4: Test inside label creation (mock)
    console.log('\n4. Testing inside label creation...')
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
    
    // Test 5: Create test order structure
    console.log('\n5. Creating test order structure...')
    const testOrderItem = {
      variant_id: 71, // Mock variant ID for Gildan 64000
      quantity: 1,
      retail_price: '0.00',
      name: testProduct.name,
      files: [mockDesignFile, mockInsideLabel]
    }
    
    testOrderData.items = [testOrderItem]
    
    console.log('\n6. Test order structure:')
    console.log(JSON.stringify(testOrderData, null, 2))
    
    // Test 6: Test actual Printful order creation (commented out to avoid real orders)
    console.log('\n7. Testing Printful order creation (DRY RUN)...')
    console.log('Note: Actual order creation is disabled to prevent real orders')
    console.log('Order would be created with the following data:')
    console.log('- External ID:', testOrderData.external_id)
    console.log('- Recipient:', testOrderData.recipient.name)
    console.log('- Items:', testOrderData.items.length)
    console.log('- Design files:', testOrderData.items[0].files.length)
    
    return NextResponse.json({
      success: true,
      message: 'Printful test completed successfully (DRY RUN)',
      testResults: {
        designPosition,
        testOrder: testOrderData,
        mockFiles: {
          designFile: mockDesignFile,
          insideLabel: mockInsideLabel
        }
      }
    })
    
  } catch (error) {
    console.error('Printful test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
