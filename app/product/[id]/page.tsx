'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react'
import { getProductById, getBrandById, getProductsByBrand, Product, Brand } from "@/lib/data";
import ProductCarousel from "@/app/components/ProductCarousel";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getColorFromName(colorName: string): string {
  const colorMap: { [key: string]: string } = {
    // Basic colors
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#808080',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    
    // Fashion colors
    'navy': '#000080',
    'olive': '#808000',
    'charcoal': '#36454F',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'khaki': '#F0E68C',
    
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
  params: { id: string };
};

export default function ProductDetail({ params }: PageProps) {
  const resolvedParams = params as { id: string }
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await getProductById(resolvedParams.id)
        if (productData) {
          setProduct(productData)
          const brandData = await getBrandById(productData.brand_id)
          setBrand(brandData)
          
          // 同じブランドの他の商品を取得（現在の商品を除く）
          const allBrandProducts = await getProductsByBrand(productData.brand_id)
          const otherBrandProducts = allBrandProducts.filter(p => p.id !== productData.id).slice(0, 4)
          setBrandProducts(otherBrandProducts)
        }
      } catch (error) {
        console.error('Error loading product:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.id])

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
    <div className="px-1 pt-0 pb-6 bg-white -mt-4 relative px-3 sm:px-10">
      {/* Copied Banner */}
      {showCopied && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          Copied!
        </div>
      )}
      {/* Notice Banner */}
      {showNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {noticeMessage}
        </div>
      )}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-5 mt-0">
        <div className="space-y-4 md:col-span-3 md:pl-16">
          {/* メイン画像 */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-white flex items-center justify-center rounded-xl border border-gray-200 ring-1 ring-black/5 overflow-hidden max-w-lg mx-auto md:mx-0 mt-8">
            {product.images && product.images.length > 0 ? (
              <Image 
                src={product.images[selectedImageIndex]} 
                alt={product.name} 
                width={320} 
                height={320} 
                className="w-full h-full object-contain"
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
        </div>
        <div className="md:ml-0 md:col-span-2 md:pt-16">
          <div>
            <h1 className="text-3xl font-semibold mb-2 tracking-tight text-gray-900">{product.name}</h1>
            <div className="text-xl mb-4 text-gray-900">{formatUSD(product.price)}</div>
          </div>
          {brand && (
            <div className="mb-4">
              <Link href={`/${brand.id}`} className="inline-flex items-center gap-3 text-xl text-gray-600 hover:text-black">
                <Image src={brand.icon} alt={brand.name} width={30} height={30} />
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
                    onClick={() => setSelectedColor(color)}
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

                  type CartItemLocal = { id: string; quantity: number };
                  const cart: CartItemLocal[] = JSON.parse(localStorage.getItem('cart') || '[]');
                  const existingItem = cart.find((item) => item.id === product.id);
                  if (existingItem) {
                    existingItem.quantity += quantity;
                  } else {
                    cart.push({ id: product.id, quantity: quantity });
                  }
                  localStorage.setItem('cart', JSON.stringify(cart));
                  alert(`Added ${quantity} item(s) to cart!`);
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
                title="Share product"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
            
            {/* Checkout button */}
            <button 
              onClick={() => {
                window.location.href = '/cart';
              }}
              className="w-full rounded-full bg-blue-600 text-white px-6 py-4 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
      
      {/* 同じブランドの他の商品セクション */}
      <ProductCarousel products={brandProducts} title="More from this brand" />
    </div>
  );
}


