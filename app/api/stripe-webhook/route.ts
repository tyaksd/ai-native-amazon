// import { NextResponse } from 'next/server'
// import Stripe from 'stripe'
// import { headers } from 'next/headers'
// import { supabaseAdmin } from '@/lib/supabase-admin'
// import { renderOrderEmail, sendEmail } from '@/lib/mailer'

// function getStripe(): Stripe {
//   const key = process.env.STRIPE_SECRET_KEY
//   if (!key) {
//     throw new Error('STRIPE_SECRET_KEY not configured')
//   }
//   return new Stripe(key, { apiVersion: '2025-09-30.clover' as any })
// }
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

// export const runtime = 'nodejs'

// export async function POST(req: NextRequest) {
//   if (!endpointSecret) {
//     return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
//   }

//   const headersList = await headers()
//   const sig = headersList.get('stripe-signature') as string
//   const rawBody = await req.text()

//   let event: Stripe.Event
//   try {
//     const stripe = getStripe()
//     event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : 'Unknown error'
//     return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
//   }

//   try {
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session
//       const sessionId = session.id

//       // Retrieve the session again expanding line_items and shipping for reliable access
//       const stripe = getStripe()
//       const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
//         expand: ['line_items', 'line_items.data.price.product', 'shipping', 'customer_details'],
//       })

//       const currency = ((fullSession.currency || session.currency) || 'usd').toLowerCase()
//       const totalAmount = ((fullSession.amount_total ?? session.amount_total) || 0) / 100
//       const customerEmail = fullSession.customer_details?.email || session.customer_details?.email || null
      
//       // Debug: Log the full session structure to understand the data
//       console.log('Full session keys:', Object.keys(fullSession))
//       console.log('Full session shipping:', (fullSession as any).shipping)
//       console.log('Session shipping:', (session as any).shipping)
//       console.log('Full session customer_details:', (fullSession as any).customer_details)
//       console.log('Session customer_details:', (session as any).customer_details)
      
//       // Try different ways to get shipping address
//       let shippingAddress = null
      
//       // Method 1: Direct from expanded fullSession
//       if ((fullSession as any).shipping?.address) {
//         shippingAddress = (fullSession as any).shipping.address
//         console.log('Found shipping via fullSession.shipping.address')
//       } else if ((session as any).shipping?.address) {
//         shippingAddress = (session as any).shipping.address
//         console.log('Found shipping via session.shipping.address')
//       }
      
//       // Method 2: Check if shipping is in a different structure
//       if (!shippingAddress) {
//         console.log('Full session shipping object:', (fullSession as any).shipping)
//         console.log('Session shipping object:', (session as any).shipping)
//         console.log('Full session structure keys:', Object.keys(fullSession))
//       }
      
//       // Billing address logic:
//       // In Stripe checkout, when "Billing info is same as shipping" is checked (default),
//       // the address entered by user is actually the shipping address
//       // and billing address should be the same as shipping address
//       let billingAddress = null
      
//       // Check if there's a separate billing address (when user unchecked "same as shipping")
//       const separateBillingAddress = fullSession.customer_details?.address || session.customer_details?.address
      
//       if (separateBillingAddress) {
//         // User unchecked "same as shipping" and entered different billing address
//         billingAddress = separateBillingAddress
//         console.log('Found separate billing address (user unchecked "same as shipping")')
//       } else if (shippingAddress) {
//         // User kept "same as shipping" checked (default behavior)
//         billingAddress = shippingAddress
//         console.log('Using shipping address as billing address (default behavior)')
//       }
      
//       console.log('Final shipping address:', shippingAddress)
//       console.log('Final billing address:', billingAddress)

//       let lineItems = (fullSession.line_items?.data || []) as unknown as Stripe.LineItem[]
//       if (!lineItems || lineItems.length === 0) {
//         const stripe = getStripe()
//         const fetched = await stripe.checkout.sessions.listLineItems(sessionId, { expand: ['data.price.product'] })
//         lineItems = fetched.data as unknown as Stripe.LineItem[]
//       }

//       // Insert order first
//       const { data: order, error: orderErr } = await supabaseAdmin
//         .from('orders')
//         .insert({
//           stripe_session_id: sessionId,
//           total_amount: totalAmount,
//           currency,
//           is_paid: true,
//           customer_email: customerEmail,
//           shipping_address: shippingAddress,
//           billing_address: billingAddress,
//         })
//         .select()
//         .single()

//       if (orderErr || !order) throw orderErr || new Error('Order insert failed')

//       // Prefer cart metadata if present (authoritative cart state)
//       let itemsPayload: {
//         order_id: string
//         product_id: string | null
//         product_name: string
//         unit_price: number
//         quantity: number
//         size: string | null
//         color: string | null
//       }[] = []

