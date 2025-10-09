import { NextResponse } from 'next/server'
import { calculateDesignPosition } from '@/lib/printful'

export async function GET() {
  try {
    // Test different design sizes and T-shirt types
    const testCases = [
      {
        name: 'Square Design (1000x1000)',
        width: 1000,
        height: 1000,
        tshirtType: 'unisex' as const
      },
      {
        name: 'Wide Design (1500x1000)',
        width: 1500,
        height: 1000,
        tshirtType: 'unisex' as const
      },
      {
        name: 'Tall Design (1000x1500)',
        width: 1000,
        height: 1500,
        tshirtType: 'unisex' as const
      },
      {
        name: 'Large Design (2000x2000)',
        width: 2000,
        height: 2000,
        tshirtType: 'unisex' as const
      },
      {
        name: 'Square Design on Women T-shirt',
        width: 1000,
        height: 1000,
        tshirtType: 'women' as const
      }
    ]
    
    const results = testCases.map(testCase => {
      const position = calculateDesignPosition(
        testCase.width, 
        testCase.height, 
        testCase.tshirtType
      )
      
      return {
        ...testCase,
        position,
        sizeRatio: {
          original: `${testCase.width}x${testCase.height}`,
          final: `${position.width}x${position.height}`,
          scale: `${((position.width / testCase.width) * 100).toFixed(1)}%`
        },
        placement: {
          area: `${position.area_width}x${position.area_height}`,
          position: `(${position.left}, ${position.top})`,
          centered: position.left === (position.area_width - position.width) / 2
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Design position calculations for different scenarios',
      results,
      summary: {
        totalTests: results.length,
        printAreas: {
          unisex: '3000x3000 pixels (20" x 20" at 150 DPI)',
          women: '2800x2800 pixels (18.7" x 18.7" at 150 DPI)'
        },
        maxDesignSize: '80% of print area',
        centering: 'All designs are centered in the print area'
      }
    })
    
  } catch (error) {
    console.error('Position test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
