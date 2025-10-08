import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, calculateDesignPosition } from '@/lib/printful'

export async function POST(req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    console.log('Creating Printful product with design...')
    
    // Design file information
    const designFileId = 883979669
    const designUrl = 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'
    
    // Calculate design position
    const designPosition = calculateDesignPosition(1000, 1000, 'unisex')
    console.log('Design position:', designPosition)
    
    // Create product data in Printful API format
    const productData = {
      sync_product: {
        name: 'Rebel Mark Graphic Tee',
        thumbnail: designUrl
      },
      sync_variants: [
        {
          variant_id: 71, // Gildan 64000 variant ID
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
    
    console.log('Product data:', JSON.stringify(productData, null, 2))
    
    // Try to create the product
    try {
      // Create the actual product in Printful
      console.log('Creating real product in Printful...')
      console.log('- External ID:', productData.external_id)
      console.log('- Name:', productData.name)
      console.log('- Design file ID:', designFileId)
      console.log('- Position:', designPosition)
      
      const createdProduct = await client.createProduct(productData)
      console.log('Product created successfully:', createdProduct.id)
      
      return NextResponse.json({
        success: true,
        message: 'Product created successfully in Printful',
        product: createdProduct,
        designInfo: {
          fileId: designFileId,
          url: designUrl,
          position: designPosition,
          dimensions: '1000x1000 pixels'
        },
        nextSteps: [
          '1. Check Printful dashboard for the created product',
          '2. Verify the design positioning on the T-shirt',
          '3. Test the product in mockup generator if needed'
        ]
      })
      
    } catch (creationError) {
      console.error('Product creation error:', creationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create product',
        details: creationError instanceof Error ? creationError.message : 'Unknown error',
        fallback: {
          designFileId,
          designUrl,
          position: designPosition,
          note: 'Product creation failed, but design positioning is ready'
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Product creation test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
