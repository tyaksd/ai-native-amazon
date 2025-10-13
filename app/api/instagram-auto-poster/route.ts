import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Instagram auto poster...')
    
    // Run the Instagram auto scheduler in the background
    const pythonPath = path.join(process.cwd(), 'instagram_auto_poster', 'instagram_auto_scheduler.py')
    
    const child = spawn('python3', [pythonPath], {
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref()
    
    return NextResponse.json({
      success: true,
      message: 'Instagram auto poster started successfully',
      pid: child.pid
    })
    
  } catch (error) {
    console.error('Instagram auto poster error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Instagram auto poster API endpoint',
    endpoints: {
      'POST /api/instagram-auto-poster': 'Start the Instagram auto poster'
    }
  })
}