//       const cartMeta = (() => {
//         try { return fullSession.metadata?.cart ? JSON.parse(fullSession.metadata.cart) : null } catch { return null }
//       })()

//       console.log('Cart metadata:', cartMeta)
//       console.log('Line items:', lineItems)
//       console.log('Line items length:', lineItems.length)


//       console.log('[webhook] event type:', event.type);
//       console.log('order.id value & typeof:', order.id, typeof order.id);
//       console.log('Items payload length:', itemsPayload.length);
//       console.log('First item payload sample:', itemsPayload[0]);



//       if (Array.isArray(cartMeta) && cartMeta.length > 0) {
//         console.log('Using cart metadata for items')
//         type CartMetaItem = {
//           id?: string
//           name?: string
//           price?: number
//           quantity?: number
//           size?: string | null
//           color?: string | null
//         }
//         itemsPayload = (cartMeta as CartMetaItem[]).map((ci) => ({
//           order_id: order.id,
//           product_id: ci.id || null,
//           product_name: ci.name || 'Item',
//           unit_price: Number(ci.price ?? 0),
//           quantity: Number(ci.quantity ?? 1),
//           size: ci.size ? String(ci.size) : null,
//           color: ci.color ? String(ci.color) : null,
//         }))
//       } else {
//         console.log('Using Stripe line items for items')
//         // Fallback to Stripe line items if no cart metadata
//         itemsPayload = lineItems.map((item) => {
//           const price = item.price as Stripe.Price | null
//           const product = (price?.product ?? null) as Stripe.Product | string | null
//           const productObj = typeof product === 'object' && product !== null ? (product as Stripe.Product) : null
//           const metadata: Record<string, string> | undefined = productObj?.metadata
//           const quantity = item.quantity || 1
//           const amountTotal = (item.amount_total ?? item.amount_subtotal ?? 0) / 100
//           const computedUnit = quantity > 0 ? amountTotal / quantity : amountTotal
//           return {
//             order_id: order.id,
//             product_id: metadata?.product_id ?? null,
//             product_name: productObj?.name || item.description || price?.nickname || 'Item',
//             unit_price: computedUnit,
//             quantity,
//             size: metadata?.size ?? null,
//             color: metadata?.color ?? null,
//           }
//         })
//       }

//       console.log('Items payload:', itemsPayload)
//       console.log('Items payload length:', itemsPayload.length)

//       if (itemsPayload.length === 0) {
//         console.log('WARNING: No items to insert into order_items')
//         return NextResponse.json({ received: true })
//       }

//       const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsPayload)
//       if (itemsErr) {
//         console.error('Order items insert error:', itemsErr)
//         throw itemsErr
//       }
      
//       console.log('Successfully inserted order items')

//       // Send confirmation email to the customer
//       try {
//         if (customerEmail) {
//           // Get product images from database
//           const productIds = itemsPayload.map(item => item.product_id).filter(Boolean)
//           let productImages: Record<string, string> = {}
          
//           if (productIds.length > 0) {
//             const { data: products } = await supabaseAdmin
//               .from('products')
//               .select('id, images')
//               .in('id', productIds)
            
//             if (products) {
//               productImages = products.reduce((acc, product) => {
//                 if (product.images && product.images.length > 0) {
//                   acc[product.id] = product.images[0] // Use first image
//                 }
//                 return acc
//               }, {} as Record<string, string>)
//             }
//           }

//           const html = renderOrderEmail({
//             orderId: order.id,
//             customerEmail,
//             items: itemsPayload.map((it) => ({
//               name: it.product_name,
//               unitPrice: it.unit_price,
//               quantity: it.quantity,
//               size: it.size,
//               color: it.color,
//               image: it.product_id ? productImages[it.product_id] : undefined,
//             })),
//             total: totalAmount,
//             currency,
//           })
//           await sendEmail({
//             to: customerEmail,
//             subject: 'Thank you for your order',
//             html,
//           })
//         } else {
//           console.warn('No customer email present; skipping email send')
//         }
//       } catch (emailErr) {
//         console.error('Email send failed:', emailErr)
//       }
//     }

//     return NextResponse.json({ received: true })
//   } catch (e: unknown) {
//     const message = e instanceof Error ? e.message : 'Internal error'
//     console.error('Webhook handling error:', e)
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }

// export async function GET() {
//   return NextResponse.json({ ok: true })
// }



// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderOrderEmail, sendEmail } from '@/lib/mailer'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  // 将来日付のバージョンは避け、安定版を使用
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== WEBHOOK CALLED ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  console.log('Environment check:')
  console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing')
  console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing')
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
  
  if (!endpointSecret) {
    console.error('Webhook secret not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // 署名検証用に「生のボディ」を取得
  const sig = req.headers.get('stripe-signature') || ''
  const rawBody = await req.text()
  
  console.log('Stripe signature:', sig ? 'Present' : 'Missing')
  console.log('Raw body length:', rawBody.length)

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
    console.log('Event constructed successfully:', event.type)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    console.log('Webhook received:', event.type)
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event')
      const session = event.data.object as Stripe.Checkout.Session
      const stripe = getStripe()

      // 決済後の確定情報を取得（PI展開がポイント）
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: [
          'line_items',
          'line_items.data.price.product',
          'payment_intent',
          'payment_intent.latest_charge', 
          'customer_details',
        ],
      })

      // 通貨・金額
      const currency = (fullSession.currency ?? session.currency ?? 'usd').toLowerCase()
      const totalAmount = ((fullSession.amount_total ?? session.amount_total) ?? 0) / 100

      // PaymentIntent & 最初のCharge
      const pi = fullSession.payment_intent as Stripe.PaymentIntent | null
     // latest_charge は string | Charge なので型ガード
      const lc = pi?.latest_charge as string | Stripe.Charge | undefined
      const firstCharge: Stripe.Charge | undefined =
        lc && typeof lc === 'object' ? (lc as Stripe.Charge) : undefined



      
            // ===== Shipping address =====
      // 優先: session.shipping_details.address → Charge.shipping.address → PI.shipping.address（フォールバック）
      // Define interface for shipping details
      interface ShippingDetails {
        address?: Stripe.Address
        name?: string
      }
      
      const shippingAddress =
      (fullSession as Stripe.Checkout.Session & { shipping_details?: ShippingDetails }).shipping_details?.address ??
      (firstCharge?.shipping as Stripe.Charge.Shipping)?.address ??
      (pi?.shipping as Stripe.PaymentIntent.Shipping)?.address ??
      null

            // ===== Billing address =====
        // 優先: Charge.billing_details.address → customer_details.address → shippingAddress
        const billingAddress =
        firstCharge?.billing_details?.address ??
        fullSession.customer_details?.address ??
        shippingAddress ??
        null


        const shippingName =
  (fullSession as Stripe.Checkout.Session & { shipping_details?: ShippingDetails }).shipping_details?.name ??
  (firstCharge?.shipping as Stripe.Charge.Shipping)?.name ??
  (pi?.shipping as Stripe.PaymentIntent.Shipping)?.name ?? null;

