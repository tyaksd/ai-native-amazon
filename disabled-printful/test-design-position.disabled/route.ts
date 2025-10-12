import { NextResponse } from 'next/server'
import { calculateDesignPosition } from '@/lib/printful'

export async function GET() {
  try {
    console.log('=== Design Position Calculation Test ===')
    
    // 1024x1024のPNGの配置計算
    const position = calculateDesignPosition(1024, 1024)
    
    console.log('Input: 1024x1024 PNG')
    console.log('Calculated position:', position)
    
    // 計算の詳細
    const area_width = 4500
    const area_height = 5400
    const targetWidth = Math.round(area_width * 0.75) // 3375px
    const scaleFactor = targetWidth / 1024 // 3.29296875
    const scaledWidth = Math.round(1024 * scaleFactor) // 3375px
    const scaledHeight = Math.round(1024 * scaleFactor) // 3375px
    const left = Math.round((area_width - scaledWidth) / 2) // 562px
    const top = Math.round((area_height - scaledHeight) / 2) // 1012px
    
    const calculationDetails = {
      input: {
        designWidth: 1024,
        designHeight: 1024
      },
      printArea: {
        width: area_width,
        height: area_height,
        description: "15\"×18\" @300DPI"
      },
      scaling: {
        targetWidth: targetWidth,
        scaleFactor: scaleFactor,
        description: "プリントエリアの75%を目標幅とする"
      },
      result: {
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight,
        left: left,
        top: top,
        description: "中央配置"
      },
      final: position
    }
    
    return NextResponse.json({
      success: true,
      message: 'Design position calculation for 1024x1024 PNG',
      calculation: calculationDetails,
      summary: {
        originalSize: '1024x1024',
        printArea: '4500x5400 (15"×18" @300DPI)',
        targetWidth: '3375px (75% of print area width)',
        finalSize: `${position.width}x${position.height}`,
        position: `(${position.left}, ${position.top})`,
        centered: position.left === (position.area_width - position.width) / 2
      },
      explanation: {
        step1: 'プリントエリアの横幅の75%を計算: 4500 × 0.75 = 3375px',
        step2: 'スケールファクターを計算: 3375 ÷ 1024 = 3.293',
        step3: 'デザインサイズをスケール: 1024 × 3.293 = 3375px',
        step4: '中央配置の位置を計算: (4500 - 3375) ÷ 2 = 562px',
        step5: '縦位置も同様に計算: (5400 - 3375) ÷ 2 = 1012px'
      }
    })
    
  } catch (error) {
    console.error('Position calculation test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { width, height } = await req.json()
    
    if (!width || !height) {
      return NextResponse.json({
        success: false,
        error: 'width and height are required'
      }, { status: 400 })
    }
    
    console.log(`=== Design Position Calculation for ${width}x${height} ===`)
    
    const position = calculateDesignPosition(width, height)
    
    return NextResponse.json({
      success: true,
      message: `Design position calculation for ${width}x${height}`,
      input: { width, height },
      result: position,
      summary: {
        originalSize: `${width}x${height}`,
        printArea: '4500x5400 (15"×18" @300DPI)',
        finalSize: `${position.width}x${position.height}`,
        position: `(${position.left}, ${position.top})`,
        scaleFactor: (position.width / width).toFixed(3),
        centered: position.left === (position.area_width - position.width) / 2
      }
    })
    
  } catch (error) {
    console.error('Position calculation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
