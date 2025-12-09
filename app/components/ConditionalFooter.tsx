'use client'

import { usePathname } from 'next/navigation'
import Footer from "./Footer"

export default function ConditionalFooter() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  // Hide footer on home page
  if (isHomePage) {
    return null
  }

  return <Footer />
}

