'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getProductById, Product } from "@/lib/data";

type CartItem = {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<(Product & { quantity: number })[]>([]);

  useEffect(() => {
    const load = async () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items: CartItem[] = JSON.parse(savedCart);
        setCartItems(items);
        const productDetails = await Promise.all(
          items.map(async (item) => {
            const product = await getProductById(item.id);
            return product ? { ...product, quantity: item.quantity, sizes: product.sizes, colors: product.colors } : null;
          })
        );
        setProducts(productDetails.filter(Boolean) as (Product & { quantity: number })[]);
      }
    }
    load();
  }, []);

  const removeFromCart = (productId: string, size?: string | null, color?: string | null) => {
    const updatedCart = cartItems.filter(item => !(item.id === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null)));
    setCartItems(updatedCart);
    setProducts(products.filter(p => !(p.id === productId)));
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (productId: string, newQuantity: number, size?: string | null, color?: string | null) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    const updatedCart = cartItems.map(item => 
      (item.id === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null)) ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    
    setProducts(products.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ));
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getTotalPrice = () => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  if (products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-8">Your cart is empty</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {products.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <Image 
                  src={product.images && product.images.length > 0 ? product.images[0] : '/clothingsample.png'} 
                  alt={product.name} 
                  width={80} 
                  height={80} 
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.id.toUpperCase()}</p>
                  {(cartItems[idx]?.size || cartItems[idx]?.color) && (
                    <p className="text-sm text-gray-600">{cartItems[idx]?.size ? `Size: ${cartItems[idx]?.size}` : ''} {cartItems[idx]?.color ? `Color: ${cartItems[idx]?.color}` : ''}</p>
                  )}
                  <p className="text-lg font-semibold text-gray-900">{formatUSD(product.price)}</p>
                </div>
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
                  className="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-6.5 0a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>{product.name} x{product.quantity}</span>
                  <span>{formatUSD(product.price * product.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatUSD(getTotalPrice())}</span>
              </div>
            </div>
            <button 
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                void (async () => {
                  try {
                    const items = products.map((p, idx) => ({ 
                      id: p.id, 
                      name: p.name, 
                      price: p.price, 
                      quantity: p.quantity,
                      size: cartItems[idx]?.size || null,
                      color: cartItems[idx]?.color || null,
                    }))
                    if (!items.length) return
                    const res = await fetch('/api/checkout_sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items })
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
            <Link href="/" className="block text-center text-sm text-gray-600 hover:text-gray-800 mt-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
