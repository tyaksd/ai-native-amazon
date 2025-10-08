import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('=== WEBHOOK DEBUG API CALLED ===')
    
    // 環境変数の確認
    const envCheck = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    }
    
    console.log('Environment variables:', envCheck)
    
    // Supabase接続テスト
    console.log('Testing Supabase connection...')
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(5)
    
    if (ordersError) {
      console.error('Supabase orders query failed:', ordersError)
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase connection failed',
        details: ordersError,
        envCheck 
      })
    }
    
    console.log('Supabase connection successful')
    console.log('Recent orders:', orders)
    
    // order_itemsテーブルの確認
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .limit(5)
    
    if (itemsError) {
      console.error('Supabase order_items query failed:', itemsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase order_items query failed',
        details: itemsError,
        envCheck 
      })
    }
    
    console.log('Recent order items:', orderItems)
    
    return NextResponse.json({
      success: true,
      envCheck,
      ordersCount: orders?.length || 0,
      orderItemsCount: orderItems?.length || 0,
      recentOrders: orders,
      recentOrderItems: orderItems,
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK DEBUG POST CALLED ===')
    
    // リクエストボディの確認
    const body = await req.text()
    console.log('Request body length:', body.length)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // テスト用のorder挿入
    console.log('Testing order insertion...')
    const testOrder = {
      stripe_session_id: `test_${Date.now()}`,
      total_amount: 10.00,
      currency: 'usd',
      is_paid: true,
      customer_email: 'test@example.com',
      shipping_address: { city: 'Test City', country: 'US' },
      shipping_name: 'Test User',
      billing_address: { city: 'Test City', country: 'US' },
      billing_name: 'Test User',
    }
    
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert(testOrder)
      .select()
      .single()
    
    if (orderErr || !order) {
      console.error('Test order insert failed:', orderErr)
      return NextResponse.json({ 
        success: false, 
        error: 'Test order insert failed',
        details: orderErr 
      })
    }
    
    console.log('Test order created:', order.id)
    
    // テスト用のorder_item挿入
    const testItem = {
      order_id: order.id,
      product_id: null,
      product_name: 'Test Product',
      unit_price: 10.00,
      quantity: 1,
      size: 'M',
      color: 'Blue',
    }
    
    const { error: itemErr } = await supabaseAdmin
      .from('order_items')
      .insert(testItem)
    
    if (itemErr) {
      console.error('Test order item insert failed:', itemErr)
      return NextResponse.json({ 
        success: false, 
        error: 'Test order item insert failed',
        details: itemErr 
      })
    }
    
    console.log('Test order item created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Test order and item created successfully',
      orderId: order.id,
    })
    
  } catch (error) {
    console.error('Debug POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug POST failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
