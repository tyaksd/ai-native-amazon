// Printful Variant Mappings Management API
import { NextRequest, NextResponse } from 'next/server'
import { 
  getVariantMapping, 
  upsertVariantMapping, 
  getProductVariantMappings,
  clearProductMappings,
  VariantMappingInput 
} from '@/lib/printful-variant-mapping'

/**
 * GET /api/printful-variant-mappings
 * Get variant mappings for a product
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('product_id')
    const size = searchParams.get('size')
    const color = searchParams.get('color')

    if (productId && size && color) {
      // Get specific mapping
      const mapping = await getVariantMapping(productId, size, color)
      return NextResponse.json({
        success: true,
        mapping
      })
    } else if (productId) {
      // Get all mappings for product
      const mappings = await getProductVariantMappings(productId)
      return NextResponse.json({
        success: true,
        mappings
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'product_id is required'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching variant mappings:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/printful-variant-mappings
 * Create or update variant mapping
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product_id, size, color, printful_variant_id, printful_product_id } = body

    if (!product_id || !size || !color || !printful_variant_id || !printful_product_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: product_id, size, color, printful_variant_id, printful_product_id'
      }, { status: 400 })
    }

    const mappingInput: VariantMappingInput = {
      product_id,
      size,
      color,
      printful_variant_id,
      printful_product_id
    }

    const mapping = await upsertVariantMapping(mappingInput)

    if (!mapping) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create/update mapping'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mapping
    })
  } catch (error) {
    console.error('Error creating variant mapping:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/printful-variant-mappings
 * Clear mappings for a product
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'product_id is required'
      }, { status: 400 })
    }

    const success = await clearProductMappings(productId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to clear mappings'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Cleared all mappings for product ${productId}`
    })
  } catch (error) {
    console.error('Error clearing variant mappings:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
