// Get Printful Variants using API v1
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    // Get products from Printful API v1
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${printfulApiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Filter for T-shirt products (more specific search)
    const tshirtProducts = data.result?.filter((product: any) => 
      product.name?.toLowerCase().includes('t-shirt') || 
      product.name?.toLowerCase().includes('tee') ||
      product.name?.toLowerCase().includes('shirt') ||
      product.name?.toLowerCase().includes('gildan') ||
      product.name?.toLowerCase().includes('bella') ||
      product.name?.toLowerCase().includes('unisex')
    ) || []

    // Get variants for each T-shirt product
    const variantsInfo = []
    for (const product of tshirtProducts.slice(0, 3)) { // Limit to first 3 products
      try {
        const variantResponse = await fetch(`https://api.printful.com/products/${product.id}`, {
          headers: {
            'Authorization': `Bearer ${printfulApiKey}`
          }
        })
        
        if (variantResponse.ok) {
          const variantData = await variantResponse.json()
          const variants = variantData.result?.variants || []
          
          variantsInfo.push({
            productId: product.id,
            productName: product.name,
            variants: variants.slice(0, 10).map((v: any) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              price: v.price,
              in_stock: v.in_stock
            }))
          })
        }
      } catch (error) {
        console.error(`Error fetching variants for product ${product.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Printful variants retrieved successfully',
      totalProducts: data.result?.length || 0,
      tshirtProducts: tshirtProducts.length,
      variantsInfo
    })

  } catch (error) {
    console.error('Error fetching Printful variants:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
