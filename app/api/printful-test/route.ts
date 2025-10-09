import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient } from '@/lib/printful'

export async function GET(_req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    // Test getting catalog products
    console.log('Fetching catalog products from Printful...')
    const unisexProducts = await client.getCatalogProducts('Gildan 64000')
    const womenProducts = await client.getCatalogProducts('Bella + Canvas 6400')
    console.log(`Found ${unisexProducts.length} unisex products, ${womenProducts.length} women products`)
    
    // Test finding T-shirt products
    console.log('Testing T-shirt product search...')
    const unisexProduct = unisexProducts[0] || null
    const womenProduct = womenProducts[0] || null
    const menProduct = unisexProducts[0] || null
    
    return NextResponse.json({
      success: true,
      totalProducts: unisexProducts.length + womenProducts.length,
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
      allProducts: [...unisexProducts, ...womenProducts].slice(0, 10).map(p => ({
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
