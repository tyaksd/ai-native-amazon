import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json()

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
    }

    // Enable SMTP logging
    process.env.LOG_SMTP = '1'

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827;">Godship - Test Email</h1>
        <p>This is a test email to verify SMTP configuration.</p>
        <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, your SMTP configuration is working correctly!</p>
      </div>
    `

    await sendEmail({
      to: testEmail,
      subject: 'Godship - SMTP Test Email',
      html: testHtml,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      sentTo: testEmail
    })

  } catch (error) {
    console.error('❌ Test email error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
