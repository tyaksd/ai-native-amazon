'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Brand, Product, getBrands, getProducts, createBrand, createProduct, deleteProduct, updateProductVisibility, getCategoryTypeMapping, deleteBrand } from '@/lib/data'
import { uploadImage } from '@/lib/cloudinary-client'

export default function AdminPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'brands' | 'products' | 'ai-products' | 'ai-brands' | 'sns'>('ai-brands')
  const [showCreatedBanner, setShowCreatedBanner] = useState(false)
  const [createdMessage, setCreatedMessage] = useState<'Created!' | 'AI Brand Generated!' | 'Product deleted successfully!' | 'Brand deleted successfully!' | 'AI Products Generated!' | 'Product is now visible!' | 'Product is now hidden!' | string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [productVisibility, setProductVisibility] = useState<{[key: string]: boolean}>({})
  

  // AI Products form states
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [aiProductGender, setAiProductGender] = useState('Unisex')
  const [quantity, setQuantity] = useState('')
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  // AI Brands form states
  const [aiBrandQuantity, setAiBrandQuantity] = useState('')
  const [generatedBrandsCount, setGeneratedBrandsCount] = useState(0)
  // Note: generatedBrandsCount is used in the UI but ESLint doesn't detect it

  // Predefined color options
  const colorOptions = [
    { name: 'Black', value: '#0e0e0e' },
    { name: 'White', value: '#ffffff' },
    { name: 'Navy', value: '#0f1830' },
    { name: 'Grey', value: '#d1d2d6' },
    { name: 'Dark Heather', value: '#424848' },
    { name: 'Red', value: '#FF1B2B' },
    { name: 'Blue', value: '#2665CC' },
    { name: 'Sand', value: '#d8c5a9' },
    { name: 'Natural', value: '#fff6ea' },
    { name: 'Military Green', value: '#686f54' }
  ]

  // Form states
  const [newBrand, setNewBrand] = useState({ 
    name: '', 
    icon: '', 
    background_image: '', 
    description: '',
    category: 'Casual'
  })
  const [newProduct, setNewProduct] = useState({
    name: '',
    images: [] as string[],
    price: '',
    brand_id: '',
    description: '',
    category: 'Clothing',
    type: 'T-Shirt',
    colors: [] as string[],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'] as string[],
    gender: 'Unisex'
  })
  // removed unused file states
  const [colorInput, setColorInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')

  // Helper functions for category/type mapping
  const getDefaultTypeForCategory = (category: string): string => {
    const mapping = getCategoryTypeMapping()
    return mapping[category]?.[0] || 'T-Shirt'
  }

  const getTypeOptionsForCategory = (category: string): string[] => {
    const mapping = getCategoryTypeMapping()
    return mapping[category] || ['T-Shirt']
  }

  useEffect(() => {
    loadData()
  }, [])

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false)
      }
    }

    if (showBrandDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBrandDropdown])

  // Filter products by category, gender, and search query
  useEffect(() => {
    let filtered = products
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    if (selectedGender !== 'All') {
      filtered = filtered.filter(product => product.gender === selectedGender)
    }
    
    // 検索クエリフィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }, [products, selectedCategory, selectedGender, searchQuery])

  const loadData = async () => {
    setLoading(true)
    try {
      const [brandsData, productsData] = await Promise.all([
        getBrands(),
        getProducts()
      ])
      setBrands(brandsData)
      setProducts(productsData)
      
      // 商品の可視性状態を初期化
      const visibilityMap: {[key: string]: boolean} = {}
      productsData.forEach(product => {
        visibilityMap[product.id] = product.is_visible
      })
      setProductVisibility(visibilityMap)
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
      const brand = await createBrand({
        ...newBrand,
        design_concept: null,
        target_audience: null,
        logo_design: null
      })
      if (brand) {
        setBrands(prev => [...prev, brand])
        setNewBrand({ name: '', icon: '', background_image: '', description: '', category: 'Casual' })
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
        price: Number(newProduct.price),
        is_visible: true
      })
      if (product) {
        setProducts(prev => [...prev, product])
        setNewProduct({
          name: '',
          images: [],
          price: '',
          brand_id: '',
          description: '',
          category: 'Clothing',
          type: 'T-Shirt',
          colors: [],
          sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
          gender: 'Unisex'
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
    try {
      const success = await deleteProduct(productId)
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        setCreatedMessage('Product deleted successfully!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 2000)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleDeleteBrand = async (brandId: string) => {
    try {
      const success = await deleteBrand(brandId)
      if (success) {
        setBrands(prev => prev.filter(b => b.id !== brandId))
        setCreatedMessage('Brand deleted successfully!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 2000)
      }
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Failed to delete brand')
    }
  }

  const handleToggleVisibility = async (productId: string) => {
    const currentVisibility = productVisibility[productId]
    const newVisibility = !currentVisibility
    
    try {
      const success = await updateProductVisibility(productId, newVisibility)
      if (success) {
        // ローカルstateを更新
        setProductVisibility(prev => ({
          ...prev,
          [productId]: newVisibility
        }))
        
        // 商品リストも更新
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, is_visible: newVisibility }
            : product
        ))
        
        setCreatedMessage(newVisibility ? 'Product is now visible!' : 'Product is now hidden!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 2000)
      }
    } catch (error) {
      console.error('Error updating product visibility:', error)
      alert('Failed to update product visibility')
    }
  }

  // Color selection functions
  const handleColorToggle = (colorName: string) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(color => color !== colorName)
        : [...prev, colorName]
    )
  }

  const handleRandomColors = () => {
    // Always include Black and White
    const fixedColors = ['Black', 'White']
    
    // Get other colors (excluding Black and White)
    const otherColors = colorOptions.filter(color => 
      color.name !== 'Black' && color.name !== 'White'
    )
    
    // Randomly select 2 additional colors
    const shuffled = otherColors.sort(() => 0.5 - Math.random())
    const randomColors = shuffled.slice(0, 2).map(color => color.name)
    
    setSelectedColors([...fixedColors, ...randomColors])
  }

  // Filter brands based on search query (character by character from start)
  const filteredBrands = brands.filter(brand => {
    const brandName = brand.name.toLowerCase()
    const searchQuery = brandSearchQuery.toLowerCase()
    
    // Check if brand name starts with the search query
    return brandName.startsWith(searchQuery)
  })

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId)
    setBrandSearchQuery('')
    setShowBrandDropdown(false)
  }

  const handleGenerateAIProducts = async () => {
    if (!selectedBrand || !selectedProductType || selectedColors.length === 0) {
      alert('Please select a brand, product type, and at least one color.')
      return
    }
    
    if (!quantity || quantity.trim() === '') {
      alert('Please enter a quantity.')
      return
    }
    
    const quantityNum = Number(quantity)
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 10) {
      alert('Please enter a valid quantity between 1 and 10.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-ai-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: selectedBrand,
          productType: selectedProductType,
          colors: selectedColors,
          gender: aiProductGender,
          quantity: quantityNum
        }),
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI products')
      }

      const result = await response.json()
      
      if (result.success && result.products) {
        // Refresh products list
        await loadData()
        setCreatedMessage('AI Products Generated!')
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 3000)
        
        // Reset form
        setSelectedBrand('')
        setSelectedProductType('')
        setSelectedColors([])
        setAiProductGender('Unisex')
        setQuantity('')
      } else {
        throw new Error('Failed to generate products')
      }
    } catch (error) {
      console.error('Error generating AI products:', error)
      alert('Failed to generate AI products. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAIBrand = async () => {
    if (!aiBrandQuantity || aiBrandQuantity.trim() === '') {
      alert('Please enter a quantity.')
      return
    }
    
    const quantityNum = Number(aiBrandQuantity)
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 10) {
      alert('Please enter a valid quantity between 1 and 10.')
      return
    }

    setIsGenerating(true)
    setGeneratedBrandsCount(0)
    
    try {
      const selectedStyle = (document.querySelector('input[name="brandStyle"]:checked') as HTMLInputElement)?.value || 'street'
      
      const response = await fetch('/api/generate-ai-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brandStyle: selectedStyle,
          quantity: quantityNum 
        }),
        signal: AbortSignal.timeout(300000), // 5 minutes timeout for multiple brands
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI brands')
      }

      const result = await response.json()
      
      if (result.success && result.brands) {
        setBrands(prev => [...prev, ...result.brands])
        setGeneratedBrandsCount(result.brands.length)
        setCreatedMessage(`AI Brands Generated! (${result.brands.length} brands)`)
        setShowCreatedBanner(true)
        setTimeout(() => setShowCreatedBanner(false), 3000)
        
        // Reset form
        setAiBrandQuantity('')
      } else {
        throw new Error('Failed to generate brands')
      }
    } catch (error) {
      console.error('Error generating AI brands:', error)
      alert('Failed to generate AI brands. Please try again.')
    } finally {
      setIsGenerating(false)
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
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('ai-brands')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-brands'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Brands
              </button>
              <button
                onClick={() => setActiveTab('ai-products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Products
              </button>
              <button
                onClick={() => setActiveTab('sns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sns'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                SNS Posting
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
                        onChange={(e) => {
                          setNewProduct(prev => ({ 
                            ...prev, 
                            category: e.target.value,
                            type: getDefaultTypeForCategory(e.target.value)
                          }))
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Hats">Hats</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={newProduct.type}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, type: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {getTypeOptionsForCategory(newProduct.category).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        value={newProduct.gender}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, gender: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                        <option value="Null">Null</option>
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
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                        <input
                          type="text"
                          placeholder="Search by product name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">All Products ({filteredProducts.length})</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Filter by category:</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="All">All Categories</option>
                          <option value="T-Shirt">T-Shirt</option>
                          <option value="Hoodie">Hoodie</option>
                          <option value="Sweatshirt">Sweatshirt</option>
                          <option value="Jacket">Jacket</option>
                          <option value="Pants">Pants</option>
                          <option value="Shorts">Shorts</option>
                          <option value="Hat">Hat</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Shoes">Shoes</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Filter by gender:</label>
                        <select
                          value={selectedGender}
                          onChange={(e) => setSelectedGender(e.target.value)}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="All">All Genders</option>
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                          <option value="Unisex">Unisex</option>
                          <option value="Null">Null</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => {
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
                          <p className="text-sm text-gray-600">Type: {product.type}</p>
                          <p className="text-sm text-gray-600">Gender: {product.gender}</p>
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
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleToggleVisibility(product.id)}
                              className={`px-3 py-1 rounded text-sm ${
                                productVisibility[product.id] 
                                  ? 'bg-red-500 text-white hover:bg-red-600' 
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {productVisibility[product.id] ? 'HIDE' : 'SHOW'}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
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
                      <label className="block text-sm font-medium text-gray-700">Brand Category</label>
                      <select
                        value={newBrand.category}
                        onChange={(e) => setNewBrand(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="Streetwear">Streetwear</option>
                        <option value="Casual">Casual</option>
                        <option value="Mode / Avant-Garde">Mode / Avant-Garde</option>
                        <option value="Luxury / High-End">Luxury / High-End</option>
                        <option value="Sports / Outdoor">Sports / Outdoor</option>
                        <option value="Traditional / Preppy">Traditional / Preppy</option>
                        <option value="Feminine / Girly">Feminine / Girly</option>
                        <option value="Workwear / Military">Workwear / Military</option>
                        <option value="Sustainable / Ethical">Sustainable / Ethical</option>
                      </select>
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
                        {brand.category && (
                          <p className="text-sm text-blue-600 font-medium mb-2">Category: {brand.category}</p>
                        )}
                        {brand.description && (
                          <p className="text-sm text-gray-600 break-words">{brand.description}</p>
                        )}
                        <div className="mt-3">
                          <button
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-products' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h2 className="text-lg font-semibold mb-6 text-purple-800">🤖 AI Product Generator</h2>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Brand Selection */}
                      <div className="relative brand-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search brands..."
                            value={brandSearchQuery}
                            onChange={(e) => {
                              setBrandSearchQuery(e.target.value)
                              setShowBrandDropdown(true)
                            }}
                            onFocus={() => setShowBrandDropdown(true)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {selectedBrand && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBrand('')
                                  setBrandSearchQuery('')
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {showBrandDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredBrands.length > 0 ? (
                              filteredBrands.map(brand => (
                                <button
                                  key={brand.id}
                                  type="button"
                                  onClick={() => handleBrandSelect(brand.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {brand.name}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500">No brands found</div>
                            )}
                          </div>
                        )}
                        
                        {selectedBrand && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm">
                              {brands.find(b => b.id === selectedBrand)?.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Gender Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select 
                          value={aiProductGender}
                          onChange={(e) => setAiProductGender(e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Unisex">Unisex</option>
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                        </select>
                      </div>
                      
                      {/* Product Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                        <select 
                          value={selectedProductType}
                          onChange={(e) => setSelectedProductType(e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Choose type</option>
                          <option value="T-Shirt">T-Shirt</option>
                          <option value="Hoodie">Hoodie</option>
                          <option value="Sweatshirt">Sweatshirt</option>
                          <option value="Jacket">Jacket</option>
                          <option value="Pants">Pants</option>
                          <option value="Shorts">Shorts</option>
                          <option value="Hat">Hat</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                      
                      {/* Color Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                              <label key={color.name} className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedColors.includes(color.name)}
                                  onChange={() => handleColorToggle(color.name)}
                                  className="mr-2 text-purple-600 focus:ring-purple-500"
                                />
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: color.value }}
                                  ></div>
                                  <span className="text-sm text-gray-700">{color.name}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleRandomColors}
                            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
                          >
                            Random
                          </button>
                        </div>
                      </div>
                      
                      {/* Quantity Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Enter quantity"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Generate Button */}
                    <div className="mt-6 flex justify-center">
                      <button 
                        onClick={handleGenerateAIProducts}
                        disabled={isGenerating}
                        className="bg-purple-600 text-white px-8 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? 'Generating Products...' : 'Generate Products'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-brands' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                  <h2 className="text-lg font-semibold mb-6 text-indigo-800">🚀 AI Brands</h2>
                  
                  {/* Brand Style Selection and Generate Button */}
                  <div className="bg-white p-8 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900">🎯 Generate AI Brands</h3>
                    <div className="space-y-6">
                      {/* Brand Style Selection */}
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="brandStyle"
                            value="street"
                            className="mr-3 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                            defaultChecked
                          />
                          <span className="text-lg font-medium text-gray-700">Street</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="brandStyle"
                            value="casual"
                            className="mr-3 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                          />
                          <span className="text-lg font-medium text-gray-700">Casual</span>
                        </label>
                      </div>
                      
                      {/* Quantity Input */}
                      <div className="flex items-center gap-4">
                        <label className="text-lg font-medium text-gray-700">Quantity:</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={aiBrandQuantity}
                          onChange={(e) => setAiBrandQuantity(e.target.value)}
                          placeholder="Enter quantity (1-10)"
                          className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                        />
                        <span className="text-sm text-gray-500">Each brand will be completely unique</span>
                      </div>
                      
                      {/* Generate Button */}
                      <div className="flex justify-center">
                        <button 
                          onClick={handleGenerateAIBrand}
                          disabled={isGenerating}
                          className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? `Generating ${aiBrandQuantity} Brands...` : `Generate ${aiBrandQuantity || 'X'} Brands`}
                        </button>
                      </div>
                      
                      {/* Progress Indicator */}
                      {isGenerating && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Generating unique brands...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sns' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                  <h2 className="text-lg font-semibold mb-6 text-green-800">📱 SNS Posting</h2>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-900">Social Media Posting</h3>
                      <p className="text-gray-600 mb-6">
                        Create and post content to Instagram and X (Twitter) with AI-generated content based on your brands.
                      </p>
                      <Link
                        href="/sns"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Open SNS Posting Tool
                      </Link>
                    </div>
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
