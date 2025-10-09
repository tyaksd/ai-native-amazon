// Populate Printful Variant Mappings API
import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulV2Client } from '@/lib/printful-v2'
import { batchCreateVariantMappings, VariantMappingInput } from '@/lib/printful-variant-mapping'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/printful-populate-mappings
 * Populate variant mappings for all products
 */
export async function POST(req: NextRequest) {
  try {
    console.log('=== Populating Printful Variant Mappings ===')

    // Get all products from database
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, gender, design_png')

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found',
        mappings: []
      })
    }

    console.log(`Found ${products.length} products to process`)

    const client = getPrintfulV2Client()
    const allMappings: VariantMappingInput[] = []

    // Process each product
    for (const product of products) {
      console.log(`Processing product: ${product.name} (${product.id})`)

      try {
        const gender = product.gender || 'unisex'
        const searchTerm = gender === 'women' ? 'Bella + Canvas 6400' : 'Gildan 64000'
        
        // Get catalog products
        const catalogProducts = await client.getCatalogProducts(searchTerm)
        const tshirtProduct = catalogProducts?.find(p => 
          p.name?.toLowerCase().includes('t-shirt') || 
          p.name?.toLowerCase().includes('tee')
        )

        if (!tshirtProduct) {
          console.warn(`No T-shirt product found for gender: ${gender}`)
          continue
        }

        // Get product details and variants
        const productDetails = await client.getCatalogProduct(tshirtProduct.id)
        const variants = productDetails?.variants || []
        
        if (!variants || variants.length === 0) {
          console.warn(`No variants found for product: ${tshirtProduct.id}`)
          continue
        }

        console.log(`Found ${variants.length} variants for ${tshirtProduct.name}`)

        // Create mappings for common sizes and colors
        const commonSizes = ['S', 'M', 'L', 'XL', 'XXL']
        const commonColors = ['BLACK', 'WHITE', 'NAVY', 'RED', 'GREEN', 'BLUE']

        for (const size of commonSizes) {
          for (const color of commonColors) {
            // Find matching variant
            let matchingVariant = variants.find(v => 
              v.size === size && v.color === color
            )

            // Try case-insensitive matching
            if (!matchingVariant) {
              matchingVariant = variants.find(v => 
                v.size?.toLowerCase() === size.toLowerCase() && 
                v.color?.toLowerCase() === color.toLowerCase()
              )
            }

            // Try partial color matching
            if (!matchingVariant) {
              matchingVariant = variants.find(v => 
                v.size === size && 
                v.color?.toLowerCase().includes(color.toLowerCase())
              )
            }

            if (matchingVariant) {
              allMappings.push({
                product_id: product.id,
                size,
                color,
                printful_variant_id: matchingVariant.id,
                printful_product_id: tshirtProduct.id
              })
              console.log(`✅ Mapped ${size}/${color} -> ${matchingVariant.id}`)
            } else {
              console.log(`❌ No variant found for ${size}/${color}`)
            }
          }
        }

      } catch (error) {
        console.error(`Failed to process product ${product.id}:`, error)
        continue
      }
    }

    // Batch create all mappings
    if (allMappings.length > 0) {
      console.log(`Creating ${allMappings.length} mappings...`)
      const createdMappings = await batchCreateVariantMappings(allMappings)
      
      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdMappings.length} variant mappings`,
        mappings: createdMappings,
        stats: {
          totalProducts: products.length,
          totalMappings: createdMappings.length,
          mappingsPerProduct: Math.round(createdMappings.length / products.length)
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No mappings created',
        mappings: []
      })
    }

  } catch (error) {
    console.error('Error populating variant mappings:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/printful-populate-mappings
 * Get mapping statistics
 */
export async function GET() {
  try {
    const { data: mappings, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('product_id, size, color, printful_variant_id')

    if (error) {
      throw new Error(`Failed to fetch mappings: ${error.message}`)
    }

    const stats = {
      totalMappings: mappings?.length || 0,
      uniqueProducts: new Set(mappings?.map(m => m.product_id) || []).size,
      sizeDistribution: mappings?.reduce((acc, m) => {
        acc[m.size] = (acc[m.size] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      colorDistribution: mappings?.reduce((acc, m) => {
        acc[m.color] = (acc[m.color] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }

    return NextResponse.json({
      success: true,
      stats,
      mappings: mappings?.slice(0, 10) // Return first 10 for preview
    })
  } catch (error) {
    console.error('Error fetching mapping statistics:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