const billingName =
  firstCharge?.billing_details?.name ??
  fullSession.customer_details?.name ??
  shippingName ?? null;

     // Email も Charge 側から拾えることがある
        const customerEmail =
        fullSession.customer_details?.email ??
        firstCharge?.billing_details?.email ??
        null

      // デバッグ（必要に応じて残す）
      // console.log('shippingAddress:', shippingAddress)
      // console.log('billingAddress:', billingAddress)
      // console.log('customerEmail:', customerEmail)

      // Line Items（足りなければ別APIで取得）
      let lineItems = (fullSession.line_items?.data || []) as unknown as Stripe.LineItem[]
      if (!lineItems || lineItems.length === 0) {
        const fetched = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        })
        lineItems = fetched.data as unknown as Stripe.LineItem[]
      }

      // === Order を作成 ===
      console.log('Creating order with data:', {
        stripe_session_id: session.id,
        total_amount: totalAmount,
        currency,
        is_paid: true,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        shipping_name: shippingName,
        billing_address: billingAddress,
        billing_name: billingName,
      })
      
      // Check if order already exists to prevent duplicates
      console.log('Checking for existing order...')
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single()

      if (existingOrder) {
        console.log('Order already exists, skipping duplicate processing')
        return NextResponse.json({ received: true, message: 'Order already processed' })
      }

      console.log('Attempting to insert order into Supabase...')
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          total_amount: totalAmount,
          currency,
          is_paid: true,
          customer_email: customerEmail,
          shipping_address: shippingAddress,
          shipping_name: shippingName,
          billing_address: billingAddress,
          billing_name: billingName,
        })
        .select()
        .single()

      if (orderErr || !order) {
        console.error('Order insert failed:', orderErr)
        console.error('Order insert error details:', JSON.stringify(orderErr, null, 2))
        throw orderErr || new Error('Order insert failed')
      }
      
      console.log('Order created successfully:', order.id)
      console.log('Order data:', JSON.stringify(order, null, 2))

      // ====== order_items 作成 ======
      type ItemPayload = {
        order_id: string
        product_id: string | null
        product_name: string
        unit_price: number
        quantity: number
        size: string | null
        color: string | null
      }

      let itemsPayload: ItemPayload[] = []

      // cart メタデータを優先（あなたの既存仕様に合わせる）
      const cartMeta = (() => {
        try {
          return fullSession.metadata?.cart ? JSON.parse(fullSession.metadata.cart) : null
        } catch {
          return null
        }
      })()

      if (Array.isArray(cartMeta) && cartMeta.length > 0) {
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
        // StripeのLineItemから計算
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
      
      if (itemsPayload.length > 0) {
        console.log('Inserting order items...')
        console.log('Items payload details:', JSON.stringify(itemsPayload, null, 2))
        const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsPayload)
        if (itemsErr) {
          console.error('Order items insert failed:', itemsErr)
          console.error('Order items insert error details:', JSON.stringify(itemsErr, null, 2))
          throw itemsErr
        }
        console.log('Order items inserted successfully')
      } else {
        console.log('No items to insert')
        console.log('Cart metadata:', cartMeta)
        console.log('Line items:', lineItems)
      }

      // ====== Printful発注処理 ======
      try {
        console.log('=== Creating Printful order ===')
        console.log('Order ID:', order.id)
        console.log('Items payload:', JSON.stringify(itemsPayload, null, 2))
        console.log('Shipping address:', JSON.stringify(shippingAddress, null, 2))
        console.log('Customer email:', customerEmail)
        
        if (!shippingAddress) {
          throw new Error('Shipping address is required for Printful order')
        }
        
        // Transform Stripe Address to Printful format
        const printfulAddress = {
          name: shippingName || 'Customer', // Use actual customer name
          address1: shippingAddress.line1 || '',
          address2: shippingAddress.line2 || undefined,
          city: shippingAddress.city || 'Tokyo', // Default to Tokyo if empty
          state_code: shippingAddress.state === '東京都' ? 'Tokyo' : shippingAddress.state || undefined,
          country_code: shippingAddress.country || 'JP',
          zip: shippingAddress.postal_code || '',
          phone: undefined,
          email: customerEmail || undefined
        }
        
        console.log('Transformed Printful address:', JSON.stringify(printfulAddress, null, 2))
        
        console.log('Calling createEnhancedPrintfulOrder (API v2)...')
        const { createEnhancedPrintfulOrder } = await import('@/lib/printful-v2-integration')
        const printfulOrder = await createEnhancedPrintfulOrder(
          order.id,
          itemsPayload,
          printfulAddress,
          customerEmail || undefined,
          {
            estimateCosts: false, // 本番環境ではfalseに設定
            useMockups: true // モックアップ生成を有効化
          }
        )
        
        console.log('✅ Printful order created successfully!')
        console.log('Printful Order ID:', printfulOrder.id)
        console.log('Printful External ID:', printfulOrder.external_id)
        
        // Update order with Printful order ID
        console.log('Updating order with Printful IDs...')
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ 
            printful_order_id: printfulOrder.id.toString(),
            printful_external_id: printfulOrder.external_id 
          })
          .eq('id', order.id)
          
        if (updateError) {
          console.error('Failed to update order with Printful IDs:', updateError)
        } else {
          console.log('✅ Order updated with Printful IDs successfully')
        }
          
      } catch (printfulErr) {
        console.error('❌ Printful order creation failed:', printfulErr)
        console.error('Error details:', JSON.stringify(printfulErr, null, 2))
        console.error('Error stack:', printfulErr instanceof Error ? printfulErr.stack : 'No stack trace')
        
        // Don't throw error to avoid breaking the webhook
        // Log the error for manual review
        console.log('⚠️ Continuing webhook processing despite Printful error')
      }

      // ====== 購入確認メール ======
      try {
        if (customerEmail) {
          // 画像取得（任意）
          const productIds = itemsPayload.map((it) => it.product_id).filter(Boolean) as string[]
          let productImages: Record<string, string> = {}
          if (productIds.length > 0) {
            const { data: products } = await supabaseAdmin
              .from('products')
              .select('id, images')
              .in('id', productIds)

            if (products) {
              productImages = products.reduce((acc, product) => {
                if (product.images && product.images.length > 0) {
                  acc[product.id] = product.images[0]
                }
                return acc
              }, {} as Record<string, string>)
            }
          }

          const html = renderOrderEmail({
            orderId: order.id,
            customerEmail,
            items: itemsPayload.map((it) => ({
              name: it.product_name,
              unitPrice: it.unit_price,
              quantity: it.quantity,
              size: it.size,
              color: it.color,
              image: it.product_id ? productImages[it.product_id] : undefined,
            })),
            total: totalAmount,
            currency,
          })

          await sendEmail({
            to: customerEmail,
            subject: 'Thank you for your order',
            html,
          })
        }
      } catch (emailErr) {
        console.error('Email send failed:', emailErr)
      }
    }

    console.log('Webhook processing completed successfully')
    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error('Webhook handling error:', e)
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace')
    console.error('Error details:', JSON.stringify(e, null, 2))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
