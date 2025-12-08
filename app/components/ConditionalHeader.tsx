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

export default function ConditionalHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Hide header on home page
  if (isHomePage) {
    return null
  }

  return (
    <header id="site-header" className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 md:supports-[backdrop-filter]:bg-white/10 bg-white/10 md:bg-white/20" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="mx-auto max-w-7xl px-4 sm:px-10 py-[10px] flex items-center gap-4 justify-center md:justify-between relative">
        <MobileMenu />
        <LogoLink />
        <div className="hidden md:flex flex-1">
          <form action="/search" method="get" className="w-full max-w-sm">
            <input
              name="q"
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
          <SignedIn>
            <Link href="/followed-brands" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900" title="Followed Brands">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
          <SignedIn>
            <Link href="/followed-brands" aria-label="Followed Brands" className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </SignedIn>
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
  )
}

