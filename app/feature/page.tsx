'use client'

import { useState, useEffect, useCallback } from 'react'
import OptimizedImage from '@/app/components/OptimizedImage'
import Link from 'next/link'

interface Feature {
  id: string
  title: string
  subtitle: string
  image_url: string
  link_url: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function FeatureManagementPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '/explore',
    display_order: 0,
    is_active: true,
  })

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/features')
      const data = await response.json()
      setFeatures(data)
    } catch (error) {
      console.error('Error loading features:', error)
      setError('Failed to load features')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = useCallback(() => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? ''
    if (!adminPassword) {
      setError('Admin password is not configured')
      return
    }
    if (password === adminPassword) {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('feature_admin_auth', 'true')
      }
      setError('')
      loadFeatures()
    } else {
      setError('Incorrect password')
    }
  }, [password, loadFeatures])

  // Check if component is mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we need password (production only)
  useEffect(() => {
    if (!mounted) return

    const isProduction = process.env.NODE_ENV === 'production'
    
    // In development, auto-authenticate
    if (!isProduction) {
      setIsAuthenticated(true)
      loadFeatures()
    } else {
      // In production, check if already authenticated
      const authStatus = sessionStorage.getItem('feature_admin_auth')
      if (authStatus === 'true') {
        setIsAuthenticated(true)
        loadFeatures()
      }
    }
  }, [mounted, loadFeatures])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-feature-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.url) {
        setFormData((prev) => ({ ...prev, image_url: data.url }))
      } else {
        setError('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingFeature) {
        // Update existing feature
        const response = await fetch('/api/features', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFeature.id, ...formData }),
        })

        if (response.ok) {
          await loadFeatures()
          resetForm()
        } else {
          setError('Failed to update feature')
        }
      } else {
        // Create new feature
        const response = await fetch('/api/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await loadFeatures()
          resetForm()
        } else {
          setError('Failed to create feature')
        }
      }
    } catch (error) {
      console.error('Error saving feature:', error)
      setError('Failed to save')
    }
  }

  const handleEdit = useCallback((feature: Feature) => {
    setEditingFeature(feature)
    setFormData({
      title: feature.title,
      subtitle: feature.subtitle,
      image_url: feature.image_url,
      link_url: feature.link_url,
      display_order: feature.display_order,
      is_active: feature.is_active,
    })
    setIsCreating(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return

    try {
      const response = await fetch(`/api/features?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadFeatures()
      } else {
        setError('Failed to delete feature')
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
      setError('Failed to delete')
    }
  }, [loadFeatures])

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '/explore',
      display_order: 0,
      is_active: true,
    })
    setEditingFeature(null)
    setIsCreating(false)
  }, [])

  // Prevent hydration mismatch - wait for client-side mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Feature Management</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Management screen
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Feature Management</h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </Link>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isCreating ? 'Cancel' : 'Create New'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">
              {editingFeature ? 'Edit Feature' : 'Create New Feature'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-400">Uploading...</p>
                  )}
                  {formData.image_url && (
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="Or enter image URL directly"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Link URL</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="/explore"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingFeature ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Features List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Registered Features</h2>
            {features.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No features registered yet
              </p>
            ) : (
              features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex gap-4"
                >
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={feature.image_url}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold">{feature.title}</h3>
                        <p className="text-gray-400 text-sm">{feature.subtitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            feature.is_active
                              ? 'bg-green-900 text-green-200'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {feature.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          Order: {feature.display_order}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Link: {feature.link_url}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(feature)}
                        className="px-4 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(feature.id)}
                        className="px-4 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

