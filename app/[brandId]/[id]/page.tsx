'use client'

import ProductDetail from '@/app/product/[id]/page'
import { use } from 'react'

type PageProps = {
  params: Promise<{ brandId: string; id: string }>
}

export default function ProductByBrandRoute({ params }: PageProps) {
  // Reuse the existing product detail component; it reads by product id
  // and renders the same UI. Brand segment is just for URL structure.
  // We forward the id via the same prop shape.
  const resolvedParams = use(params)
  return <ProductDetail params={Promise.resolve({ id: resolvedParams.id })} />
}


