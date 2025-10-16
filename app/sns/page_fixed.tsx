'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getBrands, Brand } from '@/lib/data'

interface PostData {
  text: string
  imageUrl?: string
  videoUrl?: string
  scheduledTime?: string
  selectedBrand?: Brand
}

export default function SNSPage() {
  const [postData, setPostData] = useState<PostData>({
    text: '',
    imageUrl: '',
    videoUrl: '',
    scheduledTime: '',
    selectedBrand: undefined
  })
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{instagram?: string, x?: string, tiktok?: string}>({})
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)

  // Load brands on component mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await getBrands()
        setBrands(brandsData)
        setFilteredBrands(brandsData)
      } catch (error) {
        console.error('Error loading brands:', error)
      }
    }
    loadBrands()
  }, [])

  // Filter brands based on search
  useEffect(() => {
    if (brandSearch.trim() === '') {
      setFilteredBrands(brands)
    } else {
      const filtered = brands.filter(brand =>
        brand.name.toLowerCase().includes(brandSearch.toLowerCase())
      )
      setFilteredBrands(filtered)
    }
  }, [brandSearch, brands])

  const handleInputChange = (field: keyof PostData, value: string) => {
    setPostData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBrandSelect = (brand: Brand) => {
    setPostData(prev => ({
      ...prev,
      selectedBrand: brand
    }))
    setBrandSearch(brand.name)
    setShowBrandDropdown(false)
  }

  const generateContent = async () => {
    if (!postData.selectedBrand) {
      alert('Please select a brand first')
      return
    }

    setIsGenerating(true)
    setGeneratedContent({})
    setShowGeneratedContent(false)

    try {
      // Generate content for both platforms
      const response = await fetch('/api/generate-sns-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: postData.selectedBrand.id,
          platform: 'all'
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        alert(`Error generating content: ${result.error}`)
        return
      }

      // Update generated content
      setGeneratedContent(result.content)
      setShowGeneratedContent(true)

    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${platform} content copied to clipboard!`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SNS Posting</h1>
          <p className="text-gray-600">Generate content for Instagram and X (Twitter)</p>
        </div>

        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Post Content Form */}
          <div className="space-y-6">
            {/* Generate Content Button */}
            <div className="flex justify-center">
              <button
                onClick={generateContent}
                disabled={isGenerating || !postData.selectedBrand}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {isGenerating ? 'Generating Content...' : 'Generate Content'}
              </button>
            </div>

            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Brand *
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search for a brand..."
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value)
                    setShowBrandDropdown(true)
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                />
                
                {/* Dropdown */}
                {showBrandDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => (
                        <div
                          key={brand.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleBrandSelect(brand)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              {brand.icon ? (
                                <Image
                                  src={brand.icon}
                                  alt={`${brand.name} logo`}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-blue-600 text-sm font-medium ${brand.icon ? 'hidden' : ''}`}>
                                {brand.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{brand.name}</div>
                              {brand.description && (
                                <div className="text-sm text-gray-500 truncate">{brand.description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">No brands found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Brand Display */}
              {postData.selectedBrand && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      {postData.selectedBrand.icon ? (
                        <Image
                          src={postData.selectedBrand.icon}
                          alt={`${postData.selectedBrand.name} logo`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-blue-600 text-sm font-medium ${postData.selectedBrand.icon ? 'hidden' : ''}`}>
                        {postData.selectedBrand.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">Selected: {postData.selectedBrand.name}</div>
                      {postData.selectedBrand.description && (
                        <div className="text-sm text-blue-700">{postData.selectedBrand.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Content Display */}
            {showGeneratedContent && (generatedContent.instagram || generatedContent.x) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 text-center">Generated Content</h3>
                
                {generatedContent.instagram && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-pink-800 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Instagram
                      </h4>
                      <button
                        onClick={() => copyToClipboard(generatedContent.instagram!, 'Instagram')}
                        className="px-3 py-1 bg-pink-500 text-white text-sm rounded hover:bg-pink-600 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedContent.instagram}
                    </div>
                  </div>
                )}

                {generatedContent.x && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter)
                      </h4>
                      <button
                        onClick={() => copyToClipboard(generatedContent.x!, 'X')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedContent.x}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">How to Use</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Select a brand</strong> from the dropdown to get started</li>
                <li>• <strong>Generate content</strong> automatically using AI based on the selected brand</li>
                <li>• <strong>Copy the generated content</strong> for Instagram and X platforms</li>
                <li>• <strong>Use the content</strong> to manually post to your social media platforms</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

