import { NextRequest, NextResponse } from 'next/server'
import { createPrintfulOrder, getPrintfulClient, findBestVariantCatalog } from '@/lib/printful'

export async function POST(_req: NextRequest) {
  try {
    console.log('=== Debug Printful Order Creation ===')
    
    // First, check available T-shirt products using catalog API
    console.log('Checking available T-shirt products...')
    const client = getPrintfulClient()
    const availableProducts = await client.getCatalogProducts('Gildan 64000')
    
    if (availableProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No T-shirt products found in Printful',
        message: 'Please check your Printful account and API key'
      }, { status: 400 })
    }
    
    // Test data with different colors to test mapping
    const testOrderId = `debug-order-${Date.now()}`
    const testItems = [
      {
        product_id: 'test-product-1',
        product_name: 'Test T-Shirt',
        quantity: 1,
        size: 'M',
        color: 'BLUE' // Test Godship BLUE -> Printful Royal mapping
      }
    ]
    
    const testAddress = {
      name: 'Test Customer',
      address1: '123 Test Street',
      address2: undefined,
      city: 'Tokyo',
      state_code: undefined,
      country_code: 'JP',
      zip: '100-0001',
      phone: undefined,
      email: 'test@example.com'
    }
    
    console.log('Test data:')
    console.log('- Order ID:', testOrderId)
    console.log('- Items:', testItems)
    console.log('- Address:', testAddress)
    console.log('- Available products:', availableProducts.map(p => ({ id: p.id, name: p.name })))
    
    // Test variant finding for the first product
    if (availableProducts.length > 0) {
      const testProduct = availableProducts[0]
      console.log(`Testing variant finding for product: ${testProduct.name} (ID: ${testProduct.id})`)
      
      const testVariant = await findBestVariantCatalog(client, testProduct.id, 'M', 'Black')
      if (testVariant) {
        console.log(`✅ Found test variant: ${testVariant.id} (${testVariant.size} ${testVariant.color})`)
      } else {
        console.log('❌ No test variant found')
      }
    }
    
    // Test Printful order creation
    console.log('Creating Printful order...')
    const printfulOrder = await createPrintfulOrder(
      testOrderId,
      testItems,
      testAddress,
      'test@example.com'
    )
    
    console.log('✅ Printful order created successfully!')
    console.log('Order ID:', printfulOrder.id)
    console.log('External ID:', printfulOrder.external_id)
    
    return NextResponse.json({
      success: true,
      message: 'Printful order created successfully',
      order: printfulOrder,
      availableProducts: availableProducts.map(p => ({ id: p.id, name: p.name, brand: p.brand })),
      debug: {
        testOrderId,
        testItems,
        testAddress
      }
    })
    
  } catch (error) {
    console.error('❌ Printful order creation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
