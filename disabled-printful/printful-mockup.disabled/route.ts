import { NextResponse } from 'next/server'
import { getPrintfulClient } from '@/lib/printful'

export async function GET() {
  try {
    const client = getPrintfulClient()
    
    console.log('Getting Printful mockup preview...')
    
    // Get the uploaded file details
    const fileId = 883979669 // From previous upload
    console.log('Checking file details for ID:', fileId)
    
    // Try to get file details (this might not be available in all Printful API versions)
    try {
      // Get catalog products to find T-shirt products
      const unisexProducts = await client.getCatalogProducts('Gildan 64000')
      const womenProducts = await client.getCatalogProducts('Bella + Canvas 6400')
      const tshirtProducts = [...unisexProducts, ...womenProducts].filter(p => 
        p.name?.toLowerCase().includes('t-shirt') || 
        p.name?.toLowerCase().includes('tee') ||
        p.name?.toLowerCase().includes('shirt')
      )
      
      console.log(`Found ${tshirtProducts.length} T-shirt products`)
      
      if (tshirtProducts.length > 0) {
        const selectedProduct = tshirtProducts[0]
        console.log(`Selected product: ${selectedProduct.name} (ID: ${selectedProduct.id})`)
        
        // Get variants for the selected product using catalog API
        const { variants } = await client.getCatalogProduct(selectedProduct.id)
        console.log(`Found ${variants?.length || 0} variants`)
        
        if (variants && variants.length > 0) {
          const selectedVariant = variants[0]
          console.log(`Selected variant: ${selectedVariant.name} - ${selectedVariant.size} ${selectedVariant.color}`)
          
          return NextResponse.json({
            success: true,
            message: 'T-shirt mockup information',
            product: {
              id: selectedProduct.id,
              name: selectedProduct.name,
              brand: selectedProduct.brand,
              model: selectedProduct.model,
              image: selectedProduct.image
            },
            variant: {
              id: selectedVariant.id,
              name: selectedVariant.name,
              size: selectedVariant.size,
              color: selectedVariant.color,
              image: selectedVariant.image
            },
            instructions: [
              '1. Go to Printful dashboard',
              '2. Navigate to "Files" section',
              '3. Find file ID: 883979669',
              '4. Click on the file to see preview',
              '5. Use the mockup generator to see on actual T-shirt',
              `6. Product to test: ${selectedProduct.name}`,
              `7. Variant: ${selectedVariant.size} ${selectedVariant.color}`
            ],
            directLinks: {
              printfulDashboard: 'https://www.printful.com/dashboard/default/files',
              mockupGenerator: 'https://www.printful.com/mockup-generator'
            }
          })
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'No T-shirt products found',
        instructions: [
          '1. Go to Printful dashboard',
          '2. Navigate to "Files" section', 
          '3. Find file ID: 883979669',
          '4. Click on the file to see preview'
        ]
      })
      
    } catch (apiError) {
      console.error('API error:', apiError)
      return NextResponse.json({
        success: false,
        error: 'Failed to get product details',
        fallbackInstructions: [
          '1. Go to Printful dashboard: https://www.printful.com/dashboard/default/files',
          '2. Find file ID: 883979669',
          '3. Click on the file to see preview',
          '4. Use Printful mockup generator to see on actual T-shirt'
        ]
      })
    }
    
  } catch (error) {
    console.error('Mockup test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: [
        'Manual check: Go to Printful dashboard > Files > Find file ID: 883979669'
      ]
    }, { status: 500 })
  }
}
