'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [clerkLoaded, setClerkLoaded] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Check if Clerk is loaded
  useEffect(() => {
    const checkClerk = () => {
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).Clerk) {
        setClerkLoaded(true);
      } else {
        setTimeout(checkClerk, 100);
      }
    };
    checkClerk();
  }, []);

  return (
    <>
      {/* Hamburger/Close Button */}
      <button 
        className="md:hidden absolute left-3 inline-flex items-center justify-center p-2 text-gray-700" 
        aria-label={isOpen ? "Close menu" : "Menu"}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-white relative">
              {/* Close Button */}
              <button 
                className="absolute top-4 left-4 p-2 text-gray-700 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Authentication Section */}
              <div className="pt-8 bg-white">
                {!clerkLoaded ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500 text-center py-4">
                      Loading authentication...
                    </div>
                  </div>
                ) : (
                  <>
                    <SignedOut>
                      <div className="space-y-3">
                        <SignInButton mode="modal">
                          <button className="w-full inline-flex items-center justify-center rounded-md border border-gray-500 bg-transparent px-4 py-3 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                            Login
                          </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <button className="w-full inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm text-white hover:bg-gray-800 transition-colors">
                            Sign Up
                          </button>
                        </SignUpButton>
                      </div>
                    </SignedOut>
                    <SignedIn>
                      <div className="space-y-3">
                        {/* User Profile Link */}
                        <Link 
                          href="/user" 
                          className="w-full inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm text-white hover:bg-gray-800 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>
                        
                        {/* Clerk UserButton */}
                        <div className="flex items-center justify-center">
                          <UserButton 
                            appearance={{
                              elements: {
                                avatarBox: "w-10 h-10"
                              }
                            }}
                          />
                        </div>
                      </div>
                    </SignedIn>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
