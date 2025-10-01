import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-08-27.basil' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!endpointSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headersList = await headers()
  const sig = headersList.get('stripe-signature') as string
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionId = session.id

      // Retrieve the session again expanding line_items for reliable access
      const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'line_items.data.price.product'],
      })

      const currency = ((fullSession.currency || session.currency) || 'usd').toLowerCase()
      const totalAmount = ((fullSession.amount_total ?? session.amount_total) || 0) / 100
      const customerEmail = fullSession.customer_details?.email || session.customer_details?.email || null

      let lineItems = (fullSession.line_items?.data || []) as unknown as Stripe.LineItem[]
      if (!lineItems || lineItems.length === 0) {
        const fetched = await stripe.checkout.sessions.listLineItems(sessionId, { expand: ['data.price.product'] })
        lineItems = fetched.data as unknown as Stripe.LineItem[]
      }

      // Insert order first
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .insert({
          stripe_session_id: sessionId,
          total_amount: totalAmount,
          currency,
          is_paid: true,
          customer_email: customerEmail,
        })
        .select()
        .single()

      if (orderErr || !order) throw orderErr || new Error('Order insert failed')

      // Prefer cart metadata if present (authoritative cart state)
      let itemsPayload: {
        order_id: string
        product_id: string | null
        product_name: string
        unit_price: number
        quantity: number
        size: string | null
        color: string | null
      }[] = []

      const cartMeta = (() => {
        try { return fullSession.metadata?.cart ? JSON.parse(fullSession.metadata.cart) : null } catch { return null }
      })()

      console.log('Cart metadata:', cartMeta)
      console.log('Line items:', lineItems)
      console.log('Line items length:', lineItems.length)


      console.log('[webhook] event type:', event.type);
      console.log('order.id value & typeof:', order.id, typeof order.id);
      console.log('Items payload length:', itemsPayload.length);
      console.log('First item payload sample:', itemsPayload[0]);



      if (Array.isArray(cartMeta) && cartMeta.length > 0) {
        console.log('Using cart metadata for items')
        type CartMetaItem = {
          id?: string
          name?: string
          price?: number
          quantity?: number
          size?: string | null
          color?: string | null
        }
        itemsPayload = (cartMeta as CartMetaItem[]).map((ci) => ({
          order_id: order.id,
          product_id: ci.id || null,
          product_name: ci.name || 'Item',
          unit_price: Number(ci.price ?? 0),
          quantity: Number(ci.quantity ?? 1),
          size: ci.size ? String(ci.size) : null,
          color: ci.color ? String(ci.color) : null,
        }))
      } else {
        console.log('Using Stripe line items for items')
        // Fallback to Stripe line items if no cart metadata
        itemsPayload = lineItems.map((item) => {
          const price = item.price as Stripe.Price | null
          const product = (price?.product ?? null) as Stripe.Product | string | null
          const productObj = typeof product === 'object' && product !== null ? (product as Stripe.Product) : null
          const metadata: Record<string, string> | undefined = productObj?.metadata
          const quantity = item.quantity || 1
          const amountTotal = (item.amount_total ?? item.amount_subtotal ?? 0) / 100
          const computedUnit = quantity > 0 ? amountTotal / quantity : amountTotal
          return {
            order_id: order.id,
            product_id: metadata?.product_id ?? null,
            product_name: productObj?.name || item.description || price?.nickname || 'Item',
            unit_price: computedUnit,
            quantity,
            size: metadata?.size ?? null,
            color: metadata?.color ?? null,
          }
        })
      }

      console.log('Items payload:', itemsPayload)
      console.log('Items payload length:', itemsPayload.length)

      if (itemsPayload.length === 0) {
        console.log('WARNING: No items to insert into order_items')
        return NextResponse.json({ received: true })
      }

      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsPayload)
      if (itemsErr) {
        console.error('Order items insert error:', itemsErr)
        throw itemsErr
      }
      
      console.log('Successfully inserted order items')
    }

    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error('Webhook handling error:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}


