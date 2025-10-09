// 一括でバリアントマッピングを生成するAPI
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 標準的なサイズと色の組み合わせ
const STANDARD_SIZES = ['S', 'M', 'L', 'XL']
const STANDARD_COLORS = ['BLACK', 'WHITE', 'NAVY']

// Gildan 64000のvariant IDマッピング（実際のIDに置き換えてください）
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
    const { product_ids, printful_product_id = 71, clear_existing = false } = await req.json()

    if (!product_ids || !Array.isArray(product_ids)) {
      return NextResponse.json({ 
        success: false, 
        error: 'product_ids array is required' 
      }, { status: 400 })
    }

    console.log(`Creating bulk mappings for ${product_ids.length} products`)

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
    }

    // 一括でマッピングを作成
    const mappings = []
    
    for (const productId of product_ids) {
      for (const size of STANDARD_SIZES) {
        for (const color of STANDARD_COLORS) {
          const variantKey = `${size}_${color}`
          const printfulVariantId = GILDAN_64000_VARIANTS[variantKey as keyof typeof GILDAN_64000_VARIANTS]
          
          if (printfulVariantId) {
            mappings.push({
              product_id: productId,
              size,
              color,
              printful_variant_id: printfulVariantId,
              printful_product_id
            })
          }
        }
      }
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
      console.error('Error creating bulk mappings:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create mappings' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created mappings for ${product_ids.length} products`,
      totalMappings: mappings.length,
      productsProcessed: product_ids.length,
      mappingsPerProduct: mappings.length / product_ids.length
    })

  } catch (error) {
    console.error('Bulk mapping creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'product_id is required' 
      }, { status: 400 })
    }

    // 商品のマッピング数を確認
    const { data: mappings, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('*')
      .eq('product_id', productId)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch mappings' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      productId,
      totalMappings: mappings?.length || 0,
      mappings: mappings || []
    })

  } catch (error) {
    console.error('Bulk mapping fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
