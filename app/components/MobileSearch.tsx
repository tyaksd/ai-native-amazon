'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
// import { useRouter } from 'next/navigation' // Removed unused import

export default function MobileSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(64) // Fallback
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // const router = useRouter() // Removed unused router

  useEffect(() => setMounted(true), [])

  // Detect screen size to determine if mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Measure header height (initial & resize)
  useLayoutEffect(() => {
    const el = document.getElementById('site-header')
    const measure = () => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      setHeaderHeight(rect.height)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Close with Esc (optional)
  useEffect(() => {
    if (!isSearchOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsSearchOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isSearchOpen])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = (formData.get('search') as string) ?? ''
    if (query.trim()) {
      // Change to router.push if you want SPA
      window.location.href = `/?search=${encodeURIComponent(query)}`
      // router.push(`/?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <>
      {/* Trigger button in header */}
      <button
        onClick={() => setIsSearchOpen(true)}
        aria-label="Search"
        className="md:hidden p-2 text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.243 11.964l3.771 3.772a.75.75 0 101.06-1.06l-3.772-3.772A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Portal search UI directly under body (mobile only) */}
      {mounted && isSearchOpen && isMobile && createPortal(
        <>
          {/* Search bar (overlay on header) */}
          <div className="fixed  left-0 right-0 top-0 z-[100]">
            <div className="w-full">
               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md shadow-lg p-2 border border-white/20">
                <form
                  onSubmit={handleSearch}
                  className="w-full flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()} // Don't close on click inside search bar
                >
                  <input
                    name="search"
                    type="search"
                    placeholder="Search brands or products"
                    autoFocus
                      className="flex-1 border border-white/20 bg-white/10 backdrop-blur-md px-3 py-1 text-lg placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Backdrop to close on click outside header (transparent) */}
          <div
            className="fixed inset-x-0 bottom-0 z-[90]"
            style={{ top: headerHeight }}
            onClick={() => setIsSearchOpen(false)}
          />
          {/* For debugging: temporarily add bg-black/10 to above to easily see the area */}
        </>,
        document.body
      )}
    </>
  )
}
