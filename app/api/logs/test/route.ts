import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // データベース接続テスト
    const { error } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Analytics system is ready',
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'System check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json()
    
    // テスト用のセッション作成
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        session_id: `test_${Date.now()}`,
        user_agent: 'Test Agent',
        device_type: 'desktop',
        browser: 'Test Browser',
        os: 'Test OS'
      })

    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to create test session',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Test session created successfully'
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
