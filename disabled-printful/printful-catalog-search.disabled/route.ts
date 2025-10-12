// Printfulカタログ検索API
import { NextRequest, NextResponse } from 'next/server'
import { PrintfulCatalogClient } from '@/lib/printful-catalog'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const searchTerm = searchParams.get('search') || 'Gildan 64000'
    const productId = searchParams.get('product_id')

    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    const catalogClient = new PrintfulCatalogClient(printfulApiKey)

    if (productId) {
      // 特定の商品の詳細を取得
      const product = await catalogClient.getProductDetails(parseInt(productId))
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const variants = await catalogClient.getProductVariants(parseInt(productId))
      const options = await catalogClient.getAvailableOptions(parseInt(productId))

      return NextResponse.json({
        success: true,
        product,
        variants: Array.isArray(variants) ? variants.slice(0, 20) : [], // 最初の20個のバリエーション
        options,
        totalVariants: Array.isArray(variants) ? variants.length : 0
      })
    } else {
      // 商品を検索
      const products = await catalogClient.searchProducts(searchTerm)
      
      return NextResponse.json({
        success: true,
        searchTerm,
        products: Array.isArray(products) ? products.slice(0, 10) : [], // 最初の10個の商品
        totalProducts: Array.isArray(products) ? products.length : 0
      })
    }

  } catch (error) {
    console.error('Catalog search error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, size, color } = await req.json()

    if (!productId || !size || !color) {
      return NextResponse.json({ 
        error: 'productId, size, and color are required' 
      }, { status: 400 })
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    const catalogClient = new PrintfulCatalogClient(printfulApiKey)
    const variantId = await catalogClient.getVariantId(productId, size, color)

    if (!variantId) {
      return NextResponse.json({ 
        error: `Variant not found for ${size} ${color}` 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      productId,
      size,
      color,
      variantId
    })

  } catch (error) {
    console.error('Variant ID lookup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
