import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import "./globals.css";
import ConditionalHeader from "./components/ConditionalHeader";
import ConditionalFooter from "./components/ConditionalFooter";
import ConditionalHeaderNoClerk from "./components/ConditionalHeaderNoClerk";
import ConditionalFooterNoClerk from "./components/ConditionalFooterNoClerk";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   display: 'swap',
//   fallback: ['system-ui', 'arial'],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   display: 'swap',
//   fallback: ['monospace'],
// });

export const metadata: Metadata = {
  title: "Godship - The Next-Gen Streetwear Platform",
  description: "Discover brands you love and their unique products.",
  icons: {
    icon: "/gblack.png",
    shortcut: "/gblack.png",
    apple: "/gblack.png",
  },
  openGraph: {
    title: "Godship",
    description: "The Next-Gen Streetwear Platform",
    images: [
      {
        url: "/gblack.png",
        width: 1200,
        height: 630,
        alt: "Godship - The Next-Gen Streetwear Platform",
      },
    ],
    type: "website",
    siteName: "Godship",
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Debug: Log Clerk configuration
  if (typeof window === 'undefined') {
    console.log('Clerk Publishable Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set');
  }

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If Clerk is not configured (local development), render without ClerkProvider
  if (!clerkKey) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#000000" />
        </head>
        <body
          className="antialiased bg-gradient-to-b from-gray-50 to-white text-gray-900 font-sans"
        >
          <ConditionalHeaderNoClerk />
          <main className="mx-auto max-w-7xl" style={{paddingTop: 'calc(60px + env(safe-area-inset-top))'}}>
            {children}
          </main>
          <ConditionalFooterNoClerk />
      </body>
    </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#000000" />
        </head>
        <body
          className="antialiased bg-gradient-to-b from-gray-50 to-white text-gray-900 font-sans"
        >
          <ConditionalHeader />
          <main className="mx-auto max-w-7xl" style={{paddingTop: 'calc(60px + env(safe-area-inset-top))'}}>
            {children}
          </main>
          <ConditionalFooter />
      </body>
    </html>
    </ClerkProvider>
  );
}
