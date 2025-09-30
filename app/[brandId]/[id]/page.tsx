'use client'

import ProductDetail from '@/app/product/[id]/page'

type PageProps = {
  params: { brandId: string; id: string }
}

export default function ProductByBrandRoute({ params }: PageProps) {
  // Reuse the existing product detail component; it reads by product id
  // and renders the same UI. Brand segment is just for URL structure.
  // We forward the id via the same prop shape.
  return <ProductDetail params={{ id: params.id }} />
}


