import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Instagram immediate post...')
    
    // Parse request body for post data
    const body = await request.json().catch(() => ({}))
    const { text, imageUrl, videoUrl, scheduledTime } = body
    
    console.log('Post data:', { text, imageUrl, videoUrl, scheduledTime })
    
    // Check if we have text content
    if (!text || text.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Text content is required for Instagram post'
      }, { status: 400 })
    }
    
    // Run the Instagram immediate poster
    const pythonPath = path.join(process.cwd(), 'instagram_auto_poster', 'instagram_brand_poster_simple.py')
    
    // Pass post data as environment variables
    const env = {
      ...process.env,
      POST_TEXT: text,
      ...(imageUrl && { POST_IMAGE_URL: imageUrl }),
      ...(videoUrl && { POST_VIDEO_URL: videoUrl }),
      ...(scheduledTime && { POST_SCHEDULED_TIME: scheduledTime })
    }
    
    return new Promise<Response>((resolve) => {
      const child = spawn('python3', [pythonPath], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      // Set timeout for 30 seconds
      const timeout = setTimeout(() => {
        child.kill('SIGTERM')
        resolve(NextResponse.json({
          success: false,
          error: 'Instagram post timed out after 30 seconds'
        }, { status: 500 }))
      }, 30000)
      
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      child.on('close', (code) => {
        clearTimeout(timeout)
        console.log('Instagram poster process finished with code:', code)
        console.log('stdout:', stdout)
        console.log('stderr:', stderr)
        
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Instagram post completed successfully',
            output: stdout,
            postData: { text, imageUrl, videoUrl, scheduledTime }
          }))
        } else {
          resolve(NextResponse.json({
            success: false,
            error: `Instagram post failed with code ${code}`,
            stderr: stderr,
            stdout: stdout
          }, { status: 500 }))
        }
      })
      
      child.on('error', (error) => {
        clearTimeout(timeout)
        console.error('Instagram poster process error:', error)
        resolve(NextResponse.json({
          success: false,
          error: `Failed to start Instagram poster: ${error.message}`
        }, { status: 500 }))
      })
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
