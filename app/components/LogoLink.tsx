import Link from 'next/link'
import Image from 'next/image'

export default function LogoLink() {
  return (
    <Link href="/" className="flex items-center gap-3 mx-auto md:mx-0 md:mr-auto">
      <Image src="/godship.png" alt="Godship" width={32} height={32} className="rounded" />
    </Link>
  )
}
