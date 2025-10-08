import { NextRequest, NextResponse } from 'next/server'
import { getAvailableTshirtProducts, findBestVariant } from '@/lib/printful'

export async function GET(_req: NextRequest) {
  try {
    console.log('=== Testing Color Mapping ===')
    
    // Get available products
    const availableProducts = await getAvailableTshirtProducts()
    
    if (availableProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No T-shirt products found in Printful'
      }, { status: 400 })
    }
    
    const testProduct = availableProducts[0]
    console.log(`Testing with product: ${testProduct.name} (ID: ${testProduct.id})`)
    
    // Test different Godship colors
    const testColors = [
      { godship: 'BLUE', expected: 'Royal' },
      { godship: 'GREY', expected: 'Sport Grey' },
      { godship: 'BLACK', expected: 'Black' },
      { godship: 'WHITE', expected: 'White' },
      { godship: 'RED', expected: 'Red' }
    ]
    
    const results = []
    
    for (const testColor of testColors) {
      console.log(`\nTesting color: ${testColor.godship} -> ${testColor.expected}`)
      
      const variant = await findBestVariant(testProduct.id, 'M', testColor.godship)
      
      results.push({
        godshipColor: testColor.godship,
        expectedPrintfulColor: testColor.expected,
        foundVariant: variant ? {
          id: variant.id,
          size: variant.size,
          color: variant.color,
          in_stock: variant.in_stock
        } : null,
        success: !!variant
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Color mapping test completed',
      product: {
        id: testProduct.id,
        name: testProduct.name,
        brand: testProduct.brand
      },
      results,
      summary: {
        totalTests: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
    
  } catch (error) {
    console.error('❌ Color mapping test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
