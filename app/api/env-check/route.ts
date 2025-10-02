import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const REQUIRED_KEYS = [
	'NEXT_PUBLIC_SUPABASE_URL',
	'NEXT_PUBLIC_SUPABASE_ANON_KEY',
	'SUPABASE_SERVICE_ROLE_KEY',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'SMTP_HOST',
	'SMTP_PORT',
	'SMTP_USER',
	'SMTP_PASS',
	'MAIL_FROM',
]

export async function GET() {
	const result: Record<string, boolean> = {}
	for (const key of REQUIRED_KEYS) {
		result[key] = Boolean(process.env[key] && String(process.env[key]).length > 0)
	}
	return NextResponse.json({ env: result })
}


