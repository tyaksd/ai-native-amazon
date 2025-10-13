import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Cron job triggered: X auto poster')
    
    // Run the auto scheduler
    const pythonPath = path.join(process.cwd(), 'x_auto_poster', 'auto_scheduler.py')
    
    const child = spawn('python3', [pythonPath], {
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref()
    
    return NextResponse.json({
      success: true,
      message: 'X auto poster cron job executed',
      pid: child.pid,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
