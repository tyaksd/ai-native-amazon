'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ContactButton from "./ContactButton"

export default function ConditionalFooter() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Hide footer on home page
  if (isHomePage) {
    return null
  }

  return (
    <footer className="mt-0 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 pt-6">
        <h3 className="text-xl font-semibold text-white mb-1">Sign up Godship</h3>
        <p className="text-white/80 text-sm">Get exclusive deals and early access to new products.</p>
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        <div className="md:col-span-2">
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-3">
          <div>
            <div className="text-sm font-semibold mb-3">Company</div>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/about" className="hover:underline">About us</Link></li>
              <li><Link href="/company/newsroom" className="hover:underline">Newsroom</Link></li>
              <li><Link href="/company/careers" className="hover:underline">Careers</Link></li>
              <li>
                <ContactButton />
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Explore</div>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/explore/help-center" className="hover:underline">FAQ</Link></li>
              <li><Link href="/explore/markets" className="hover:underline">Markets</Link></li>
            </ul>
            <div className="mt-4 flex items-center gap-4 text-white/80">
              <a href="https://www.instagram.com/godship.io?igsh=MWRlZ3Y1d3AyY3Btbw%3D%3D&utm_source=qr" aria-label="Instagram" className="hover:text-white" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 3.75A3.25 3.25 0 003.75 7v10A3.25 3.25 0 007 20.25h10A3.25 3.25 0 0020.25 17V7A3.25 3.25 0 0017 3.75H7zm5 3.25a5 5 0 110 10 5 5 0 010-10zm6-1a1 1 0 110 2 1 1 0 010-2zM12 9a3 3 0 100 6 3 3 0 000-6z"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13 10h3V7h-3V6a2 2 0 012-2h1V1h-2a4 4 0 00-4 4v2H9v3h2v8h3v-8z"/></svg>
              </a>
              <a href="https://x.com/godshipai?s=21" aria-label="X" className="hover:text-white" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 3h3l5 7 5-7h3l-6.5 9L19 21h-3l-4-5.5L8 21H5l6.5-9L3 3z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Legal</div>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/legal/terms-of-service" className="hover:underline">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/legal/cookie-policy" className="hover:underline">Cookie Policy</Link></li>
              <li><Link href="/legal/shipping-delivery" className="hover:underline">Shipping & Delivery</Link></li>
              <li><Link href="/legal/returns-refunds" className="hover:underline">Returns & Refunds</Link></li>
              <li><Link href="/legal/legal-notice" className="hover:underline">Legal Notice</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="e">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-6 text-xs text-white/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>©2025 Godship, Inc.</div>
        </div>
      </div>
    </footer>
  )
}

