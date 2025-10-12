import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  // In development, always allow access
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ authenticated: true })
  }

  // Check for password in cookies
  const authToken = request.cookies.get('admin-auth')?.value
  
  if (authToken === ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
