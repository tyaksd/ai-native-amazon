// lib/mailer.ts
import nodemailer from 'nodemailer'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

function getTransport() {
  const host = process.env.SMTP_HOST || 'smtp.titan.email'
  const port = Number(process.env.SMTP_PORT || '465')  // Changed from 587 to 465
  // .env is a string so convert strictly
  const secure =
    (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  // First test with FROM same as sending user (return display name later)
  // For development, use a fallback email if SPF is not configured
  const from = process.env.MAIL_FROM?.trim() || user || 'jack@godship.io'
  
  // If using godship.io domain and no SPF record, suggest using a different domain
  if (from.includes('godship.io') && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Using godship.io domain without SPF record may cause delivery issues')
  }

  if (process.env.LOG_SMTP === '1') {
    console.log('SMTP_HOST', host)
    console.log('SMTP_PORT', port)
    console.log('SMTP_SECURE', secure)
    console.log('SMTP_USER', user)
    console.log('SMTP_PASS length', pass ? String(pass).length : 0)
    console.log('SMTP_PASS first 3 chars', pass ? String(pass).substring(0, 3) : 'undefined')
    console.log('SMTP_PASS last 3 chars', pass ? String(pass).slice(-3) : 'undefined')
    console.log('MAIL_FROM', from)
  }

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP env vars not configured (SMTP_HOST/PORT/USER/PASS)')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,                          // 587=false / 465=true
    requireTLS: !secure,             // TLS required for 587(STARTTLS)
    tls: { 
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false      // Relax certificate verification
    },
    authMethod: 'LOGIN',             // Return to LOGIN
    auth: { user, pass },
    logger: true, 
    debug: true,
  })

  return { transporter, from }
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { transporter, from } = getTransport()
  // Early detection of authentication failure
  await transporter.verify()
  await transporter.sendMail({ from, to, subject, html })
}

