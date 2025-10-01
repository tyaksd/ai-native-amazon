'use client'

import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Payment canceled</h1>
      <p className="mt-4 text-gray-700">Your payment was canceled. You can resume checkout anytime.</p>
      <div className="mt-6 flex gap-4">
        <Link href="/cart" className="text-blue-600 underline">Back to cart</Link>
        <Link href="/checkout" className="text-blue-600 underline">Try again</Link>
      </div>
    </div>
  )
}


