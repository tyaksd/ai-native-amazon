'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Component, ReactNode } from "react";
import { getProductById, Product } from "@/lib/data";
import { loadStripe } from '@stripe/stripe-js';
import { useUser } from "@clerk/nextjs";
import { 
  loadCartFromDB, 
  saveCartItemToDB, 
  removeCartItemFromDB,
  migrateCartToLoggedInUser,
  type CartItem as CartItemType
} from "@/lib/cart";

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Error boundary component to catch Clerk hook errors
class ClerkErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Only log if it's a Clerk-related error
    if (error.message?.includes('ClerkProvider') || error.message?.includes('useUser')) {
      console.warn('CartPage: Clerk not available, using session_id only')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Type definition for Apple Pay
declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments(): boolean;
    };
  }
}

type CartItem = {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// Fallback version that doesn't use Clerk hooks
// Can also be used by Inner component with authentication props
function CartFallback({ 
  user: providedUser,
  clerkId: providedClerkId,
  onCartMigrate
}: {
  user?: { id?: string } | null
  clerkId?: string | null
  onCartMigrate?: (sessionId: string, clerkId: string) => Promise<boolean | void>
} = {}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<(Product & { quantity: number })[]>([]);
  const [stripe, setStripe] = useState<unknown>(null);
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  // Use provided user or fallback to null (for fallback mode)
  const user: { id?: string } | null = providedUser ?? null;
  const clerkId = providedClerkId ?? null;

  useEffect(() => {
    const load = async () => {
      setIsLoadingCart(true);
      
      // If user just logged in, migrate cart from session to clerk_id
      if (clerkId && typeof window !== 'undefined' && onCartMigrate) {
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
          await onCartMigrate(sessionId, clerkId);
        }
      }
      
      // Load cart from database (for both logged-in and non-logged-in users)
      let items: CartItem[] = [];
      const dbItems = await loadCartFromDB(clerkId);
      items = dbItems;
      
      // If no items from database, try localStorage as fallback (for non-logged-in users)
      if (items.length === 0 && !clerkId) {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedItems: CartItem[] = JSON.parse(savedCart);
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          items = parsedItems.filter(item => uuidRegex.test(item.id))
        }
      }
      
      setCartItems(items);
      
      // Load product details
      const productDetails = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.id);
          return product ? { ...product, quantity: item.quantity, sizes: product.sizes, colors: product.colors } : null;
        })
      );
      setProducts(productDetails.filter(Boolean) as (Product & { quantity: number })[]);
      setIsLoadingCart(false);
    }
    load();
  }, [clerkId, onCartMigrate]);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey) {
        console.warn('Stripe publishable key not configured');
        return;
      }
      
      const stripeInstance = await loadStripe(stripeKey);
      setStripe(stripeInstance);
      
      // Check Apple Pay availability
      const isApplePaySupported = () => {
        return typeof window !== 'undefined' && 
               window.ApplePaySession && 
               window.ApplePaySession.canMakePayments();
      };
      
      setIsApplePayAvailable(isApplePaySupported() || false);
    };
    
    initializeStripe();
  }, []);

  const removeFromCart = async (productId: string, size?: string | null, color?: string | null) => {
    const updatedCart = cartItems.filter(item => !(item.id === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null)));
    setCartItems(updatedCart);
    setProducts(products.filter(p => !(p.id === productId)));
    
    // Update database (for both logged-in and non-logged-in users)
    await removeCartItemFromDB(clerkId, productId, size, color);
    
    // Also update localStorage for non-logged-in users as backup
    if (!clerkId) {
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number, size?: string | null, color?: string | null) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId, size, color);
      return;
    }

    const updatedCart = cartItems.map(item => 
      (item.id === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null)) ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    
    setProducts(products.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ));
    
    // Update database (for both logged-in and non-logged-in users)
    const item = updatedCart.find(i => i.id === productId && (i.size || null) === (size || null) && (i.color || null) === (color || null));
    if (item) {
      await saveCartItemToDB(clerkId, item);
    }
    
    // Also update localStorage for non-logged-in users as backup
    if (!clerkId) {
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const getTotalPrice = () => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  const handleApplePay = async () => {
    if (!stripe || !isApplePayAvailable) return;

    try {
      // Validate product IDs before Apple Pay checkout
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const validProducts = products.filter(p => {
        if (!uuidRegex.test(p.id)) {
          console.error('Invalid product ID in Apple Pay:', p.id)
          return false
        }
        return true
      })
      
      if (validProducts.length === 0) {
        console.error('No valid products for Apple Pay')
        return
      }
      
      const items = validProducts.map((p, idx) => ({ 
        id: p.id, 
        name: p.name, 
        price: p.price, 
        quantity: p.quantity,
        size: cartItems[idx]?.size || null,
        color: cartItems[idx]?.color || null,
      }));

      // Get session_id for non-logged-in users
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') || undefined : undefined

      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, session_id: sessionId })
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        console.error('Checkout session error:', data);
        return;
      }

      // Redirect to Stripe Checkout (Apple Pay will be displayed automatically)
      window.location.href = data.url;
    } catch (e) {
      console.error('Apple Pay error:', e);
    }
  };

  if (isLoadingCart) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 bg-black min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">YOUR CART</h1>
          <p className="text-gray-400 mb-8">Loading...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 bg-black min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">YOUR CART</h1>
          <p className="text-gray-400 mb-8">Your cart is empty</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-2 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">YOUR CART</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {products.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white">
                <Image 
                  src={product.images && product.images.length > 0 ? product.images[0] : '/clothingsample.png'} 
                  alt={product.name} 
                  width={80} 
                  height={80} 
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  {(cartItems[idx]?.size || cartItems[idx]?.color) && (
                    <p className="text-sm text-gray-600">{cartItems[idx]?.size ? `Size: ${cartItems[idx]?.size}` : ''} {cartItems[idx]?.color ? `Color: ${cartItems[idx]?.color}` : ''}</p>
                  )}
                  <p className="text-lg font-semibold text-gray-900">{formatUSD(product.price)}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(product.id, product.quantity - 1, cartItems[idx]?.size || null, cartItems[idx]?.color || null)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{product.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(product.id, product.quantity + 1, cartItems[idx]?.size || null, cartItems[idx]?.color || null)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(product.id, cartItems[idx]?.size || null, cartItems[idx]?.color || null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-6.5 0a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-black p-6 rounded-lg sticky top-8 border ">
            <h2 className="text-lg font-semibold text-white mb-4">ORDER SUMMARY</h2>
            <div className="space-y-2 mb-4">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between text-sm text-white">
                  <span>{product.name} x{product.quantity}</span>
                  <span>{formatUSD(product.price * product.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>{formatUSD(getTotalPrice())}</span>
              </div>
            </div>
            {/* Apple Pay Button */}
            {isApplePayAvailable && (
              <button 
                className="w-full mt-4 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                onClick={handleApplePay}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Pay with Apple Pay
              </button>
            )}
            
            <button 
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                void (async () => {
                  try {
                    // Validate product IDs before checkout
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    const validProducts = products.filter(p => {
                      if (!uuidRegex.test(p.id)) {
                        console.error('Invalid product ID in cart:', p.id)
                        return false
                      }
                      return true
                    })
                    
                    if (validProducts.length === 0) {
                      console.error('No valid products in cart')
                      return
                    }
                    
                    const items = validProducts.map((p, idx) => ({ 
                      id: p.id, 
                      name: p.name, 
                      price: p.price, 
                      quantity: p.quantity,
                      size: cartItems[idx]?.size || null,
                      color: cartItems[idx]?.color || null,
                    }))
                    if (!items.length) return
                    
                    // Get session_id for non-logged-in users
                    // Get session_id for non-logged-in users
                    let sessionId: string | undefined = undefined
                    if (!user?.id && typeof window !== 'undefined') {
                      sessionId = localStorage.getItem('session_id') || undefined
                    }
                    
                    const res = await fetch('/api/checkout_sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items, session_id: sessionId })
                    })
                    const data = await res.json()
                    if (!res.ok || !data?.url) {
                      console.error('Checkout session error:', data)
                      return
                    }
                    window.location.href = data.url as string
                  } catch (e) {
                    console.error(e)
                  }
                })()
              }}
            >
              Buy Now
            </button>
            <Link href="/" className="block text-center text-sm text-gray-400 hover:text-gray-300 mt-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Outer component that conditionally renders based on Clerk configuration
export default function Cart() {
  // If Clerk is not configured, use fallback component
  if (!isClerkConfigured) {
    return <CartFallback />
  }

  // If Clerk is configured, use error boundary with fallback
  return (
    <ClerkErrorBoundary fallback={<CartFallback />}>
      <CartInner />
    </ClerkErrorBoundary>
  )
}

// Main version that uses Clerk hooks
function CartInner() {
  const { user, isLoaded } = useUser();

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 bg-black min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">YOUR CART</h1>
          <p className="text-gray-400 mb-8">Loading...</p>
        </div>
      </div>
    );
  }

  // Reuse CartFallback for layout - only authentication logic differs
  return (
    <CartFallback 
      user={user}
      clerkId={user?.id || null}
      onCartMigrate={migrateCartToLoggedInUser}
    />
  );
}
