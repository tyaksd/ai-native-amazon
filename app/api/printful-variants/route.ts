import { NextResponse } from 'next/server'
import { getPrintfulClient } from '@/lib/printful'

export async function GET() {
  try {
    const client = getPrintfulClient()
    
    console.log('Getting available T-shirt variants...')
    
    // Get catalog products
    const unisexProducts = await client.getCatalogProducts('Gildan 64000')
    const womenProducts = await client.getCatalogProducts('Bella + Canvas 6400')
    const allProducts = [...unisexProducts, ...womenProducts]
    console.log(`Found ${allProducts.length} products`)
    
    // Filter for T-shirt products
    const tshirtProducts = allProducts.filter(p => {
      const name = p.name?.toLowerCase() || ''
      const brand = p.brand?.toLowerCase() || ''
      const model = p.model?.toLowerCase() || ''
      return name.includes('t-shirt') || 
             name.includes('tee') ||
             name.includes('shirt') ||
             name.includes('gildan') ||
             name.includes('bella') ||
             brand.includes('gildan') ||
             brand.includes('bella') ||
             model.includes('64000') ||
             model.includes('6400')
    })
    
    console.log(`Found ${tshirtProducts.length} T-shirt products`)
    
    // Get variants for each T-shirt product
    const variantsInfo = []
    
    for (const product of tshirtProducts.slice(0, 5)) { // Limit to first 5 products
      try {
        console.log(`Getting variants for product: ${product.name} (ID: ${product.id})`)
        const { variants } = await client.getCatalogProduct(product.id)
        
        variantsInfo.push({
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model
          },
          variants: variants.slice(0, 3).map(v => ({ // Limit to first 3 variants
            id: v.id,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price,
            in_stock: v.in_stock
          }))
        })
      } catch (error) {
        console.error(`Failed to get variants for product ${product.id}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Available T-shirt variants',
      totalProducts: allProducts.length,
      tshirtProducts: tshirtProducts.length,
      variantsInfo,
      recommendedVariants: variantsInfo
        .flatMap(info => info.variants)
        .filter(v => v.in_stock)
        .slice(0, 10)
    })
    
  } catch (error) {
    console.error('Variants test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
