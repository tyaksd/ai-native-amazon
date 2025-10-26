import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all features
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    let query = supabase
      .from('features')
      .select('*')
      .order('display_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching features:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new feature
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, subtitle, image_url, link_url, display_order, is_active } = body

    // Validate required fields
    if (!title || !subtitle || !image_url) {
      return NextResponse.json(
        { error: 'Title, subtitle, and image_url are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('features')
      .insert({
        title,
        subtitle,
        image_url,
        link_url: link_url || '/explore',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feature:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a feature
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, subtitle, image_url, link_url, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 })
    }

    const updateData: {
      title?: string
      subtitle?: string
      image_url?: string
      link_url?: string
      display_order?: number
      is_active?: boolean
      updated_at?: string
    } = {}
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (image_url !== undefined) updateData.image_url = image_url
    if (link_url !== undefined) updateData.link_url = link_url
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating feature:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a feature
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feature:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

