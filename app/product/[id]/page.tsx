'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from 'react'
import { getProductById, getBrandById, getProductsByBrand, Product, Brand } from "@/lib/data";
import ProductCarousel from "@/app/components/ProductCarousel";
import FavoriteButton from "@/app/components/FavoriteButton";
import SizeChart from "@/app/components/SizeChart";
import { useFavorites } from "@/lib/useFavorites";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getColorFromName(colorName: string): string {
  const colorMap: { [key: string]: string } = {
    // Basic colors
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#d1d2d6',
    'red': '#FF1B2B',
    'blue': '#2665CC',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    
    // Fashion colors
    'navy': '#0f1830',
    'olive': '#808000',
    'charcoal': '#36454F',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'khaki': '#F0E68C',
    
    // Specific brand colors
    'dark heather': '#424848',
    'darkheather': '#424848',
    'sand': '#d8c5a9',
    'natural': '#fff6ea',
    'military green': '#686f54',
    'militarygreen': '#686f54',
    
    // Sky colors
    'sky blue': '#87CEEB',
    'skyblue': '#87CEEB',
    'light blue': '#ADD8E6',
    'lightblue': '#ADD8E6',
    'dark blue': '#00008B',
    'darkblue': '#00008B',
    
    // Red variations
    'dark red': '#8B0000',
    'darkred': '#8B0000',
    'light red': '#FFB6C1',
    'lightred': '#FFB6C1',
    'crimson': '#DC143C',
    'maroon': '#800000',
    
    // Green variations
    'dark green': '#006400',
    'darkgreen': '#006400',
    'light green': '#90EE90',
    'lightgreen': '#90EE90',
    'forest green': '#228B22',
    'forestgreen': '#228B22',
    
    // Other variations
    'dark gray': '#A9A9A9',
    'darkgray': '#A9A9A9',
    'light gray': '#D3D3D3',
    'lightgray': '#D3D3D3',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'bronze': '#CD7F32',
    'copper': '#B87333'
  };
  
  return colorMap[colorName.toLowerCase()] || '#CCCCCC';
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductDetail({ params }: PageProps) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id
  const [product, setProduct] = useState<Product | null>(null)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [brandProducts, setBrandProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showCopied, setShowCopied] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [showNotice, setShowNotice] = useState(false)
  const [noticeMessage, setNoticeMessage] = useState('')
  const [showAdded, setShowAdded] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')
  const [colorImageMap, setColorImageMap] = useState<{[key: string]: number}>({})
  
  // UUID validation regex - defined once at the top
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  // Use the favorites hook
  const { isFavorited, checkFavorites } = useFavorites()

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await getProductById(productId)
        if (productData) {
          setProduct(productData)
          const brandData = await getBrandById(productData.brand_id)
          setBrand(brandData)
          
          // 同じブランドの他の商品を取得（現在の商品を除く）
          const allBrandProducts = await getProductsByBrand(productData.brand_id)
          const otherBrandProducts = allBrandProducts.filter(p => p.id !== productData.id).slice(0, 4)
          setBrandProducts(otherBrandProducts)
          
          // Create color to image mapping
          if (productData.colors && productData.images) {
            const mapping: {[key: string]: number} = {}
            productData.colors.forEach((color, index) => {
              // Map each color to its corresponding image index
              // If there are more colors than images, cycle through images
              mapping[color] = index % productData.images.length
            })
            setColorImageMap(mapping)
          }
          
          // Check favorites for current product and related products
          const allProductIds = [productData.id, ...otherBrandProducts.map(p => p.id)]
          await checkFavorites(allProductIds)
        } else {
          // Product not found - this could be due to invalid ID format or deleted product
          console.error('Product not found for ID:', productId)
          setProduct(null)
        }
      } catch (error) {
        console.error('Error loading product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [productId, checkFavorites])

  // If there is exactly one available color, auto-select it
  useEffect(() => {
    if (product?.colors && product.colors.length === 1 && !selectedColor) {
      setSelectedColor(product.colors[0])
    }
  }, [product, selectedColor])

  // Handle color selection and image switching
  useEffect(() => {
    if (selectedColor && colorImageMap[selectedColor] !== undefined) {
      setSelectedImageIndex(colorImageMap[selectedColor])
    }
  }, [selectedColor, colorImageMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="px-6 py-10">
        <div className="text-gray-700">Product not found.</div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className=" pt-0 pb-0 bg-white -mt-4 relative ">
      {/* Copied Banner */}
      {showCopied && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          Copied!
        </div>
      )}
      {/* Added to Cart Banner */}
      {showAdded && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {addedMessage}
        </div>
      )}
      {/* Notice Banner */}
      {showNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {noticeMessage}
        </div>
      )}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-5 mt-0 px-3">
        <div className="space-y-4 md:col-span-3 md:pl-16 ">
          {/* メイン画像 */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-white flex items-center justify-center rounded-xl border border-gray-200 ring-1 ring-black/5 overflow-hidden max-w-lg mx-auto md:mx-0 mt-8">
            {product.images && product.images.length > 0 ? (
              <Image 
                src={product.images[selectedImageIndex]} 
                alt={product.name} 
                width={320} 
                height={320} 
                className="w-full h-full object-contain transition-opacity duration-300"
                key={`${product.id}-${selectedImageIndex}`}
              />
            ) : (
              <div className="text-gray-400">No image available</div>
            )}
          </div>
          
          {/* サムネイル画像 */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-1 max-w-md mx-auto md:mx-0">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index 
                      ? 'border-black ring-2 ring-black/20' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image 
                    src={image} 
                    alt={`${product.name} ${index + 1}`} 
                    width={30} 
                    height={30} 
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* T-shirt specific information for desktop - 商品写真の下に表示（デスクトップのみ） */}
          {(product.type?.toLowerCase().includes('t-shirt') || product.type?.toLowerCase().includes('tshirt') || product.type?.toLowerCase().includes('shirt')) && (
            <div className="mt-6 max-w-lg mx-auto md:mx-0 hidden md:block">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Regular fit:</strong> Standard length, the fabric easily gives into movement.</p>
                  <p><strong>Fabric composition:</strong></p>
                  <ul className="ml-4 space-y-1">
                  <li>• 100% ring-spun cotton</li>
                      <li>• Grey is 90% ring-spun cotton, 10% polyester</li>
                      <li>• Dark Heather is 65% polyester, 35% cotton</li>
                      <li>• Disclaimer: Due to the fabric properties, the White color variant may appear off-white rather than bright white.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Size Chart for desktop - 商品写真の下に表示（デスクトップのみ） */}
          {(product.type?.toLowerCase().includes('t-shirt') || product.type?.toLowerCase().includes('tshirt') || product.type?.toLowerCase().includes('shirt')) && (
            <div className="mt-6 max-w-lg mx-auto md:mx-0 hidden md:block">
              <SizeChart />
            </div>
          )}
        </div>
        <div className="md:ml-0 md:col-span-2 md:pt-16">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex-1">{product.name}</h1>
              <FavoriteButton 
                productId={product.id} 
                className="ml-4 flex-shrink-0" 
                initialFavoriteState={isFavorited(product.id)}
              />
            </div>
            <div className="text-xl mb-2 text-gray-900">{formatUSD(product.price)}</div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.type}
              </span>
              {product.gender && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {product.gender}
                </span>
              )}
            </div>
          </div>
          {brand && (
            <div className="mb-4">
              <Link href={`/${brand.id}`} className="inline-flex items-center gap-3 text-xl text-gray-600 hover:text-black">
                <Image src={brand.icon} alt={brand.name} width={30} height={30} className="rounded" />
                <span className="font-semibold">{brand.name}</span>
              </Link>
            </div>
          )}
          {product.description && (
            <p className="text-sm text-gray-700 leading-6 max-w-prose">{product.description}</p>
          )}
          
          
          
          
          {product.colors && product.colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Colors:</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedColor(color)
                      // Image switching is handled by the useEffect above
                    }}
                    className={`w-8 h-8 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform ${
                      selectedColor === color ? 'ring-4 ring-blue-500 scale-110' : ''
                    } ${color.toLowerCase() === 'white' ? 'border-2 border-gray-300' : ''}`}
                    style={{ backgroundColor: getColorFromName(color) }}
                    title={color}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-sm text-gray-600 mt-2">Selected: {selectedColor}</p>
              )}
            </div>
          )}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Size:</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {selectedSize && (
                <p className="text-sm text-gray-600 mt-2">Selected: {selectedSize}</p>
              )}
            </div>
          )}
          <div className="mt-8">
            {/* Quantity selector and Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-gray-300 rounded-md flex-[3]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  const needsColor = product.colors && product.colors.length > 0 && !selectedColor
                  const needsSize = product.sizes && product.sizes.length > 0 && !selectedSize
                  if (needsColor || needsSize) {
                    if (needsColor && needsSize) {
                      setNoticeMessage('Choose color and size')
                    } else if (needsColor) {
                      setNoticeMessage('Choose color')
                    } else {
                      setNoticeMessage('Choose size')
                    }
                    setShowNotice(true)
                    setTimeout(() => setShowNotice(false), 1200)
                    return
                  }

                  // Validate product ID before adding to cart
                  if (!uuidRegex.test(product.id)) {
                    console.error('Invalid product ID format:', product.id)
                    setNoticeMessage('Invalid product ID')
                    setShowNotice(true)
                    setTimeout(() => setShowNotice(false), 1200)
                    return
                  }

                  type CartItemLocal = { id: string; quantity: number; size?: string | null; color?: string | null };
                  const cart: CartItemLocal[] = JSON.parse(localStorage.getItem('cart') || '[]');
                  
                  // Clean up any invalid cart items before processing
                  const validCart = cart.filter(item => uuidRegex.test(item.id))
                  if (validCart.length !== cart.length) {
                    console.log('Removed invalid cart items')
                    localStorage.setItem('cart', JSON.stringify(validCart))
                  }
                  
                  const existingItem = validCart.find((item) => 
                    item.id === product.id && 
                    (product.sizes?.length ? (item.size || null) === (selectedSize || null) : true) &&
                    (product.colors?.length ? (item.color || null) === (selectedColor || null) : true)
                  );
                  if (existingItem) {
                    existingItem.quantity += quantity;
                  } else {
                    validCart.push({ 
                      id: product.id, 
                      quantity: quantity,
                      size: product.sizes && product.sizes.length > 0 ? (selectedSize || null) : null,
                      color: product.colors && product.colors.length > 0 ? (selectedColor || null) : null,
                    });
                  }
                  localStorage.setItem('cart', JSON.stringify(validCart));
                  setAddedMessage(`Added ${quantity} item(s) to cart`);
                  setShowAdded(true);
                  setTimeout(() => setShowAdded(false), 1000);
                }}
                className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-black text-white rounded-md hover:bg-gray-800 flex-[5] justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 3.75a.75.75 0 000 1.5h1.862c.27 0 .505.181.574.442l2.14 8.023A2.25 2.25 0 008.996 15h7.258a2.25 2.25 0 002.17-1.607l1.6-5.6a.75.75 0 00-.72-.968H6.615l-.36-1.35A2.25 2.25 0 004.112 3.75H2.25z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9.75 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                <span className="hidden sm:inline">Add to Cart</span>
              </button>
              <button 
                onClick={() => {
                  const productUrl = window.location.href;
                  navigator.clipboard.writeText(productUrl).then(() => {
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 1000);
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = productUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 1000);
                  });
                }}
                className="flex items-center justify-center p-3 sm:p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex-[2]"
                title="Copy link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
            
            {/* Checkout button */}
            <button 
              onClick={() => {
                void (async () => {
                  try {
                    const savedCart = localStorage.getItem('cart')
                    const rawCart: { id: string; quantity: number }[] = savedCart ? JSON.parse(savedCart) : []
                    
                    // Clean up any invalid cart items immediately
                    const currentCart = rawCart.filter(item => uuidRegex.test(item.id))
                    if (currentCart.length !== rawCart.length) {
                      console.log('Cleaned up invalid cart items on page load')
                      localStorage.setItem('cart', JSON.stringify(currentCart))
                    }

                    // Validate options (we add current product to cart before checkout)
                    const needsColor = product.colors && product.colors.length > 0 && !selectedColor
                    const needsSize = product.sizes && product.sizes.length > 0 && !selectedSize
                    if (needsColor || needsSize) {
                      if (needsColor && needsSize) {
                        setNoticeMessage('Choose color and size')
                      } else if (needsColor) {
                        setNoticeMessage('Choose color')
                      } else {
                        setNoticeMessage('Choose size')
                      }
                      setShowNotice(true)
                      setTimeout(() => setShowNotice(false), 1200)
                      return
                    }

                    // Clean up any invalid cart items first
                    const validCurrentCart = currentCart.filter(item => uuidRegex.test(item.id))
                    if (validCurrentCart.length !== currentCart.length) {
                      console.log('Removed invalid items from current cart')
                    }

                    // Merge current product into cart
                    const mergedCart = [...validCurrentCart]
                    const existing = mergedCart.find(ci => ci.id === product.id)
                    if (existing) {
                      existing.quantity += quantity
                    } else {
                      mergedCart.push({ id: product.id, quantity })
                    }
                    localStorage.setItem('cart', JSON.stringify(mergedCart))

                    // Build Stripe line items from merged cart
                    const itemsSource = mergedCart

                    const productsData = await Promise.all(itemsSource.map(async (ci) => {
                      // Validate cart item ID format
                      if (!uuidRegex.test(ci.id)) {
                        console.error('Invalid cart item ID format:', ci.id)
                        return null
                      }
                      
                      const p = ci.id === product.id ? product : await getProductById(ci.id)
                      if (!p) {
                        console.error('Product not found for cart item:', ci.id)
                        return null
                      }
                      // Include size/color for the current product if selected
                      const size = ci.id === product.id ? (selectedSize || null) : null
                      const color = ci.id === product.id ? (selectedColor || null) : null
                      return { id: p.id, name: p.name, price: p.price, quantity: ci.quantity, size, color }
                    }))
                    const items = productsData.filter(Boolean) as { id: string; name: string; price: number; quantity: number; size?: string | null; color?: string | null }[]
                    if (items.length === 0) {
                      setNoticeMessage('Unable to prepare checkout')
                      setShowNotice(true)
                      setTimeout(() => setShowNotice(false), 1200)
                      return
                    }

                    const res = await fetch('/api/checkout_sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items })
                    })
                    const data = await res.json()
                    if (!res.ok || !data?.url) {
                      console.error('Checkout session error:', data)
                      setNoticeMessage('Failed to start checkout')
                      setShowNotice(true)
                      setTimeout(() => setShowNotice(false), 1200)
                      return
                    }
                    window.location.href = data.url as string
                  } catch (e) {
                    console.error(e)
                    setNoticeMessage('Checkout error')
                    setShowNotice(true)
                    setTimeout(() => setShowNotice(false), 1200)
                  }
                })()
              }}
              className="w-full rounded-full bg-blue-600 text-white px-6 py-4 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Buy Now
            </button>
            
            {/* Free Shipping Text */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <Image src="/truck.png" alt="Truck" width={20} height={20} className="w-5 h-5" />
              <span className="text-gray-600 text-sm">Free Shipping</span>
            </div>
            
            {/* Made-to-Order, Less Waste Text */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              {/* <h3 className="text-sm font-semibold text-gray-900 mb-2">Made-to-Order, Less Waste</h3> */}
              <p className="text-xs text-gray-700 leading-relaxed">
                Our products are made just for you. Please allow several days for production and several days for shipping (US: 7-9 days, UK: 4-7 days, International: 1–3 weeks).
              </p>
              <p className="text-xs text-gray-700 leading-relaxed mt-2">
                You will receive an email confirmation once your order is confirmed, and we&apos;ll keep you updated throughout the production and shipping process.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed mt-2">
                Thank you for choosing a sustainable option that avoids mass production and waste.
              </p>
            </div>
            
            {/* T-shirt specific information for mobile - Made-to-Orderの下に表示 */}
            {(product.type?.toLowerCase().includes('t-shirt') || product.type?.toLowerCase().includes('tshirt') || product.type?.toLowerCase().includes('shirt')) && (
              <div className="mt-6 md:hidden">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Regular fit:</strong> Standard length, the fabric easily gives into movement.</p>
                    <p><strong>Fabric composition:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• 100% ring-spun cotton</li>
                      <li>• Grey is 90% ring-spun cotton, 10% polyester</li>
                      <li>• Dark Heather is 65% polyester, 35% cotton</li>
                      <li>• Disclaimer: Due to the fabric properties, the White color variant may appear off-white rather than bright white.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Size Chart for mobile - Made-to-Orderの下に表示 */}
            {(product.type?.toLowerCase().includes('t-shirt') || product.type?.toLowerCase().includes('tshirt') || product.type?.toLowerCase().includes('shirt')) && (
              <div className="mt-6 md:hidden">
                <SizeChart />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 同じブランドの他の商品セクション */}
      <div 
        className="mt-4"
        style={{
          backgroundImage: brand?.background_image ? `url(${brand.background_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <ProductCarousel products={brandProducts} title="More from this brand" brandId={brand?.id} />
        </div>
      </div>
    </div>
  );
}


