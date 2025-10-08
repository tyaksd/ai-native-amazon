import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient } from '@/lib/printful'

export async function POST(req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    // Manual position adjustments based on Mockup Generator testing
    const manualPositions = {
      unisex: {
        area_width: 3000,
        area_height: 3000,
        width: 1000,
        height: 1000,
        top: 1200,    // Manually adjusted from 1000
        left: 1000    // Keep centered horizontally
      },
      women: {
        area_width: 2800,
        area_height: 2800,
        width: 1000,
        height: 1000,
        top: 1100,    // Manually adjusted from 900
        left: 900     // Keep centered horizontally
      }
    }
    
    console.log('Manual position adjustments:')
    console.log('Unisex:', manualPositions.unisex)
    console.log('Women:', manualPositions.women)
    
    // Create product with manually adjusted positions
    const designUrl = 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'
    
    const productData = {
      sync_product: {
        name: 'Rebel Mark Graphic Tee - Manual Position',
        thumbnail: designUrl,
        description: 'T-shirt with manually adjusted design positioning'
      },
      sync_variants: [
        {
          variant_id: 1,
          retail_price: '29.99',
          files: [
            {
              type: 'default',
              url: designUrl,
              position: manualPositions.unisex
            }
          ]
        }
      ]
    }
    
    console.log('Creating product with manual position adjustments...')
    const createdProduct = await client.createProduct(productData)
    
    return NextResponse.json({
      success: true,
      message: 'Product created with manual position adjustments',
      product: createdProduct,
      positionComparison: {
        automatic: {
          unisex: { top: 1000, left: 1000 },
          women: { top: 900, left: 900 }
        },
        manual: {
          unisex: { top: 1200, left: 1000 },
          women: { top: 1100, left: 900 }
        },
        adjustments: {
          unisex: { top: '+200', left: '0' },
          women: { top: '+200', left: '0' }
        }
      },
      instructions: [
        '1. Compare the new product with the previous one',
        '2. Check which positioning looks better on the T-shirt',
        '3. Use the better positioning in your main code',
        '4. Update calculateDesignPosition function with optimal values'
      ],
      nextSteps: [
        'Update lib/printful.ts with the optimal position values',
        'Test with different T-shirt types',
        'Fine-tune based on visual feedback'
      ]
    })
    
  } catch (error) {
    console.error('Position sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
