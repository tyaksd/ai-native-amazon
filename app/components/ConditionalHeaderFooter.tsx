'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"
import MobileSearch from "./MobileSearch"
import MobileMenu from "./MobileMenu"
import LogoLink from "./LogoLink"
import ContactButton from "./ContactButton"

export default function ConditionalHeaderFooter() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Hide header and footer on home page
  if (isHomePage) {
    return null
  }

  return (
    <>
      <header id="site-header" className="fixed top-0 left-0 right-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 md:supports-[backdrop-filter]:bg-white/10 bg-white/10 md:bg-white/20" style={{paddingTop: 'env(safe-area-inset-top)'}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-[10px] flex items-center gap-4 justify-center md:justify-between relative">
          <MobileMenu />
          <LogoLink />
          <div className="hidden md:flex flex-1">
            <form action="/" method="get" className="w-full max-w-sm">
              <input
                name="search"
                type="search"
                placeholder="Search brands or products"
                className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-0 focus:border-white/20"
              />
            </form>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <SignedIn>
              <Link href="/user" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900" title="User Profile">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </SignedIn>
            <Link href="/favorites" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900" title="Favorites">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link href="/cart" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900">
              <img src="/cart2.png" alt="Cart" className="w-5 h-5" />
            </Link>
            <Link href="/followed-brands" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 ml-2" title="Followed Brands">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center rounded-md border border-gray-500 bg-transparent px-4 py-2 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center rounded-md border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-sm text-gray-700 hover:bg-white/20 hover:border-white/30 ml-2">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </div>
          <div className="md:hidden absolute right-3 inline-flex items-center gap-2 text-gray-700">
            <Link href="/followed-brands" aria-label="Followed Brands" className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <MobileSearch />
            <Link href="/favorites" aria-label="Favorites" className="=p-1 -ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link href="/cart" aria-label="Cart" className="p-1">
              <img src="/cart2.png" alt="Cart" className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>
      <footer className="mt-0 bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 pt-6">
          <h3 className="text-xl font-semibold text-white mb-1">Sign up for Godship</h3>
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
    </>
  )
}

