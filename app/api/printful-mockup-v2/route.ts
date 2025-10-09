import { NextResponse } from 'next/server'
import { getPrintfulV2Client } from '@/lib/printful-v2'

export async function POST(req: Request) {
  try {
    const { productId, variantIds, designUrl, placement = 'front' } = await req.json()
    
    if (!productId || !variantIds || !designUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: productId, variantIds, designUrl'
      }, { status: 400 })
    }

    const client = getPrintfulV2Client()
    
    console.log('Creating mockup with API v2...')
    console.log('Product ID:', productId)
    console.log('Variant IDs:', variantIds)
    console.log('Design URL:', designUrl)
    console.log('Placement:', placement)

    // Step 1: Get product print files to understand available placements
    console.log('Getting product print files...')
    const printfiles = await client.getProductPrintfiles(productId)
    console.log('Available placements:', printfiles.available_placements)
    console.log('Print files:', printfiles.printfiles)

    // Step 2: Get layout templates for better positioning
    console.log('Getting layout templates...')
    const templates = await client.getLayoutTemplates(productId)
    console.log('Layout templates found:', templates.templates.length)

    // Step 3: Create mockup generation task
    console.log('Creating mockup generation task...')
    const mockupTask = await client.createMockupTask(
      productId,
      variantIds,
      [{
        placement,
        image_url: designUrl
      }],
      {
        format: 'jpg',
        width: 1000,
        dpi: 150
      }
    )

    console.log('Mockup task created:', mockupTask.task_key)
    console.log('Status:', mockupTask.status)

    // Step 4: Poll for completion (in real implementation, use webhooks or background job)
    let attempts = 0
    const maxAttempts = 30 // 5 minutes max
    let finalResult = mockupTask

    while (attempts < maxAttempts && finalResult.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      attempts++
      
      console.log(`Checking mockup status (attempt ${attempts}/${maxAttempts})...`)
      finalResult = await client.getMockupTaskResult(mockupTask.task_key)
      console.log('Status:', finalResult.status)
    }

    if (finalResult.status === 'failed') {
      return NextResponse.json({
        success: false,
        error: 'Mockup generation failed',
        details: finalResult.error
      }, { status: 500 })
    }

    if (finalResult.status === 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Mockup generation timed out',
        taskKey: mockupTask.task_key,
        message: 'Check status later using the task key'
      }, { status: 408 })
    }

    // Step 5: Return successful mockup results
    return NextResponse.json({
      success: true,
      message: 'Mockup generated successfully',
      taskKey: mockupTask.task_key,
      mockups: finalResult.mockups,
      productInfo: {
        productId,
        availablePlacements: printfiles.available_placements,
        printFiles: printfiles.printfiles,
        layoutTemplates: templates.templates.length
      },
      instructions: [
        '1. Mockup images are ready for use',
        '2. Use the image URLs in your product listings',
        '3. Consider caching the results for better performance'
      ]
    })

  } catch (error) {
    console.error('Mockup generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const taskKey = searchParams.get('taskKey')
    
    if (!taskKey) {
      return NextResponse.json({
        success: false,
        error: 'taskKey parameter is required'
      }, { status: 400 })
    }

    const client = getPrintfulV2Client()
    
    console.log('Checking mockup task status:', taskKey)
    const result = await client.getMockupTaskResult(taskKey)
    
    return NextResponse.json({
      success: true,
      taskKey,
      status: result.status,
      mockups: result.mockups,
      error: result.error
    })

  } catch (error) {
    console.error('Mockup status check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
