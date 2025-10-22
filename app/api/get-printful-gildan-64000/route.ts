import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('🔍 Getting Gildan 64000 Product and Variant Information...')
    
    const apiKey = process.env.PRINTFUL_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PRINTFUL_API_KEY not found in environment variables',
        message: 'Please set PRINTFUL_API_KEY in your environment variables'
      }, { status: 500 })
    }

    // Step 1: Get all products to find Gildan 64000
    console.log('📦 Fetching all products from Printful catalog...')
    const productsResponse = await fetch('https://api.printful.com/catalog/products', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text()
      console.error('❌ Products API error:', productsResponse.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Products API error: ${productsResponse.status}`,
        details: errorText
      }, { status: productsResponse.status })
    }

    const productsData = await productsResponse.json()
    console.log(`✅ Found ${productsData.result?.length || 0} products`)

    // Find Gildan 64000 products
    const gildanProducts = productsData.result?.filter((product: any) => 
      product.name?.toLowerCase().includes('gildan') && 
      product.name?.toLowerCase().includes('64000')
    ) || []

    console.log(`🔍 Found ${gildanProducts.length} Gildan 64000 products`)

    if (gildanProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Gildan 64000 product not found',
        message: 'No Gildan 64000 products found in Printful catalog'
      }, { status: 404 })
    }

    // Get the first Gildan 64000 product
    const gildanProduct = gildanProducts[0]
    console.log(`📋 Gildan 64000 Product Details:`, {
      id: gildanProduct.id,
      name: gildanProduct.name,
      brand: gildanProduct.brand,
      model: gildanProduct.model,
      variant_count: gildanProduct.variant_count,
      price: gildanProduct.price,
      in_stock: gildanProduct.in_stock
    })

    // Step 2: Get all variants for Gildan 64000
    console.log(`🔍 Fetching all variants for Gildan 64000 (Product ID: ${gildanProduct.id})...`)
    const variantsResponse = await fetch(`https://api.printful.com/catalog/products/${gildanProduct.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!variantsResponse.ok) {
      const errorText = await variantsResponse.text()
      console.error('❌ Variants API error:', variantsResponse.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Variants API error: ${variantsResponse.status}`,
        details: errorText
      }, { status: variantsResponse.status })
    }

    const variantsData = await variantsResponse.json()
    const variants = variantsData.result?.variants || []
    console.log(`✅ Found ${variants.length} variants for Gildan 64000`)

    // Organize variants by size and color
    const variantsBySize = variants.reduce((acc: any, variant: any) => {
      const size = variant.size || 'Unknown'
      if (!acc[size]) acc[size] = []
      acc[size].push({
        id: variant.id,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        color_code: variant.color_code,
        price: variant.price,
        in_stock: variant.in_stock
      })
      return acc
    }, {})

    // Get unique colors
    const uniqueColors = [...new Set(variants.map((v: any) => v.color).filter(Boolean))]
    const uniqueSizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))]

    return NextResponse.json({
      success: true,
      message: 'Gildan 64000 Product and Variant Information Retrieved',
      data: {
        product: {
          id: gildanProduct.id,
          name: gildanProduct.name,
          brand: gildanProduct.brand,
          model: gildanProduct.model,
          variant_count: gildanProduct.variant_count,
          price: gildanProduct.price,
          in_stock: gildanProduct.in_stock
        },
        variants: variants.map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          size: variant.size,
          color: variant.color,
          color_code: variant.color_code,
          price: variant.price,
          in_stock: variant.in_stock
        })),
        variantsBySize,
        uniqueColors: uniqueColors.sort(),
        uniqueSizes: uniqueSizes.sort(),
        totalVariants: variants.length,
        // Common size/color combinations for easy reference
        commonCombinations: variants
          .filter((v: any) => ['S', 'M', 'L', 'XL'].includes(v.size) && ['Black', 'White', 'Navy'].includes(v.color))
          .map((v: any) => ({
            size: v.size,
            color: v.color,
            variant_id: v.id,
            in_stock: v.in_stock
          }))
      }
    })

  } catch (error) {
    console.error('❌ Error getting Gildan 64000 information:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
