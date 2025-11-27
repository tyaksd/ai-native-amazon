'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SizeChartProps {
  className?: string
  productType?: string
}

export default function SizeChart({ className = '', productType }: SizeChartProps) {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')
  const [isExpanded, setIsExpanded] = useState(false)

  const isLongTee = productType?.toLowerCase().includes('long tee') || 
                    productType?.toLowerCase().includes('longtee') || 
                    productType?.toLowerCase().includes('long-tee')

  const isHoodie = productType?.toLowerCase().includes('hoodie')

  const isSweatshirt = productType?.toLowerCase().includes('sweatshirt')

  const tshirtSizeData = {
    inches: [
      { size: 'S', length: '28', chest: '34 - 37', sleeveLength: '16 ¾' },
      { size: 'M', length: '29', chest: '38 - 41', sleeveLength: '17 ⅞' },
      { size: 'L', length: '30', chest: '42 - 45', sleeveLength: '19 ⅛' },
      { size: 'XL', length: '31', chest: '46 - 49', sleeveLength: '20 ⅜' },
      { size: '2XL', length: '32', chest: '50 - 53', sleeveLength: '21 ⅝' },
      { size: '3XL', length: '33', chest: '54 - 57', sleeveLength: '22 ¾' }
    ],
    cm: [
      { size: 'S', length: '71', chest: '86.4 - 94', sleeveLength: '42.6' },
      { size: 'M', length: '73.7', chest: '96.5 - 104', sleeveLength: '45.4' },
      { size: 'L', length: '76.2', chest: '106.7 - 114.3', sleeveLength: '48.6' },
      { size: 'XL', length: '78.7', chest: '116.8 - 124.5', sleeveLength: '51.8' },
      { size: '2XL', length: '81.3', chest: '127 - 134.6', sleeveLength: '55' },
      { size: '3XL', length: '83.8', chest: '137.2 - 144.8', sleeveLength: '57.8' }
    ]
  }

  const longTeeSizeData = {
    inches: [
      { size: 'S', length: '28', chest: '34 - 37', sleeveLength: '25 ⅝' },
      { size: 'M', length: '29', chest: '38 - 41', sleeveLength: '26 ¼' },
      { size: 'L', length: '30', chest: '42 - 45', sleeveLength: '26 ⅞' },
      { size: 'XL', length: '31', chest: '46 - 49', sleeveLength: '27 ½' },
      { size: '2XL', length: '32', chest: '50 - 53', sleeveLength: '28 ⅛' }
    ],
    cm: [
      { size: 'S', length: '71', chest: '86.4 - 94', sleeveLength: '65' },
      { size: 'M', length: '73.7', chest: '96.5 - 104', sleeveLength: '66.6' },
      { size: 'L', length: '76.2', chest: '106.7 - 114.3', sleeveLength: '68.3' },
      { size: 'XL', length: '78.7', chest: '116.8 - 124.5', sleeveLength: '70' },
      { size: '2XL', length: '81.3', chest: '127 - 134.6', sleeveLength: '71.4' }
    ]
  }

  const hoodieSizeData = {
    inches: [
      { size: 'S', length: '27', chest: '38 - 41', sleeveLength: '' },
      { size: 'M', length: '28', chest: '42 - 45', sleeveLength: '' },
      { size: 'L', length: '29', chest: '46 - 49', sleeveLength: '' },
      { size: 'XL', length: '30', chest: '50 - 53', sleeveLength: '' },
      { size: '2XL', length: '31', chest: '54 - 57', sleeveLength: '' },
      { size: '3XL', length: '32', chest: '58 - 62', sleeveLength: '' }
    ],
    cm: [
      { size: 'S', length: '68.6', chest: '96.5 - 104', sleeveLength: '' },
      { size: 'M', length: '71', chest: '106.7 - 114.3', sleeveLength: '' },
      { size: 'L', length: '73.7', chest: '116.8 - 124.5', sleeveLength: '' },
      { size: 'XL', length: '76.2', chest: '127 - 134.6', sleeveLength: '' },
      { size: '2XL', length: '78.7', chest: '137.2 - 144.8', sleeveLength: '' },
      { size: '3XL', length: '81.3', chest: '147.3 - 157.5', sleeveLength: '' }
    ]
  }

  const sweatshirtSizeData = {
    inches: [
      { size: 'S', length: '27', chest: '38 - 41', sleeveLength: '33 ½' },
      { size: 'M', length: '28', chest: '42 - 45', sleeveLength: '34 ½' },
      { size: 'L', length: '29', chest: '46 - 49', sleeveLength: '35 ½' },
      { size: 'XL', length: '30', chest: '50 - 53', sleeveLength: '36 ½' },
      { size: '2XL', length: '31', chest: '54 - 57', sleeveLength: '37 ½' },
      { size: '3XL', length: '32', chest: '58 - 61', sleeveLength: '38 ½' }
    ],
    cm: [
      { size: 'S', length: '68.6', chest: '96.5 - 104', sleeveLength: '85' },
      { size: 'M', length: '71', chest: '106.7 - 114.3', sleeveLength: '87.6' },
      { size: 'L', length: '73.7', chest: '116.8 - 124.5', sleeveLength: '90.2' },
      { size: 'XL', length: '76.2', chest: '127 - 134.6', sleeveLength: '92.7' },
      { size: '2XL', length: '78.7', chest: '137.2 - 144.8', sleeveLength: '95.3' },
      { size: '3XL', length: '81.3', chest: '147.3 - 155', sleeveLength: '97.8' }
    ]
  }

  const sizeData = isLongTee ? longTeeSizeData : isHoodie ? hoodieSizeData : isSweatshirt ? sweatshirtSizeData : tshirtSizeData
  const currentData = sizeData[unit]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Size Chart</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setUnit('inches')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              unit === 'inches' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inches
          </button>
          <button
            onClick={() => setUnit('cm')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              unit === 'cm' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Centimeters
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">SIZE LABEL</th>
                  <th className="text-left py-2 font-medium text-gray-900">LENGTH</th>
                  <th className="text-left py-2 font-medium text-gray-900">CHEST</th>
                  {!isHoodie && <th className="text-left py-2 font-medium text-gray-900">SLEEVE LENGTH</th>}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900 font-medium">{row.size}</td>
                    <td className="py-2 text-gray-700">{row.length}</td>
                    <td className="py-2 text-gray-700">{(row as any).chest || (row as any).width}</td>
                    {!isHoodie && <td className="py-2 text-gray-700">{row.sleeveLength}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Measurement guide image and disclaimer - for T-shirts, Hoodies, Long Tees, and Sweatshirts */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-center">
              <Image
                src={
                  isHoodie 
                    ? "/hoodie-measurement-guide.png" 
                    : isLongTee 
                    ? "/ls-measure-guide.png" 
                    : isSweatshirt
                    ? "/sweat-measure-guide.png"
                    : "/tshirt-measurement-guide.png"
                }
                alt={
                  isHoodie 
                    ? "Hoodie measurement guide" 
                    : isLongTee 
                    ? "Long Tee measurement guide" 
                    : isSweatshirt
                    ? "Sweatshirt measurement guide"
                    : "T-shirt measurement guide"
                }
                width={200}
                height={300}
                className="object-contain"
              />
            </div>
            <p className="text-xs text-gray-600 text-center">
              Product measurements may vary by up to 2&quot; (5 cm).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
