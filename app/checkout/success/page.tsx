'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function SuccessPage() {
  useEffect(() => {
    // Clear cart on success
    try { localStorage.removeItem('cart') } catch {}
  }, [])

  return (
    <div className="px-6 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-2.59a.75.75 0 10-1.22-.86l-3.436 4.868-1.73-1.732a.75.75 0 10-1.06 1.06l2.4 2.4a.75.75 0 001.174-.106l3.872-5.63z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Thank you for purchasing!</h1>
        <p className="mt-4 text-gray-600">We truly appreciate your business. Your order has been received and is being processed. A confirmation email will arrive shortly.</p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-6">
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}


