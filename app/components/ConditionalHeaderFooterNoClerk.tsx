'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import MobileSearch from "./MobileSearch"
import MobileMenu from "./MobileMenu"
import LogoLink from "./LogoLink"
import Footer from "./Footer"

export default function ConditionalHeaderFooterNoClerk() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Hide header and footer on home page
  if (isHomePage) {
    return null
  }

  return (
    <>
      <header id="site-header" className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 md:supports-[backdrop-filter]:bg-white/10 bg-white/10 md:bg-white/20" style={{paddingTop: 'env(safe-area-inset-top)'}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-[10px] flex items-center gap-4 justify-center md:justify-between relative">
          <div className="md:hidden absolute left-3 inline-flex items-center gap-2">
            <MobileMenu className="relative" />
            <MobileSearch className="ml-1" />
          </div>
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
            <Link href="/followed-brands" className="inline-flex items-center justify-center p-2 text-gray-300 hover:text-white" title="Followed Brands">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <Link href="/favorites" className="inline-flex items-center justify-center p-2 text-gray-300 hover:text-white" title="Favorites">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link href="/cart" className="inline-flex items-center justify-center p-2 text-gray-300 hover:text-white">
              <img src="/cart3.png" alt="Cart" className="w-7 h-7" />
            </Link>
          </div>
          <div className="md:hidden absolute right-3 inline-flex items-center gap-2 text-gray-300">
            <Link href="/followed-brands" aria-label="Followed Brands" className="p-1 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <Link href="/favorites" aria-label="Favorites" className="p-1 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link href="/cart" aria-label="Cart" className="p-1">
              <img src="/cart3.png" alt="Cart" className="w-7 h-7" />
            </Link>
          </div>
        </div>
      </header>
      <Footer />
    </>
  )
}

