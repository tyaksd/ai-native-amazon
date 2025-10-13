'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
  size: string | null
  color: string | null
  i_sent_to_printful: boolean
  printful_sent: boolean
  problem: string | null
}

interface Order {
  id: string
  stripe_session_id: string
  total_amount: number
  currency: string
  is_paid: boolean
  customer_email: string | null
  shipping_name: string | null
  shipping_address: Record<string, unknown> | null
  billing_name: string | null
  billing_address: Record<string, unknown> | null
  created_at: string
  printful_order_id: string | null
  printful_external_id: string | null
  order_items: OrderItem[]
}

interface Product {
  id: string
  name: string
  images: string[]
  price: number
  brand_id: string
  description: string | null
  category: string
  type: string
  colors: string[]
  sizes: string[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [showTodayOnly, setShowTodayOnly] = useState(false)
  const [problemTexts, setProblemTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    // ページの先頭にスクロール
    window.scrollTo(0, 0)
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // オーダーとオーダーアイテムを取得
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            unit_price,
            quantity,
            size,
            color,
            i_sent_to_printful,
            printful_sent,
            problem
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersError) {
        throw ordersError
      }

      console.log('=== FETCHED ORDERS DATA ===')
      console.log('Total orders:', ordersData?.length || 0)
      if (ordersData && ordersData.length > 0) {
        console.log('First order:', ordersData[0])
        console.log('First order items:', ordersData[0].order_items)
        if (ordersData[0].order_items && ordersData[0].order_items.length > 0) {
          const firstItem = ordersData[0].order_items[0]
          console.log('First item details:', {
            id: firstItem.id,
            i_sent_to_printful: firstItem.i_sent_to_printful,
            printful_sent: firstItem.printful_sent,
            problem: firstItem.problem
          })
        }
      }
      console.log('=== END FETCHED DATA ===')

      setOrders(ordersData || [])

      // 問題テキストの状態を初期化
      const problemTextsMap: Record<string, string> = {}
      ordersData?.forEach(order => {
        order.order_items?.forEach((item: OrderItem) => {
          if (item.problem) {
            problemTextsMap[item.id] = item.problem
          }
        })
      })
      setProblemTexts(problemTextsMap)

      // 商品情報を取得
      const productIds = new Set<string>()
      ordersData?.forEach(order => {
        order.order_items?.forEach((item: OrderItem) => {
          if (item.product_id) {
            productIds.add(item.product_id)
          }
        })
      })

      if (productIds.size > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', Array.from(productIds))

        if (productsError) {
          console.error('Products fetch error:', productsError)
        } else {
          const productsMap = productsData?.reduce((acc, product) => {
            acc[product.id] = product
            return acc
          }, {} as Record<string, Product>) || {}
          setProducts(productsMap)
        }
      }

    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  const getProductImage = (productId: string | null) => {
    if (!productId || !products[productId]) {
      return '/placeholder-image.svg'
    }
    const product = products[productId]
    return product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.svg'
  }

  const getShippingAddress = (address: Record<string, unknown> | null) => {
    if (!address) return 'N/A'
    const parts = []
    if (address.line1) parts.push(address.line1)
    if (address.line2) parts.push(address.line2)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postal_code) parts.push(address.postal_code)
    if (address.country) parts.push(address.country)
    return parts.join(', ')
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const isToday = (dateString: string) => {
    const orderDate = new Date(dateString)
    const today = new Date()
    return orderDate.toDateString() === today.toDateString()
  }

  const handleCheckboxChange = async (orderItemId: string, field: 'i_sent_to_printful' | 'printful_sent', checked: boolean) => {
    try {
      console.log('=== CHECKBOX UPDATE START ===')
      console.log('Order Item ID:', orderItemId)
      console.log('Field:', field)
      console.log('Checked:', checked)
      
      const { data, error } = await supabase
        .from('order_items')
        .update({ [field]: checked })
        .eq('id', orderItemId)
        .select('id, i_sent_to_printful, printful_sent, problem')

      if (error) {
        console.error('❌ Database error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      console.log('✅ Database update successful')
      console.log('Updated data:', data)

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items?.map(item => 
            item.id === orderItemId 
              ? { ...item, [field]: checked }
              : item
          ) || []
        }))
      )
      
      console.log('✅ Local state updated')
      console.log('=== CHECKBOX UPDATE END ===')
    } catch (err) {
      console.error('❌ Exception in handleCheckboxChange:', err)
    }
  }

  const handleProblemCheckboxChange = async (orderItemId: string, checked: boolean) => {
    try {
      const problemValue = checked ? '.' : null
      console.log('Updating problem checkbox:', { orderItemId, checked, problemValue })
      
      const { data, error } = await supabase
        .from('order_items')
        .update({ problem: problemValue })
        .eq('id', orderItemId)
        .select('id, i_sent_to_printful, printful_sent, problem')

      if (error) {
        console.error('Error updating order item problem:', error)
        return
      }

      console.log('✅ Problem database update successful')
      console.log('Updated problem data:', data)

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items?.map(item => 
            item.id === orderItemId 
              ? { ...item, problem: problemValue }
              : item
          ) || []
        }))
      )
    } catch (err) {
      console.error('Error updating order item problem:', err)
    }
  }

  const handleProblemTextChange = async (orderItemId: string, text: string) => {
    try {
      console.log('Updating problem text:', { orderItemId, text })
      
      const { data, error } = await supabase
        .from('order_items')
        .update({ problem: text })
        .eq('id', orderItemId)
        .select('id, i_sent_to_printful, printful_sent, problem')

      if (error) {
        console.error('Error updating problem text:', error)
        return
      }

      console.log('✅ Problem text update successful')
      console.log('Updated problem text data:', data)

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items?.map(item => 
            item.id === orderItemId 
              ? { ...item, problem: text }
              : item
          ) || []
        }))
      )
    } catch (err) {
      console.error('Error updating problem text:', err)
    }
  }

  const filteredOrders = showTodayOnly 
    ? orders.filter(order => isToday(order.created_at))
    : orders

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">An error occurred</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
          <div className="mt-2 flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTodayOnly}
                onChange={(e) => setShowTodayOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Today</span>
            </label>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {showTodayOnly ? 'No orders found for today' : 'No orders found'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Items Summary - Clickable */}
                <div 
                  className="p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between ">
                        
                        <p className="text-sm text-gray-500">
                         {formatDate(order.created_at)}
                        </p>
                      </div>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg mb-1">
                          <div className="flex items-center space-x-1 p-2">
                            {/* Printful Status Checkboxes */}
                            <div className="flex flex-col space-y-1" onClick={(e) => e.stopPropagation()}>
                              <label className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={item.i_sent_to_printful}
                                  onChange={(e) => handleCheckboxChange(item.id, 'i_sent_to_printful', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-600">I sent</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={item.printful_sent}
                                  onChange={(e) => handleCheckboxChange(item.id, 'printful_sent', e.target.checked)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-gray-600">P sent</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={!!item.problem}
                                  onChange={(e) => handleProblemCheckboxChange(item.id, e.target.checked)}
                                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-gray-600">Problem</span>
                              </label>
                            </div>
                            
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <Image
                                src={getProductImage(item.product_id)}
                                alt={item.product_name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder-image.svg'
                                }}
                              />
                            </div>
                            
                            {/* Product Information */}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {item.product_name}
                              </h5>
                              <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                <span>Qty: {item.quantity}</span>
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            </div>
                            
                            {/* Price */}
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.unit_price, order.currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Subtotal: {formatCurrency(item.unit_price * item.quantity, order.currency)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Problem Text Area - 商品の下に表示される */}
                          {item.problem && (
                            <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={problemTexts[item.id] || (item.problem === 'Problem reported' ? '' : item.problem) || ''}
                                onChange={(e) => {
                                  setProblemTexts(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value
                                  }))
                                }}
                                onBlur={(e) => {
                                  if (e.target.value.trim()) {
                                    handleProblemTextChange(item.id, e.target.value.trim())
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="問題の詳細を記述してください..."
                                className="w-full p-2 text-xs border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="ml-4 flex items-center">
                      <div className="text-right mr-4">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(order.total_amount, order.currency)}
                        </div>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          order.is_paid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.is_paid ? 'Paid' : 'Unpaid'}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {expandedOrders.has(order.id) ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrders.has(order.id) && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stripe Session: {order.stripe_session_id}
                          </p>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Customer Information</h4>
                          <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {order.customer_email || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Shipping Name:</strong> {order.shipping_name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Shipping Address:</strong> {getShippingAddress(order.shipping_address)}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Billing Information</h4>
                          <p className="text-sm text-gray-600">
                            <strong>Billing Name:</strong> {order.billing_name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Billing Address:</strong> {getShippingAddress(order.billing_address)}
                          </p>
                        </div>
                      </div>

                      {/* Printful Information - Temporarily disabled */}
                      {/* TODO: Re-enable when Printful integration is restored
                      {(order.printful_order_id || order.printful_external_id) && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Printful Information</h4>
                          <p className="text-sm text-gray-600">
                            <strong>Printful Order ID:</strong> {order.printful_order_id || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>External ID:</strong> {order.printful_external_id || 'N/A'}
                          </p>
                        </div>
                      )}
                      */}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