export function renderOrderStatusEmail(params: {
  orderId: string
  customerEmail: string
  productName: string
  status: string
  fulfillmentStatus: string
  trackingNumber?: string | null
  estimatedDelivery?: string | null
  size?: string | null
  color?: string | null
  productImage?: string | null
}) {
  const getStatusMessage = (status: string, fulfillmentStatus: string) => {
    if (fulfillmentStatus === 'delivered') {
      return {
        title: 'Your order has been delivered! 🎉',
        message: 'Great news! Your order has been successfully delivered.',
        color: '#10b981'
      }
    } else if (fulfillmentStatus === 'shipped') {
      return {
        title: 'Your order has been shipped! 📦',
        message: 'Your order is on its way to you.',
        color: '#3b82f6'
      }
    } else if (status === 'fulfilled') {
      return {
        title: 'Your order is being prepared! ⚡',
        message: 'Your order has been fulfilled and is being prepared for shipment.',
        color: '#f59e0b'
      }
    } else {
      return {
        title: 'Order status update',
        message: `Your order status has been updated to: ${status}`,
        color: '#6b7280'
      }
    }
  }

  const statusInfo = getStatusMessage(params.status, params.fulfillmentStatus)
  
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;line-height:1.6;max-width:600px;margin:0 auto;">
      
      <div style="background:linear-gradient(135deg,${statusInfo.color}15,${statusInfo.color}05);border:1px solid ${statusInfo.color}30;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:${statusInfo.color};font-size:24px;">${statusInfo.title}</h2>
        <p style="margin:0;color:#374151;font-size:16px;">${statusInfo.message}</p>
      </div>
      
      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 16px;color:#111827;font-size:18px;">Order Details</h3>
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Order ID:</strong> ${params.orderId}</p>
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Product:</strong> ${params.productName}</p>
        ${params.size ? `<p style="margin:0 0 8px;color:#6b7280;"><strong>Size:</strong> ${params.size}</p>` : ''}
        ${params.color ? `<p style="margin:0 0 8px;color:#6b7280;"><strong>Color:</strong> ${params.color}</p>` : ''}
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Status:</strong> ${params.status}</p>
        <p style="margin:0;color:#6b7280;"><strong>Fulfillment:</strong> ${params.fulfillmentStatus}</p>
      </div>

      ${params.trackingNumber ? `
        <div style="background-color:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 12px;color:#1e40af;font-size:16px;">📦 Tracking Information</h3>
          <p style="margin:0 0 8px;color:#1e40af;"><strong>Tracking Number:</strong> ${params.trackingNumber}</p>
          <p style="margin:0;color:#1e40af;font-size:14px;">You can track your package using the tracking number above.</p>
        </div>
      ` : ''}

      ${params.estimatedDelivery ? `
        <div style="background-color:#f0fdf4;border:1px solid #10b981;border-radius:8px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 12px;color:#059669;font-size:16px;">📅 Estimated Delivery</h3>
          <p style="margin:0;color:#059669;">Expected delivery: ${params.estimatedDelivery}</p>
        </div>
      ` : ''}
      
      <div style="text-align:center;margin:24px 0;">
        <p style="margin:0;color:#6b7280;font-size:14px;">Thank you for choosing Godship!</p>
        <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please contact us through our website.</p>
      </div>
    </div>
  `
}

export function renderOrderEmail(params: {
  orderId: string
  customerEmail: string | null
  items: { name: string; unitPrice: number; quantity: number; size?: string | null; color?: string | null; image?: string }[]
  total: number
  currency: string
}) {
  const currency = params.currency?.toUpperCase() || 'USD'
  const rows = params.items
    .map((it) => {
      const meta: string[] = []
      if (it.size) meta.push(`Size: ${it.size}`)
      if (it.color) meta.push(`Color: ${it.color}`)
      const metaText = meta.length ? ` <small>(${meta.join(', ')})</small>` : ''
      
      // Add product image
      const imageHtml = it.image ? 
        `<img src="${it.image}" alt="${it.name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;margin-right:12px;vertical-align:middle;">` : 
        `<div style="width:60px;height:60px;background-color:#f3f4f6;border-radius:4px;margin-right:12px;display:inline-block;vertical-align:middle;"></div>`
      
      return `<tr>
        <td style="padding:12px 8px;">
          <div style="display:flex;align-items:center;">
            ${imageHtml}
            <div>
              <div style="font-weight:500;">${it.name}${metaText}</div>
            </div>
          </div>
        </td>
        <td style="text-align:right;padding:12px 8px;">${it.quantity}</td>
        <td style="text-align:right;padding:12px 8px;">${it.unitPrice.toFixed(2)}</td>
      </tr>`
    })
    .join('')

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;line-height:1.6;max-width:600px;margin:0 auto;">
      
      <h2 style="margin:0 0 12px;color:#111827;">Thank you for your order!</h2>
      <p style="margin:0 0 16px;color:#6b7280;">We appreciate your purchase. This email confirms we received your payment.</p>
      <p style="margin:0 0 24px;color:#374151;">Order ID: <strong>${params.orderId}</strong></p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background-color:#f9fafb;">
            <th align="left" style="padding:16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Item</th>
            <th align="right" style="padding:16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Qty</th>
            <th align="right" style="padding:16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Price (${currency})</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background-color:#f9fafb;border-top:1px solid #e5e7eb;">
            <td style="padding:16px;"></td>
            <td align="right" style="padding:16px;font-weight:600;color:#111827;">Total</td>
            <td align="right" style="padding:16px;font-weight:600;color:#111827;">${params.total.toFixed(2)} ${currency}</td>
          </tr>
        </tfoot>
      </table>
      
       <p style="margin:24px 0 16px;color:#6b7280;">We'll let you know once it's been shipped.</p>
       <p style="margin:0 0 24px;color:#6b7280;">We'll fulfill and send it out, and then send you an email with the order's tracking info and estimated delivery date.</p>
      
      <p style="margin:0;color:#6b7280;">If you have any questions, please contact us through our website. This is an automated message, please do not reply to this email.</p>
    </div>
  `
}
