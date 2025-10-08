import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, findTshirtProduct } from '@/lib/printful'

export async function GET(_req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    // Test getting all products
    console.log('Fetching all products from Printful...')
    const products = await client.getProducts()
    console.log(`Found ${products.length} products`)
    
    // Test finding T-shirt products
    console.log('Testing T-shirt product search...')
    const unisexProduct = await findTshirtProduct('unisex', client)
    const womenProduct = await findTshirtProduct('women', client)
    const menProduct = await findTshirtProduct('men', client)
    
    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      tshirtProducts: {
        unisex: unisexProduct ? {
          id: unisexProduct.id,
          name: unisexProduct.name,
          brand: unisexProduct.brand,
          model: unisexProduct.model
        } : null,
        women: womenProduct ? {
          id: womenProduct.id,
          name: womenProduct.name,
          brand: womenProduct.brand,
          model: womenProduct.model
        } : null,
        men: menProduct ? {
          id: menProduct.id,
          name: menProduct.name,
          brand: menProduct.brand,
          model: menProduct.model
        } : null,
      },
      allProducts: products.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        type: p.type
      }))
    })
  } catch (error) {
    console.error('Printful test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
