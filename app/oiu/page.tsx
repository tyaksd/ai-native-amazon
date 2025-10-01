'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Brand, Product, getBrands, getProducts, createBrand, createProduct, deleteProduct } from '@/lib/data'
import { uploadImage } from '@/lib/cloudinary-client'

export default function AdminPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'brands' | 'products'>('products')
  const [showCreatedBanner, setShowCreatedBanner] = useState(false)
  const [createdMessage, setCreatedMessage] = useState<'Created!' | ''>('')

  // Form states
  const [newBrand, setNewBrand] = useState({ 
    name: '', 
    icon: '', 
    background_image: '', 
    description: '' 
  })
  const [newProduct, setNewProduct] = useState({
    name: '',
    images: [] as string[],
    price: '',
    brand_id: '',
    description: '',
    category: 'All',
    colors: [] as string[],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'] as string[]
  })
  // removed unused file states
  const [colorInput, setColorInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [brandsData, productsData] = await Promise.all([
        getBrands(),
        getProducts()
      ])
      setBrands(brandsData)
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addColor = () => {
    if (colorInput.trim() && !newProduct.colors.includes(colorInput.trim())) {
      setNewProduct(prev => ({
        ...prev,
        colors: [...prev.colors, colorInput.trim()]
      }))
      setColorInput('')
    }
  }

  const removeColor = (colorToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }))
  }

  const addSize = () => {
    if (sizeInput.trim() && !newProduct.sizes.includes(sizeInput.trim())) {
      setNewProduct(prev => ({
        ...prev,
        sizes: [...prev.sizes, sizeInput.trim()]
      }))
      setSizeInput('')
    }
  }

  const removeSize = (sizeToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      sizes: prev.sizes.filter(size => size !== sizeToRemove)
    }))
  }

  const handleImageUpload = async (files: File[]) => {
    try {
      const uploadPromises = files.map(file => uploadImage(file))
      const imageUrls = await Promise.all(uploadPromises)
      setNewProduct(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    }
  }

  const handleBrandIconUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file)
      setNewBrand(prev => ({ ...prev, icon: imageUrl }))
    } catch (error) {
      console.error('Error uploading brand icon:', error)
      alert('Failed to upload brand icon')
    }
  }

  const handleBrandBackgroundUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file)
      setNewBrand(prev => ({ ...prev, background_image: imageUrl }))
    } catch (error) {
      console.error('Error uploading brand background:', error)
      alert('Failed to upload brand background')
    }
  }

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const brand = await createBrand(newBrand)
      if (brand) {
        setBrands(prev => [...prev, brand])
        setNewBrand({ name: '', icon: '', background_image: '', description: '' })
        setCreatedMessage('Created!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 1000)
      }
    } catch (error) {
      console.error('Error creating brand:', error)
      alert('Failed to create brand')
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (newProduct.images.length === 0) {
        alert('Please upload at least one product image before creating the product.')
        return
      }
      if (!newProduct.brand_id) {
        alert('Please select a brand before creating the product.')
        return
      }
      if (!newProduct.description || newProduct.description.trim().length === 0) {
        alert('Please enter a product description.')
        return
      }
      console.log('Creating product with:', newProduct)
      const product = await createProduct({
        ...newProduct,
        price: Number(newProduct.price)
      })
      if (product) {
        setProducts(prev => [...prev, product])
        setNewProduct({
          name: '',
          images: [],
          price: '',
          brand_id: '',
          description: '',
          category: 'All',
          colors: [],
          sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
        })
        setCreatedMessage('Created!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 1000)
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const success = await deleteProduct(productId)
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        alert('Product deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showCreatedBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-md bg-green-600 text-white shadow-md animate-pulse">
            {createdMessage}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage brands and products</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('brands')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'brands'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Brands ({brands.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Create Product Form */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand *</label>
                      <select
                        value={newProduct.brand_id}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, brand_id: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a brand</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="All">All</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Hot">Hot</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Colors</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="Enter color (e.g., red, blue)"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && addColor()}
                        />
                        <button
                          type="button"
                          onClick={addColor}
                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Add
                        </button>
                      </div>
                      {newProduct.colors.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {newProduct.colors.map((color, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                            >
                              {color}
                              <button
                                type="button"
                                onClick={() => removeColor(color)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sizes</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          placeholder="Enter size (e.g., S, M, L)"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && addSize()}
                        />
                        <button
                          type="button"
                          onClick={addSize}
                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Add
                        </button>
                      </div>
                      {newProduct.sizes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {newProduct.sizes.map((size, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                            >
                              {size}
                              <button
                                type="button"
                                onClick={() => removeSize(size)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            handleImageUpload(files)
                          }
                        }}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">You can select multiple images at once</p>
                      {newProduct.images.length > 0 && (
                        <div className="mt-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {newProduct.images.map((image, index) => (
                              <div key={index} className="relative">
                                <Image src={image} alt={`Preview ${index + 1}`} width={80} height={80} className="h-20 w-20 object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewProduct(prev => ({
                                      ...prev,
                                      images: prev.images.filter((_, i) => i !== index)
                                    }))
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Create Product
                    </button>
                  </form>
                </div>

                {/* Products List */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">All Products</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => {
                      const brand = brands.find(b => b.id === product.brand_id)
                      return (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                          {product.images && product.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1 mb-3">
                              {product.images.slice(0, 4).map((image, index) => (
                                <div key={index} className="aspect-square overflow-hidden rounded">
                                  <Image src={image} alt={`${product.name} ${index + 1}`} width={400} height={400} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="aspect-square bg-gray-200 rounded mb-3 flex items-center justify-center">
                              <span className="text-gray-500">No images</span>
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">Brand: {brand?.name}</p>
                          <p className="text-sm text-gray-600">Category: {product.category}</p>
                          {product.colors && product.colors.length > 0 && (
                            <div className="mt-1">
                              <p className="text-sm text-gray-600">Colors:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.colors.map((color, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {product.sizes && product.sizes.length > 0 && (
                            <div className="mt-1">
                              <p className="text-sm text-gray-600">Sizes:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.sizes.map((size, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-lg font-bold text-blue-600">${product.price}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-6">
                {/* Create Brand Form */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4">Add New Brand</h2>
                  <form onSubmit={handleCreateBrand} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                        <input
                          type="text"
                          value={newBrand.name}
                          onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand Icon</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleBrandIconUpload(file)
                          }
                          }}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          required
                        />
                        {newBrand.icon && (
                          <div className="mt-2">
                            <Image src={newBrand.icon} alt="Brand Icon Preview" width={80} height={80} className="h-20 w-20 object-cover rounded" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand Description</label>
                      <textarea
                        value={newBrand.description}
                        onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter brand description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand Background Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleBrandBackgroundUpload(file)
                          }
                        }}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {newBrand.background_image && (
                        <div className="mt-2">
                          <Image src={newBrand.background_image} alt="Brand Background Preview" width={800} height={128} className="h-32 w-full object-cover rounded" />
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Create Brand
                    </button>
                  </form>
                </div>

                {/* Brands List */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">All Brands</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.map(brand => (
                      <div key={brand.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {brand.icon ? (
                            <Image src={brand.icon} alt={brand.name} width={32} height={32} className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-200" aria-label="No icon" />
                          )}
                          <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                        </div>
                        {brand.background_image && (
                          <div className="mb-3">
                            <Image src={brand.background_image} alt={`${brand.name} background`} width={800} height={96} className="w-full h-24 object-cover rounded" />
                          </div>
                        )}
                        {brand.description && (
                          <p className="text-sm text-gray-600 break-words">{brand.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
