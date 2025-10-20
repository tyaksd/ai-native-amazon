import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 色の選択肢
const availableColors = [
  'black', 'white', 'gray', 'navy', 'olive', 'charcoal', 'beige', 'cream', 'brown', 'blue', 'pink', 'red', 'green', 'yellow', 'purple', 'orange'
]

// ランダムな色を選択する関数
function getRandomColor(): string {
  return availableColors[Math.floor(Math.random() * availableColors.length)]
}

// 既存のAI商品生成APIを呼び出す関数
async function generateAIProduct(brandId: string, productType: string, colors: string[], gender: string, quantity: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-ai-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandId,
        productType,
        colors,
        gender,
        quantity
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error calling AI product generation API:', error)
    throw error
  }
}

export async function POST(_request: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    console.log('Starting batch product generation for brands without products...')

    // 全てのブランドを取得
    const { data: allBrands, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .order('name')

    if (brandsError) {
      console.error('Error fetching brands:', brandsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch brands' },
        { status: 500 }
      )
    }

    if (!allBrands || allBrands.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No brands found' },
        { status: 404 }
      )
    }

    console.log(`Found ${allBrands.length} total brands`)

    // 各ブランドの商品数を確認
    const brandsWithoutProducts = []
    
    for (const brand of allBrands) {
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('brand_id', brand.id)
        .limit(1)

      if (productsError) {
        console.error(`Error checking products for brand ${brand.name}:`, productsError)
        continue
      }

      if (!products || products.length === 0) {
        brandsWithoutProducts.push(brand)
        console.log(`Brand "${brand.name}" has no products`)
      }
    }

    console.log(`Found ${brandsWithoutProducts.length} brands without products`)

    if (brandsWithoutProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All brands already have products',
        generatedProducts: 0
      })
    }

    // 各ブランドに対して既存のAI商品生成APIを使用してTシャツを1つずつ生成
    const generatedProducts = []
    const errors = []

    for (const brand of brandsWithoutProducts) {
      try {
        console.log(`Generating product for brand: ${brand.name}`)
        
        // ランダムな色を選択
        const color = getRandomColor()
        
        // 既存のAI商品生成APIを呼び出し
        const result = await generateAIProduct(
          brand.id,
          'T-Shirt',
          [color],
          'Men',
          1
        )

        if (result.success && result.products && result.products.length > 0) {
          const product = result.products[0]
          console.log(`Successfully created product "${product.name}" for brand "${brand.name}"`)
          generatedProducts.push({
            brand: brand.name,
            product: product.name,
            color: color,
            price: product.price
          })
        } else {
          console.error(`Failed to generate product for brand ${brand.name}:`, result.error)
          errors.push({
            brand: brand.name,
            error: result.error || 'Failed to generate product'
          })
        }

      } catch (error) {
        console.error(`Error processing brand ${brand.name}:`, error)
        errors.push({
          brand: brand.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedProducts.length} products for brands without products`,
      generatedProducts: generatedProducts,
      errors: errors,
      totalProcessed: brandsWithoutProducts.length
    })

  } catch (error) {
    console.error('Error in batch product generation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
