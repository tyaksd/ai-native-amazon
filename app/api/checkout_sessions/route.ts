import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
})

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const { items } = body as {
      items?: {
        id?: string
        name: string
        price: number
        quantity: number
        size?: string | null
        color?: string | null
      }[]
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(it.price * 100),
          product_data: {
            name: it.name,
            metadata: {
              product_id: it.id ?? '',
              size: it.size ?? '',
              color: it.color ?? '',
            },
          },
        },
      })),
      // Redirect to dedicated success/cancel pages
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      allow_promotion_codes: true,
      // Persist the full cart for reliable order_items creation after payment
      metadata: {
        cart: JSON.stringify(
          items.map((it) => ({
            id: it.id ?? '',
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            size: it.size ?? '',
            color: it.color ?? '',
          }))
        ),
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('Stripe session error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


