import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = supabaseAdmin;

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 409 }
      );
    }

    // Insert new subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        {
          email: email.toLowerCase().trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting subscriber:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter',
        subscriber: data 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
