import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulClient, calculateDesignPosition, getImageDimensions } from '@/lib/printful'

export async function POST(_req: NextRequest) {
  try {
    const client = getPrintfulClient()
    
    // Test design URL
    const designUrl = 'https://res.cloudinary.com/dmoyeva1q/image/upload/v1759828276/Rebel%20Mark%20Graphic%20Tee-design.png'
    
    console.log('Testing design positioning and sizing...')
    
    // Get actual image dimensions
    const dimensions = await getImageDimensions(designUrl)
    console.log('Original image dimensions:', dimensions)
    
    // Calculate positions for different T-shirt types
    const unisexPosition = calculateDesignPosition(dimensions.width, dimensions.height, 'unisex')
    const womenPosition = calculateDesignPosition(dimensions.width, dimensions.height, 'women')
    
    console.log('Unisex T-shirt position:', unisexPosition)
    console.log('Women T-shirt position:', womenPosition)
    
    // Test file upload with position (this will create a preview in Printful)
    console.log('Uploading design file to Printful for preview...')
    
    try {
      const designFile = await client.uploadFileWithPosition(
        designUrl,
        'rebel_mark_design_preview.png',
        unisexPosition
      )
      
      console.log('Design file uploaded:', designFile.id)
      
      return NextResponse.json({
        success: true,
        message: 'Design uploaded to Printful for preview',
        originalDimensions: dimensions,
        calculatedPositions: {
          unisex: unisexPosition,
          women: womenPosition
        },
        uploadedFile: {
          id: designFile.id,
          url: designFile.url,
          position: designFile.position
        },
        previewUrl: designFile.preview_url,
        instructions: [
          '1. Check the preview_url in Printful dashboard',
          '2. Verify the design size and position',
          '3. Adjust position values if needed',
          '4. Test with different T-shirt types'
        ]
      })
      
    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Failed to upload design file',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        fallback: {
          originalDimensions: dimensions,
          calculatedPositions: {
            unisex: unisexPosition,
            women: womenPosition
          },
          note: 'Upload failed, but position calculations are available'
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Preview test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
