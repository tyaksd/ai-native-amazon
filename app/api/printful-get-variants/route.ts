// Get specific product variants from Printful
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('product_id') || '71' // Gildan 64000 default
    
    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    console.log(`Fetching variants for product ID: ${productId}`)

    // Get product details with variants
    const response = await fetch(`https://api.printful.com/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${printfulApiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const product = data.result
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Extract variants
    const variants = product.variants || []
    
    // Group variants by size and color for easier reading
    const variantGroups = variants.reduce((acc: any, variant: any) => {
      const key = `${variant.size}_${variant.color}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        in_stock: variant.in_stock,
        availability_regions: variant.availability_regions
      })
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        brand: product.brand,
        model: product.model
      },
      totalVariants: variants.length,
      variants: variants.slice(0, 20), // First 20 variants
      variantGroups: Object.keys(variantGroups).slice(0, 10).reduce((acc: any, key: string) => {
        acc[key] = variantGroups[key]
        return acc
      }, {}),
      commonSizes: [...new Set(variants.map((v: any) => v.size))].sort(),
      commonColors: [...new Set(variants.map((v: any) => v.color))].sort()
    })

  } catch (error) {
    console.error('Error fetching Printful variants:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
