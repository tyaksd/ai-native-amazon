'use client'

import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="px-6 py-10 bg-[#FAFAF7] min-h-screen">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-semibold text-black">Payment canceled</h1>
        <p className="mt-4 text-black">Your payment was canceled. You can resume checkout anytime.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cart" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-700 transition-colors">
            Back to cart
          </Link>
          <Link href="/checkout" className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800 transition-colors">
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}


