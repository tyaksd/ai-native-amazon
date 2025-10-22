import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const smtpConfig = {
      SMTP_HOST: process.env.SMTP_HOST || 'Not set',
      SMTP_PORT: process.env.SMTP_PORT || 'Not set',
      SMTP_USER: process.env.SMTP_USER || 'Not set',
      SMTP_PASS: process.env.SMTP_PASS ? `Set (${process.env.SMTP_PASS.length} chars)` : 'Not set',
      MAIL_FROM: process.env.MAIL_FROM || 'Not set',
      LOG_SMTP: process.env.LOG_SMTP || 'Not set'
    }

    const hasAllRequired = smtpConfig.SMTP_HOST !== 'Not set' && 
                          smtpConfig.SMTP_PORT !== 'Not set' && 
                          smtpConfig.SMTP_USER !== 'Not set' && 
                          smtpConfig.SMTP_PASS !== 'Not set'

    return NextResponse.json({
      config: smtpConfig,
      hasAllRequired,
      status: hasAllRequired ? 'Ready' : 'Missing configuration'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check SMTP config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
