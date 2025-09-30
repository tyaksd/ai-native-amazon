'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getProductById, Product } from '@/lib/data'

type CartItem = { id: string; quantity: number }

function formatUSD(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function CheckoutPage() {
  const [items, setItems] = useState<(Product & { quantity: number })[]>([])

  useEffect(() => {
    const load = async () => {
      const savedCart = localStorage.getItem('cart')
      const cart: CartItem[] = savedCart ? JSON.parse(savedCart) : []
      const products = await Promise.all(
        cart.map(async (ci) => {
          const p = await getProductById(ci.id)
          return p ? { ...p, quantity: ci.quantity } : null
        })
      )
      setItems(products.filter(Boolean) as (Product & { quantity: number })[])
    }
    load()
  }, [])

  const total = items.reduce((sum, p) => sum + p.price * p.quantity, 0)

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
      {items.length === 0 ? (
        <div className="mt-6 text-gray-700">
          Your cart is empty.
          <div className="mt-4">
            <Link href="/" className="text-blue-600 underline">Back to Home</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded-md p-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">x{p.quantity}</div>
                </div>
                <div className="text-gray-900">{formatUSD(p.price * p.quantity)}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatUSD(total)}</span>
              </div>
              <button className="w-full mt-6 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors">
                Place Order
              </button>
              <p className="mt-3 text-xs text-gray-500">This is a placeholder checkout page.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


