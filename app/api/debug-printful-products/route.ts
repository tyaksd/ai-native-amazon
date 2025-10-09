import { NextResponse } from 'next/server'
import { getPrintfulClient } from '@/lib/printful'

export async function GET() {
  try {
    console.log('=== Debug Printful Products ===')
    
    const client = getPrintfulClient()
    
    // Get catalog products using search
    console.log('Fetching catalog products from Printful...')
    const unisexProducts = await client.getCatalogProducts('Gildan 64000')
    const womenProducts = await client.getCatalogProducts('Bella + Canvas 6400')
    const allProducts = [...unisexProducts, ...womenProducts]
    
    console.log(`Found ${allProducts.length} total products`)
    
    // Filter for T-shirt products
    const tshirtProducts = allProducts.filter(product => {
      const name = product.name?.toLowerCase() || ''
      return name.includes('t-shirt') || 
             name.includes('tee') ||
             name.includes('shirt') ||
             name.includes('gildan') ||
             name.includes('bella')
    })
    
    console.log(`Found ${tshirtProducts.length} T-shirt products`)
    
    // Test getting variants for each T-shirt product
    const productDetails = []
    
    for (const product of tshirtProducts.slice(0, 3)) { // Test first 3 products
      try {
        console.log(`\nTesting product: ${product.name} (ID: ${product.id})`)
        const { variants } = await client.getCatalogProduct(product.id)
        
        productDetails.push({
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model
          },
          variants: variants.slice(0, 5).map(v => ({ // First 5 variants
            id: v.id,
            size: v.size,
            color: v.color,
            in_stock: v.in_stock,
            price: v.price
          })),
          totalVariants: variants.length
        })
        
        console.log(`✅ Product ${product.id} has ${variants.length} variants`)
        
      } catch (error) {
        console.error(`❌ Failed to get variants for product ${product.id}:`, error)
        productDetails.push({
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          variants: []
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Printful products debug completed',
      summary: {
        totalProducts: allProducts.length,
        tshirtProducts: tshirtProducts.length,
        testedProducts: productDetails.length
      },
      allProducts: allProducts.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        type: p.type
      })),
      tshirtProducts: tshirtProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model
      })),
      productDetails
    })
    
  } catch (error) {
    console.error('❌ Printful products debug failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
