'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoLink() {
  const router = useRouter()
  const [isNiku, setIsNiku] = useState(false)

  const handleLogoClick = (e: React.MouseEvent) => {
    // 検索状態とフィルター状態をクリアするためにURLパラメータを削除
    e.preventDefault()
    
    // 画像を切り替える
    setIsNiku(!isNiku)
    
    router.push('/brands')
  }

  return (
    <Link 
      href="/brands" 
      onClick={handleLogoClick}
      className="flex items-center gap-3 mx-auto md:mx-0 md:mr-auto"
    >
      <Image 
        src={isNiku ? "/niku.png" : "/gwhite.png"} 
        alt="Godship" 
        width={32} 
        height={32} 
        className="rounded" 
        unoptimized 
      />
    </Link>
  )
}
