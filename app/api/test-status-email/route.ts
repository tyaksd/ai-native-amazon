import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, renderOrderStatusEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderItemId, testEmail } = await req.json()
    
    if (!orderItemId) {
      return NextResponse.json({ error: 'orderItemId is required' }, { status: 400 })
    }

    const recipientEmail = testEmail || process.env.SMTP_USER || process.env.MAIL_FROM
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email available' }, { status: 400 })
    }

    // Generate test email content
    const html = renderOrderStatusEmail({
      orderId: 'TEST-ORDER-123',
      customerEmail: recipientEmail,
      productName: 'Test Product',
      status: 'fulfilled',
      fulfillmentStatus: 'shipped',
      trackingNumber: 'TEST123456789',
      estimatedDelivery: '2025-10-25',
      size: 'M',
      color: 'Black',
      productImage: null
    })

    // Send test email
    await sendEmail({
      to: recipientEmail,
      subject: 'Test Order Status Update Email',
      html
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test status email sent successfully',
      recipient: recipientEmail
    })

  } catch (error) {
    console.error('Test status email failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
