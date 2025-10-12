// 全商品の自動マッピング生成API
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 標準的なサイズと色の組み合わせ
const STANDARD_SIZES = ['S', 'M', 'L', 'XL']
const STANDARD_COLORS = ['BLACK', 'WHITE', 'NAVY']

// Gildan 64000のvariant IDマッピング
const GILDAN_64000_VARIANTS = {
  'S_BLACK': 4011,
  'M_BLACK': 4012,
  'L_BLACK': 4013,
  'XL_BLACK': 4014,
  'S_WHITE': 4015,
  'M_WHITE': 4016,
  'L_WHITE': 4017,
  'XL_WHITE': 4018,
  'S_NAVY': 4019,
  'M_NAVY': 4020,
  'L_NAVY': 4021,
  'XL_NAVY': 4022,
}

export async function POST(req: NextRequest) {
  try {
    const { 
      printful_product_id = 71, 
      clear_existing = false,
      gender_filter = null // 'unisex', 'women', 'men' または null (全商品)
    } = await req.json()

    console.log('Starting auto-mapping generation for all products')

    // 商品を取得
    let query = supabaseAdmin
      .from('products')
      .select('id, name, gender')

    if (gender_filter) {
      query = query.eq('gender', gender_filter)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch products' 
      }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No products found' 
      }, { status: 404 })
    }

    console.log(`Found ${products.length} products to process`)

    // 既存のマッピングをクリア（オプション）
    if (clear_existing) {
      const productIds = products.map(p => p.id)
      const { error: deleteError } = await supabaseAdmin
        .from('printful_variant_mappings')
        .delete()
        .in('product_id', productIds)
      
      if (deleteError) {
        console.error('Error clearing existing mappings:', deleteError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to clear existing mappings' 
        }, { status: 500 })
      }
      console.log('Cleared existing mappings')
    }

    // 一括でマッピングを作成
    const mappings = []
    
    for (const product of products) {
      for (const size of STANDARD_SIZES) {
        for (const color of STANDARD_COLORS) {
          const variantKey = `${size}_${color}`
          const printfulVariantId = GILDAN_64000_VARIANTS[variantKey as keyof typeof GILDAN_64000_VARIANTS]
          
          if (printfulVariantId) {
            mappings.push({
              product_id: product.id,
              size,
              color,
              printful_variant_id: printfulVariantId,
              printful_product_id
            })
          }
        }
      }
    }

    console.log(`Creating ${mappings.length} mappings for ${products.length} products`)

    // バッチ処理で一括挿入（大量データの場合）
    const batchSize = 1000
    const batches = []
    
    for (let i = 0; i < mappings.length; i += batchSize) {
      batches.push(mappings.slice(i, i + batchSize))
    }

    let totalInserted = 0
    const errors = []

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} mappings)`)
      
      const { data, error } = await supabaseAdmin
        .from('printful_variant_mappings')
        .upsert(batch, { 
          onConflict: 'product_id,size,color',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error(`Error in batch ${i + 1}:`, error)
        errors.push({ batch: i + 1, error: error.message })
      } else {
        totalInserted += batch.length
      }
    }

    if (errors.length > 0) {
      console.warn(`Completed with ${errors.length} batch errors`)
    }

    return NextResponse.json({
      success: true,
      message: `Auto-mapping generation completed`,
      totalProducts: products.length,
      totalMappings: mappings.length,
      totalInserted,
      mappingsPerProduct: mappings.length / products.length,
      batchErrors: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Auto-mapping generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // 統計情報を取得
    const { data: stats, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('product_id')
      .then(({ data, error }) => {
        if (error) throw error
        return supabaseAdmin
          .from('products')
          .select('id, name, gender')
          .in('id', [...new Set(data?.map(m => m.product_id) || [])])
      })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch stats' 
      }, { status: 500 })
    }

    const { data: mappingCount, error: countError } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch mapping count' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalMappings: mappingCount?.length || 0,
      productsWithMappings: stats?.length || 0,
      products: stats || []
    })

  } catch (error) {
    console.error('Auto-mapping stats error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
