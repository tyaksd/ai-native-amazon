// import Stripe from 'stripe'
// import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'nodejs'

// function getStripe(): Stripe {
//   const key = process.env.STRIPE_SECRET_KEY
//   if (!key) {
//     throw new Error('STRIPE_SECRET_KEY not configured')
//   }
//   return new Stripe(key, { apiVersion: "2025-08-27.basil" })
// }

// export async function POST(req: NextRequest) {
//   try {
//     if (!process.env.STRIPE_SECRET_KEY) {
//       return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
//     }

//     const body = await req.json().catch(() => ({}))
//     const { items } = body as {
//       items?: {
//         id?: string
//         name: string
//         price: number
//         quantity: number
//         size?: string | null
//         color?: string | null
//       }[]
//     }

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return NextResponse.json({ error: 'No items provided' }, { status: 400 })
//     }

//     const origin = req.headers.get('origin') || req.nextUrl.origin

//     const stripe = getStripe()
//     const session = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       payment_method_types: ['card'],
//       line_items: items.map((it) => ({
//         quantity: it.quantity,
//         price_data: {
//           currency: 'usd',
//           unit_amount: Math.round(it.price * 100),
//           product_data: {
//             name: it.name,
//             metadata: {
//               product_id: it.id ?? '',
//               size: it.size ?? '',
//               color: it.color ?? '',
//             },
//           },
//         },
//       })),
//       // Redirect to dedicated success/cancel pages
//       success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${origin}/checkout/cancel`,
//       allow_promotion_codes: true,
//       // Persist the full cart for reliable order_items creation after payment
//       metadata: {
//         cart: JSON.stringify(
//           items.map((it) => ({
//             id: it.id ?? '',
//             name: it.name,
//             price: it.price,
//             quantity: it.quantity,
//             size: it.size ?? '',
//             color: it.color ?? '',
//           }))
//         ),
//       },
//     })

//     return NextResponse.json({ id: session.id, url: session.url })
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : 'Internal error'
//     console.error('Stripe session error:', err)
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }



import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

// 1) Allowed shipping countries (a broad "almost worldwide" set. Adjust according to requirements)
const ALLOWED_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  // North America
  'US','CA','MX',
  // Central and South America
  'AR','BR','CL','CO','PE','UY','EC','PA','CR','GT','HN','NI','SV','BO','PY','DO','JM','TT','BS','BB','BZ','GY','SR',
  // Europe (main EU/EEA countries + surrounding)
  'GB','IE','FR','DE','NL','BE','LU','IT','ES','PT','AT','SE','NO','DK','FI','IS',
  'PL','CZ','SK','HU','RO','BG','SI','HR','GR','EE','LV','LT','MT','CY',
  'CH','LI','MC','SM','VA','AD','GI','IM','GG','JE','AL','MK','RS','BA','XK',
  // Middle East & Africa
  'AE','SA','QA','KW','BH','OM','JO','LB','TR','IL',
  'EG','MA','TN','DZ','ZA','KE','NG','GH','TZ','UG','CM','CI','SN','ET','ZM','ZW','MU','RE','YT',
  // Asia
  'JP','KR','CN','TW','HK','MO','SG','MY','TH','VN','PH','ID','BN','KH','LA','IN','PK','BD','LK','NP','MV','MM',
  // Oceania
  'AU','NZ','PF','NC','WS','TO','FJ','PG'
]

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  // 2) Future-dated versions often cause errors, so use stable version
  return new Stripe(key, { apiVersion: "2025-08-27.basil" })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
    }

    // Get Clerk user ID if authenticated
    const { userId } = await auth()

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
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      // 3) Collect Billing & Shipping
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },

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

      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      allow_promotion_codes: true,

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
        clerk_id: userId || '', // Include Clerk user ID if authenticated
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('Stripe session error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
