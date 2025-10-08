import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, calculateDesignPosition } from '@/lib/printful'

export async function POST(_req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    console.log('Creating simple product with design...')
    
    // Design information
    const designUrl = 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'
    const designPosition = calculateDesignPosition(1000, 1000, 'unisex')
    
    console.log('Design position:', designPosition)
    
    // Try different variant IDs that might be available
    const possibleVariantIds = [71, 1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    
    for (const variantId of possibleVariantIds) {
      try {
        console.log(`Trying variant ID: ${variantId}`)
        
        const productData = {
          sync_product: {
            name: `Rebel Mark Graphic Tee - Test ${variantId}`,
            thumbnail: designUrl
          },
          sync_variants: [
            {
              variant_id: variantId,
              retail_price: '25.00',
              files: [
                {
                  type: 'default',
                  url: designUrl,
                  position: designPosition
                }
              ]
            }
          ]
        }
        
        console.log('Attempting to create product with variant ID:', variantId)
        const createdProduct = await client.createProduct(productData)
        
        console.log('✅ Product created successfully!')
        console.log('Product ID:', createdProduct.id)
        
        return NextResponse.json({
          success: true,
          message: 'Product created successfully!',
          product: createdProduct,
          variantId,
          designInfo: {
            url: designUrl,
            position: designPosition
          },
          nextSteps: [
            '1. Check Printful dashboard for the created product',
            '2. Verify the design positioning',
            '3. Test the product in mockup generator'
          ]
        })
        
      } catch (error) {
        console.log(`❌ Variant ID ${variantId} failed:`, error instanceof Error ? error.message : 'Unknown error')
        continue
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'No working variant ID found',
      message: 'Tried multiple variant IDs but none worked',
      designInfo: {
        url: designUrl,
        position: designPosition
      },
      suggestion: 'Check Printful dashboard for available products and their variant IDs'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
