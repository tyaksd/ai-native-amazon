'use client'

import { useState } from 'react'
import Image from 'next/image'

interface AccountInfoProps {
  userId: string
  user: {
    firstName: string | null
    lastName: string | null
    imageUrl: string
    emailAddresses: Array<{
      emailAddress: string
      verification: {
        status: string
      }
    }>
    createdAt: number
  }
}

export default function AccountInfo({ userId, user }: AccountInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          {user.imageUrl && (
            <Image 
              src={user.imageUrl} 
              alt="Profile" 
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || 'User'
              }
            </h3>
            <p className="text-sm text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">{userId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <p className="mt-1 text-sm text-green-600 font-medium">✓ Active</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Verified</label>
              <p className="mt-1 text-sm text-green-600 font-medium">
                {user.emailAddresses[0]?.verification?.status === 'verified' ? '✓ Verified' : '⚠ Pending'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
