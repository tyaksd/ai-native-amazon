import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// This endpoint should be called daily by a cron job (e.g., Vercel Cron)
// It updates products where badge is NEW and created_at is more than 30 days ago
export async function GET(request: Request) {
  // Vercel Cron sends a special header, or you can check for a secret token
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // If CRON_SECRET is set, require it for authentication
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the database function to update NEW badges to NULL
    const { data, error } = await supabase.rpc('update_new_badge_to_null')

    if (error) {
      console.error('Error updating badges:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Badges updated successfully',
      data 
    })
  } catch (error) {
    console.error('Error in update-badges cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

