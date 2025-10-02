import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const to = process.env.SMTP_USER || process.env.MAIL_FROM
    if (!to) {
      return NextResponse.json({ error: 'No recipient available (SMTP_USER/MAIL_FROM missing)' }, { status: 400 })
    }
    await sendEmail({
      to,
      subject: 'SMTP test',
      html: '<b>Hello from your app SMTP test</b>',
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


