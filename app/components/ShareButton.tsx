'use client'

import { useState } from 'react'

interface ShareButtonProps {
  productUrl: string
  productName: string
  productImage?: string
  className?: string
}

export default function ShareButton({ productUrl, productName, productImage, className = '' }: ShareButtonProps) {
  const [showShareOptions, setShowShareOptions] = useState(false)

  // 地域に基づいてSNSオプションを決定
  const getShareOptions = () => {
    const isJapan = typeof navigator !== 'undefined' && 
      (navigator.language === 'ja' || navigator.language.startsWith('ja-'))

    const baseOptions = [
      {
        name: 'X',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        ),
        color: 'bg-black',
        action: () => {
          const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`Check out this product: ${productName}`)}`
          window.open(twitterUrl, '_blank')
        }
      },
      {
        name: 'WhatsApp',
        icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        ),
        color: 'bg-green-600',
        action: () => {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this product: ${productName} ${productUrl}`)}`
          window.open(whatsappUrl, '_blank')
        }
      },
      {
        name: 'Facebook',
        icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        ),
        color: 'bg-blue-600',
        action: () => {
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
          window.open(facebookUrl, '_blank')
        }
      },
      {
        name: 'Instagram',
        icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        ),
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        action: () => {
          // Instagram doesn't have direct sharing, so we'll copy the link
          navigator.clipboard.writeText(productUrl).then(() => {
            alert('Product link copied! You can paste it in your Instagram story or post.')
          })
        }
      },
      {
        name: 'Copy Link',
        icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        ),
        color: 'bg-gray-600',
        action: () => {
          navigator.clipboard.writeText(productUrl).then(() => {
            alert('Link copied to clipboard!')
          })
        }
      }
    ]

    // 日本ユーザーの場合はLINEを追加
    if (isJapan) {
      baseOptions.unshift({
        name: 'LINE',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <path fill="#00B900" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .345-.279.63-.631.63-.346 0-.626-.285-.626-.63V8.108c0-.27.173-.51.43-.595.06-.023.136-.035.194-.035.197 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .345-.282.63-.63.63-.345 0-.63-.285-.63-.63V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.771zm-2.466.63H4.917c-.345 0-.63-.285-.63-.63V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.345 0 .63.283.63.63 0 .344-.285.629-.63.629z"/>
          </svg>
        ),
        color: 'bg-green-500',
        action: () => {
          const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(productUrl)}`
          window.open(lineUrl, '_blank')
        }
      })
    }

    return baseOptions
  }

  const shareOptions = getShareOptions()

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this product: ${productName}`,
          url: productUrl,
        })
        return true
      } catch (error) {
        console.log('Native share cancelled or failed')
        return false
      }
    }
    return false
  }

  const handleShareClick = async () => {
    const shared = await handleNativeShare()
    if (!shared) {
      setShowShareOptions(true)
    }
  }

  return (
    <>
      <button
        onClick={handleShareClick}
        className={`flex items-center justify-center p-3 sm:p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 ${className}`}
        title="Share product"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>

      {/* Share Options Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Share Product</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Share Options */}
            <div className="p-6">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {shareOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      option.action()
                      setShowShareOptions(false)
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.color} text-white min-w-[80px] hover:scale-105 transition-transform`}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium text-center">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
