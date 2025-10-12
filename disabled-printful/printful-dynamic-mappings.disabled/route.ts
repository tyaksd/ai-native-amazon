// 動的variant ID取得によるマッピング生成API
import { NextRequest, NextResponse } from 'next/server'
import { PrintfulCatalogClient } from '@/lib/printful-catalog'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 標準的なサイズと色の組み合わせ
const STANDARD_SIZES = ['S', 'M', 'L', 'XL']
const STANDARD_COLORS = ['BLACK', 'WHITE', 'NAVY']

export async function POST(req: NextRequest) {
  try {
    const { 
      product_ids, 
      search_term = 'Gildan 64000',
      clear_existing = false 
    } = await req.json()

    if (!product_ids || !Array.isArray(product_ids)) {
      return NextResponse.json({ 
        success: false, 
        error: 'product_ids array is required' 
      }, { status: 400 })
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    const catalogClient = new PrintfulCatalogClient(printfulApiKey)

    console.log(`Starting dynamic mapping generation for ${product_ids.length} products`)

    // Gildan 64000を検索
    console.log(`Searching for: ${search_term}`)
    const gildanProduct = await catalogClient.findGildan64000()
    
    if (!gildanProduct) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gildan 64000 product not found in Printful catalog' 
      }, { status: 404 })
    }

    console.log(`Found Gildan 64000: ${gildanProduct.name} (ID: ${gildanProduct.id})`)

    // 利用可能なオプションを確認
    const options = await catalogClient.getAvailableOptions(gildanProduct.id)
    console.log(`Available sizes: ${options.sizes.join(', ')}`)
    console.log(`Available colors: ${options.colors.join(', ')}`)

    // 既存のマッピングをクリア（オプション）
    if (clear_existing) {
      const { error: deleteError } = await supabaseAdmin
        .from('printful_variant_mappings')
        .delete()
        .in('product_id', product_ids)
      
      if (deleteError) {
        console.error('Error clearing existing mappings:', deleteError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to clear existing mappings' 
        }, { status: 500 })
      }
      console.log('Cleared existing mappings')
    }

    // 動的にvariant IDを取得してマッピングを作成
    const mappings = []
    const errors = []

    for (const productId of product_ids) {
      console.log(`Processing product: ${productId}`)
      
      for (const size of STANDARD_SIZES) {
        for (const color of STANDARD_COLORS) {
          try {
            const variantId = await catalogClient.getVariantId(gildanProduct.id, size, color)
            
            if (variantId) {
              mappings.push({
                product_id: productId,
                size,
                color,
                printful_variant_id: variantId,
                printful_product_id: gildanProduct.id
              })
              console.log(`✅ ${size} ${color}: ${variantId}`)
            } else {
              errors.push(`${productId}: ${size} ${color} - variant not found`)
              console.warn(`❌ ${size} ${color}: not found`)
            }
          } catch (error) {
            const errorMsg = `${productId}: ${size} ${color} - ${error instanceof Error ? error.message : 'Unknown error'}`
            errors.push(errorMsg)
            console.error(`❌ ${errorMsg}`)
          }
        }
      }
    }

    if (mappings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid mappings could be created',
        errors 
      }, { status: 400 })
    }

    console.log(`Creating ${mappings.length} mappings`)

    // 一括挿入
    const { data, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .upsert(mappings, { 
        onConflict: 'product_id,size,color',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error creating dynamic mappings:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create mappings' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created dynamic mappings for ${product_ids.length} products`,
      gildanProduct: {
        id: gildanProduct.id,
        name: gildanProduct.name
      },
      totalMappings: mappings.length,
      productsProcessed: product_ids.length,
      mappingsPerProduct: mappings.length / product_ids.length,
      errors: errors.length > 0 ? errors : undefined,
      availableOptions: {
        sizes: options.sizes,
        colors: options.colors
      }
    })

  } catch (error) {
    console.error('Dynamic mapping creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const searchTerm = searchParams.get('search') || 'Gildan 64000'

    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json({ error: 'Printful API key not found' }, { status: 500 })
    }

    const catalogClient = new PrintfulCatalogClient(printfulApiKey)

    // Gildan 64000を検索
    const gildanProduct = await catalogClient.findGildan64000()
    
    if (!gildanProduct) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gildan 64000 product not found' 
      }, { status: 404 })
    }

    // 利用可能なオプションを取得
    const options = await catalogClient.getAvailableOptions(gildanProduct.id)

    return NextResponse.json({
      success: true,
      product: gildanProduct,
      availableOptions: options,
      standardSizes: STANDARD_SIZES,
      standardColors: STANDARD_COLORS
    })

  } catch (error) {
    console.error('Dynamic mapping info error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
