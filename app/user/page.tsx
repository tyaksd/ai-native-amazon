import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AccountInfo from '@/app/components/AccountInfo';

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
  // New Printful fields for individual item tracking
  printful_item_id: string | null
  printful_variant_id: number | null
  printful_product_id: number | null
  printful_tracking_number: string | null
  printful_shipment_id: string | null
  printful_status: string | null
  printful_fulfillment_status: string | null
  printful_error_message: string | null
  printful_retry_count: number
  printful_last_updated: string | null
  printful_estimated_delivery_date: string | null
  printful_estimated_delivery_timestamp: string | null
  printful_shipment_number: string | null
  manual_estimated_delivery: string | null
  // Product information
  products?: {
    id: string
    name: string
    images: string[]
  } | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface OrderItemWithProducts extends OrderItem {
  products?: {
    id: string
    name: string
    images: string[]
  } | null
}

interface Order {
  id: string
  total_amount: number
  currency: string
  is_paid: boolean
  created_at: string
  order_items: Record<string, unknown>[]
  shipping_address?: Record<string, unknown>
  billing_address?: Record<string, unknown>
  billing_name?: string
}

export default async function UserPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // Redirect to login if not authenticated
  if (!userId || !user) {
    redirect('/');
  }

  // Fetch user's current orders (not delivered or delivered within 2 weeks)
  const { data: currentOrders, error: currentOrdersError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      currency,
      is_paid,
      created_at,
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
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        printful_shipment_id,
        printful_error_message,
        printful_last_updated,
        printful_estimated_delivery_date,
        printful_estimated_delivery_timestamp,
        printful_shipment_number,
        manual_estimated_delivery
      )
    `)
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false });

  // Fetch user's order history (delivered orders older than 2 weeks)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const { data: orderHistory, error: orderHistoryError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      currency,
      is_paid,
      created_at,
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
        printful_status,
        printful_fulfillment_status,
        printful_tracking_number,
        printful_shipment_id,
        printful_error_message,
        printful_last_updated,
        printful_estimated_delivery_date,
        printful_estimated_delivery_timestamp,
        printful_shipment_number,
        manual_estimated_delivery
      )
    `)
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false });

  // Filter current orders (not delivered or delivered within 2 weeks)
  const filteredCurrentOrders = currentOrders?.filter(order => {
    const hasDeliveredItems = order.order_items.some(item => 
      item.printful_fulfillment_status === 'delivered'
    );
    
    if (!hasDeliveredItems) return true; // Include non-delivered orders
    
    // Check if delivered items are older than 2 weeks
    const deliveredItems = order.order_items.filter(item => 
      item.printful_fulfillment_status === 'delivered' && item.printful_last_updated
    );
    
    if (deliveredItems.length === 0) return true;
    
    const oldestDeliveredDate = new Date(Math.min(...deliveredItems.map(item => 
      new Date(item.printful_last_updated!).getTime()
    )));
    
    return oldestDeliveredDate > twoWeeksAgo;
  }) || [];

  // Filter order history (delivered orders older than 2 weeks)
  const filteredOrderHistory = orderHistory?.filter(order => {
    const hasDeliveredItems = order.order_items.some(item => 
      item.printful_fulfillment_status === 'delivered'
    );
    
    if (!hasDeliveredItems) return false; // Exclude non-delivered orders
    
    // Check if delivered items are older than 2 weeks
    const deliveredItems = order.order_items.filter(item => 
      item.printful_fulfillment_status === 'delivered' && item.printful_last_updated
    );
    
    if (deliveredItems.length === 0) return false;
    
    const oldestDeliveredDate = new Date(Math.min(...deliveredItems.map(item => 
      new Date(item.printful_last_updated!).getTime()
    )));
    
    return oldestDeliveredDate <= twoWeeksAgo;
  }) || [];

  // Fetch product images for current orders
  let currentOrdersWithImages = filteredCurrentOrders;
  if (filteredCurrentOrders.length > 0) {
    const productIds = filteredCurrentOrders
      .flatMap(order => order.order_items)
      .map(item => item.product_id)
      .filter((id): id is string => id !== null);

    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds);

      currentOrdersWithImages = filteredCurrentOrders.map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          products: item.product_id ? products?.find(p => p.id === item.product_id) || null : null
        }))
      }));
    }
  }

  // Fetch product images for order history
  let orderHistoryWithImages = filteredOrderHistory;
  if (filteredOrderHistory.length > 0) {
    const productIds = filteredOrderHistory
      .flatMap(order => order.order_items)
      .map(item => item.product_id)
      .filter((id): id is string => id !== null);

    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds);

      orderHistoryWithImages = filteredOrderHistory.map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          products: item.product_id ? products?.find(p => p.id === item.product_id) || null : null
        }))
      }));
    }
  }

  if (currentOrdersError || orderHistoryError) {
    console.error('Error fetching orders:', currentOrdersError || orderHistoryError);
  }

  // Function to determine order status based on Printful data
  const getOrderStatus = (order: Order) => {
    if (!order.is_paid) {
      return { status: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (!order.order_items || order.order_items.length === 0) {
      return { status: 'Processing', color: 'bg-blue-100 text-blue-800' };
    }
    
    // Check Printful status for each item
    const hasPrintfulData = order.order_items.some((item: Record<string, unknown>) => item.printful_status);
    const hasErrors = order.order_items.some((item: Record<string, unknown>) => item.printful_error_message);
    const allFulfilled = order.order_items.every((item: Record<string, unknown>) => 
      item.printful_fulfillment_status === 'delivered' || 
      item.printful_fulfillment_status === 'shipped'
    );
    const anyShipped = order.order_items.some((item: Record<string, unknown>) => 
      item.printful_fulfillment_status === 'shipped' || 
      item.printful_fulfillment_status === 'delivered'
    );
    const anyInProcess = order.order_items.some((item: Record<string, unknown>) => 
      item.printful_status === 'inprocess'
    );
    const anyPending = order.order_items.some((item: Record<string, unknown>) => 
      item.printful_status === 'pending'
    );
    
    if (hasErrors) {
      return { status: 'Issue with Fulfillment', color: 'bg-red-100 text-red-800' };
    }
    
    if (allFulfilled) {
      return { status: 'Delivered', color: 'bg-green-100 text-green-800' };
    }
    
    if (anyShipped) {
      return { status: 'Shipped', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (anyInProcess) {
      return { status: 'Being Fulfilled', color: 'bg-purple-100 text-purple-800' };
    }
    
    if (anyPending) {
      return { status: 'Pending Fulfillment', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (hasPrintfulData) {
      return { status: 'Sent to Printful', color: 'bg-indigo-100 text-indigo-800' };
    }
    
    // Check if all items have been sent to Printful
    const allItemsSentToPrintful = order.order_items.every((item: Record<string, unknown>) => item.i_sent_to_printful === true);
    
    if (allItemsSentToPrintful) {
      return { status: 'Sent to Printful', color: 'bg-indigo-100 text-indigo-800' };
    }
    
    return { status: 'Processing', color: 'bg-blue-100 text-blue-800' };
  };

  // Function to get estimated delivery date - Only manual input (unused but kept for potential future use)
  /*
  const getEstimatedDelivery = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) return null;
    
    // Only check for manual estimated delivery
    const manualDelivery = order.order_items.find((item: OrderItem) => item.manual_estimated_delivery);
    if (manualDelivery) {
      return manualDelivery.manual_estimated_delivery;
    }
    
    // No fallback to Printful data - only show manual input
    return null;
  };
  */

  // Helper function to check if item has product images
  const hasProductImages = (item: Record<string, unknown>) => {
    const products = item.products as Record<string, unknown> | null;
    return products && 
           'images' in products &&
           Array.isArray(products.images) &&
           products.images.length > 0;
  };

  const getProductImage = (item: Record<string, unknown>) => {
    if (hasProductImages(item)) {
      const products = item.products as Record<string, unknown>;
      return (products.images as string[])[0];
    }
    return '/placeholder-image.svg';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-[#FAFAF7] rounded-lg p-6">
          <h1 className="text-3xl font-bold text-black">Welcome, {user.firstName || 'User'}!</h1>
        </div>

        {/* Account Information */}
        <AccountInfo 
          userId={userId} 
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            emailAddresses: user.emailAddresses.map(email => ({
              emailAddress: email.emailAddress,
              verification: {
                status: email.verification?.status || 'unverified'
              }
            })),
            createdAt: user.createdAt
          }} 
        />

        {/* Current Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders</h2>
          <div className="space-y-4">
            {currentOrdersWithImages && currentOrdersWithImages.length > 0 ? (
              currentOrdersWithImages.flatMap((order) => 
                order.order_items.map((item) => {
                  const orderStatus = getOrderStatus(order);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">Order #{item.id}</h3>
                          {item.printful_shipment_number && (
                            <p className="text-xs text-gray-500 font-mono">
                              {item.printful_shipment_number}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.unit_price * item.quantity).toFixed(2)} {order.currency.toUpperCase()}
                          </p>
                          <div className="flex flex-col items-end gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.is_paid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.is_paid ? 'Paid' : 'Pending Payment'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatus.color}`}>
                              {orderStatus.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex items-start gap-3">
                        {/* Product Image */}
                        {hasProductImages(item) ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={getProductImage(item)}
                              alt={item.product_name}
                              width={60}
                              height={60}
                              className="w-15 h-15 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-15 h-15 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-600">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && ' • '}
                            {item.color && `Color: ${item.color}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      
                      {/* Printful Status Information - Simplified */}
                      {item.printful_tracking_number && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tracking:</span>
                            <span className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                              {item.printful_tracking_number}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {item.printful_error_message && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500">Error:</span>
                            <span className="text-xs text-red-600">
                              {item.printful_error_message}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Estimated Delivery - Only show manual input */}
                      {item.manual_estimated_delivery && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-900">Estimated Delivery:</span>
                            <span className="text-sm text-blue-700">
                              {item.manual_estimated_delivery}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">When you make your first purchase, your order history will appear here.</p>
                <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Order History Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
          <div className="space-y-4">
            {orderHistoryWithImages && orderHistoryWithImages.length > 0 ? (
              orderHistoryWithImages.flatMap((order) => 
                order.order_items.map((item) => {
                  const orderStatus = getOrderStatus(order);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">Order #{item.id}</h3>
                          {item.printful_shipment_number && (
                            <p className="text-xs text-gray-500 font-mono">
                              {item.printful_shipment_number}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.unit_price * item.quantity).toFixed(2)} {order.currency.toUpperCase()}
                          </p>
                          <div className="flex flex-col items-end gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.is_paid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.is_paid ? 'Paid' : 'Pending Payment'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatus.color}`}>
                              {orderStatus.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={getProductImage(item)}
                            alt={item.product_name}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product_name}
                          </h4>
                          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Details */}
                      {(item.printful_tracking_number || item.printful_error_message) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Status Details</h5>
                          <div className="space-y-1 text-xs text-gray-600">
                            {item.printful_tracking_number && (
                              <p><strong>Tracking:</strong> {item.printful_tracking_number}</p>
                            )}
                            {item.printful_error_message && (
                              <p className="text-red-600"><strong>Error:</strong> {item.printful_error_message}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Estimated Delivery - Only show manual input */}
                      {item.manual_estimated_delivery && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-900">Estimated Delivery:</span>
                            <span className="text-sm text-blue-700">
                              {item.manual_estimated_delivery}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No order history yet</h3>
                <p className="text-gray-600">Delivered orders older than 2 weeks will appear here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
