'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LogoLink() {
  const router = useRouter()

  const handleLogoClick = (e: React.MouseEvent) => {
    // 検索状態とフィルター状態をクリアするためにURLパラメータを削除
    e.preventDefault()
    router.push('/')
  }

  return (
    <Link 
      href="/" 
      onClick={handleLogoClick}
      className="flex items-center gap-3 mx-auto md:mx-0 md:mr-auto"
    >
      <Image src="/godship.png" alt="Godship" width={32} height={32} className="rounded" unoptimized />
    </Link>
  )
}
