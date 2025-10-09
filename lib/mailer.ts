// lib/mailer.ts
import nodemailer from 'nodemailer'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

function getTransport() {
  const host = process.env.SMTP_HOST || 'smtp.titan.email'
  const port = Number(process.env.SMTP_PORT || '465')  // 587から465に変更
  // .env は文字列なので厳密に変換
  const secure =
    (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  // まずは FROM を送信ユーザーと同一でテスト（表示名は後で戻す）
  const from = process.env.MAIL_FROM?.trim() || user || 'jack@godship.io'

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
    requireTLS: !secure,             // 587(STARTTLS)ならTLS必須
    tls: { 
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false      // 証明書検証を緩和
    },
    authMethod: 'LOGIN',             // LOGINに戻す
    auth: { user, pass },
    logger: true, 
    debug: true,
  })

  return { transporter, from }
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { transporter, from } = getTransport()
  // 認証失敗を早期に把握
  await transporter.verify()
  await transporter.sendMail({ from, to, subject, html })
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
      
      // 商品画像を追加
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
      // <!-- Godship Logo -->
      // <div style="text-align:center;margin-bottom:4px;padding:4px 0;border-bottom:1px solid #e5e7eb;">
      //   <img src="https://godship.io/godship-logo2.png" alt="Godship" style="height:200px;width:auto;">
      // </div>
      
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
      
      <p style="margin:24px 0 0;color:#6b7280;">If you have any questions, please contact us through our website. This is an automated message, please do not reply to this email.</p>
    </div>
  `
}
