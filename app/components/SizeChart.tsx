'use client'

import { useState } from 'react'

interface SizeChartProps {
  className?: string
}

export default function SizeChart({ className = '' }: SizeChartProps) {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')
  const [isExpanded, setIsExpanded] = useState(false)

  const sizeData = {
    inches: [
      { size: 'S', length: '28', width: '18', sleeveLength: '16 ¾' },
      { size: 'M', length: '29', width: '20', sleeveLength: '17 ⅞' },
      { size: 'L', length: '30', width: '22', sleeveLength: '19 ⅛' },
      { size: 'XL', length: '31', width: '24', sleeveLength: '20 ⅜' },
      { size: '2XL', length: '32', width: '26', sleeveLength: '21 ⅝' },
      { size: '3XL', length: '33', width: '28', sleeveLength: '22 ¾' }
    ],
    cm: [
      { size: 'S', length: '71', width: '46', sleeveLength: '43' },
      { size: 'M', length: '74', width: '51', sleeveLength: '45' },
      { size: 'L', length: '76', width: '56', sleeveLength: '49' },
      { size: 'XL', length: '79', width: '61', sleeveLength: '52' },
      { size: '2XL', length: '81', width: '66', sleeveLength: '55' },
      { size: '3XL', length: '84', width: '71', sleeveLength: '58' }
    ]
  }

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
                  <th className="text-left py-2 font-medium text-gray-900">WIDTH</th>
                  <th className="text-left py-2 font-medium text-gray-900">SLEEVE LENGTH</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900 font-medium">{row.size}</td>
                    <td className="py-2 text-gray-700">{row.length}</td>
                    <td className="py-2 text-gray-700">{row.width}</td>
                    <td className="py-2 text-gray-700">{row.sleeveLength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
