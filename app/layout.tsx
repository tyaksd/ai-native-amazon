import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileSearch from "./components/MobileSearch";
import LogoLink from "./components/LogoLink";
import ContactButton from "./components/ContactButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Godship - The AI E-Commerce",
  description: "Discover Products Made for You. Explore creations born from your taste, crafted on demand.",
  openGraph: {
    title: "Godship",
    description: "Discover Products Made for You. Explore creations born from your taste, crafted on demand.",
    images: [
      {
        url: "/gblack.png",
        width: 1200,
        height: 630,
        alt: "Godship - The AI E-Commerce",
      },
    ],
    type: "website",
    siteName: "Godship",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-gray-50 to-white text-gray-900`}
      >
       <header id="site-header" className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/30 bg-white/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-10 py-3 flex items-center gap-4 justify-center md:justify-between relative">
            <button className="md:hidden absolute left-3 inline-flex items-center justify-center p-2 text-gray-700" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
              </svg>
            </button>
            <LogoLink />
            <div className="hidden md:flex flex-1">
              <form action="/" method="get" className="w-full max-w-sm">
                <input
                  name="search"
                  type="search"
                  placeholder="Search brands or products"
                  className="w-full rounded-lg border border-white/30 bg-white/30 backdrop-blur-md px-4 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-0 focus:border-white/30"
                />
              </form>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/cart" className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M2.25 3.75a.75.75 0 000 1.5h1.862c.27 0 .505.181.574.442l2.14 8.023A2.25 2.25 0 008.996 15h7.258a2.25 2.25 0 002.17-1.607l1.6-5.6a.75.75 0 00-.72-.968H6.615l-.36-1.35A2.25 2.25 0 004.112 3.75H2.25z" />
                  <path d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9.75 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </Link>
              <Link href="#" className="inline-flex items-center rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50">
                Login
              </Link>
            </div>
            <div className="md:hidden absolute right-3 inline-flex items-center gap-2 text-gray-700">
              <MobileSearch />
              <button aria-label="Cart" className="p-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M2.25 3.75a.75.75 0 000 1.5h1.862c.27 0 .505.181.574.442l2.14 8.023A2.25 2.25 0 008.996 15h7.258a2.25 2.25 0 002.17-1.607l1.6-5.6a.75.75 0 00-.72-.968H6.615l-.36-1.35A2.25 2.25 0 004.112 3.75H2.25z" />
                  <path d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9.75 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl">
          {children}
        </main>
        <footer className="mt-16 bg-black text-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            <div className="md:col-span-2">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">The best selection of AI brands for you</h3>
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
      </body>
    </html>
  );
}
