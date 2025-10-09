// Enhanced Printful v2 integration for existing webhook system
import { getPrintfulV2Client } from './printful-v2'
import { supabaseAdmin } from './supabase-admin'
import { calculateDesignPosition } from './printful'


export interface EnhancedPrintfulOrderItem {
  variant_id: number
  quantity: number
  name: string
  files: Array<{
    id: number
    type: string
    url: string
    position?: {
      area_width: number
      area_height: number
      width: number
      height: number
      top: number
      left: number
    }
  }>
}

export interface EnhancedPrintfulAddress {
  name: string
  address1: string
  address2?: string
  city: string
  state_code?: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

export interface EnhancedPrintfulOrderResponse {
  id: number
  external_id: string
  status: string
  shipping: string
  created: number
  updated: number
  recipient: {
    name: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    name: string
    files: Array<{
      id: number
      type: string
      url: string
      position?: {
        area_width: number
        area_height: number
        width: number
        height: number
        top: number
        left: number
      }
    }>
  }>
  costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    digitization: string
    additional_fee: string
    fulfillment_fee: string
    tax: string
    vat: string
    total: string
  }
  retail_costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    tax: string
    total: string
  }
  shipments: Array<{
    id: number
    carrier: string
    service: string
    tracking_number: string
    tracking_url: string
    created: number
    ship_date: string
    shipped_at: number
    reshipment: boolean
    items: Array<{
      item_id: number
      quantity: number
    }>
  }>
}

/**
 * Enhanced order creation with API v2 features
 */
export async function createEnhancedPrintfulOrder(
  orderId: string,
  items: Array<{
    product_id: string | null
    product_name: string
    quantity: number
    size: string | null
    color: string | null
  }>,
  shippingAddress: EnhancedPrintfulAddress,
  customerEmail?: string,
  options?: {
    estimateCosts?: boolean
    useMockups?: boolean
  }
): Promise<EnhancedPrintfulOrderResponse> {
  console.log('=== Enhanced Printful Order Creation (API v2) ===')
  console.log('Order ID:', orderId)
  console.log('Items:', JSON.stringify(items, null, 2))
  console.log('Shipping address:', JSON.stringify(shippingAddress, null, 2))
  console.log('Customer email:', customerEmail)
  console.log('Options:', options)

  const client = getPrintfulV2Client()

  // Get product data from database
  const productIds = items.map(i => i.product_id).filter((v): v is string => Boolean(v))
  if (productIds.length === 0) {
    throw new Error('No valid product IDs found in order items')
  }

  const { data: productsRaw, error } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      gender,
      design_png,
      colors,
      sizes,
      brand_id,
      brands!inner(
        id,
        name,
        icon
      )
    `)
    .in('id', productIds)

  if (error) {
    console.error('Failed to fetch products:', error)
    throw new Error(`Failed to fetch products: ${error?.message}`)
  }

  const products = Array.isArray(productsRaw) ? productsRaw : []
  const printfulItems: EnhancedPrintfulOrderItem[] = []

  // Process each item
  for (const item of items) {
    if (!item.product_id) continue

    const product = products?.find(p => p.id === item.product_id)
    if (!product) {
      console.warn(`Product not found: ${item.product_id}`)
      continue
    }

    // Find appropriate variant based on gender and size/color
    const gender = product.gender || 'unisex'
    const searchTerm = gender === 'women' ? 'Bella + Canvas 6400' : 'Gildan 64000'
    
    try {
      const catalogProducts = await client.getCatalogProducts(searchTerm)
      const tshirtProduct = catalogProducts?.find(p => 
        p.name?.toLowerCase().includes('t-shirt') || 
        p.name?.toLowerCase().includes('tee')
      )

      if (!tshirtProduct) {
        console.warn(`No T-shirt product found for gender: ${gender}`)
        continue
      }

      const productDetails = await client.getCatalogProduct(tshirtProduct.id)
      const variants = productDetails?.variants || []
      
      if (!variants || variants.length === 0) {
        console.warn(`No variants found for product: ${tshirtProduct.id}`)
        continue
      }

      // Find matching variant by size and color with better matching logic
      let matchingVariant = variants?.find(v => 
        v.size === item.size && 
        v.color === item.color
      )

      // If exact match not found, try case-insensitive matching
      if (!matchingVariant) {
        matchingVariant = variants?.find(v => 
          v.size?.toLowerCase() === item.size?.toLowerCase() && 
          v.color?.toLowerCase() === item.color?.toLowerCase()
        )
      }

      // If still not found, try partial matching for color
      if (!matchingVariant) {
        matchingVariant = variants?.find(v => 
          v.size === item.size && 
          v.color?.toLowerCase().includes(item.color?.toLowerCase() || '')
        )
      }

      if (!matchingVariant) {
        console.warn(`No matching variant found for size: ${item.size}, color: ${item.color}`)
        console.warn(`Available variants:`, variants?.map(v => ({ size: v.size, color: v.color, id: v.id })))
        continue
      }

      // Upload design files with proper positioning
      const designFiles = []
      if (product.design_png && product.design_png.length > 0) {
        for (const designUrl of product.design_png) {
          try {
            const uploadedFile = await client.uploadFile(designUrl, `${product.name}_design.png`)
            
            // Calculate proper position for 1024x1024 PNG
            // プリントエリアの中央に配置し、横幅をプリントエリアの75%にする
            const position = calculateDesignPosition(1024, 1024)
            
            designFiles.push({
              id: uploadedFile.id,
              type: 'default',
              url: uploadedFile.url,
              position: {
                area_width: position.area_width,
                area_height: position.area_height,
                width: position.width,
                height: position.height,
                top: position.top,
                left: position.left
              }
            })
          } catch (error) {
            console.error(`Failed to upload design file: ${designUrl}`, error)
          }
        }
      }

      printfulItems.push({
        variant_id: matchingVariant.id,
        quantity: item.quantity,
        name: item.product_name,
        files: designFiles
      })

    } catch (error) {
      console.error(`Failed to process product ${product.id}:`, error)
    }
  }

  if (printfulItems.length === 0) {
    throw new Error('No valid items found for Printful order')
  }

  // Estimate costs if requested
  if (options?.estimateCosts) {
    console.log('Estimating order costs...')
    try {
      const costEstimate = await client.estimateOrderCosts({
        recipient: {
          country_code: shippingAddress.country_code,
          state_code: shippingAddress.state_code,
          city: shippingAddress.city,
          zip: shippingAddress.zip
        },
        items: printfulItems.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        }))
      })
      
      console.log('Cost estimate:', costEstimate)
    } catch (error) {
      console.error('Cost estimation failed:', error)
    }
  }

  // Create the order
  const orderData = {
    external_id: orderId,
    shipping: 'STANDARD',
    recipient: shippingAddress,
    items: printfulItems
  }

  console.log('Creating enhanced Printful order...')
  const order = await client.createOrder(orderData)
  
  console.log('✅ Enhanced Printful order created successfully!')
  console.log('Order ID:', order.id)
  console.log('External ID:', order.external_id)
  console.log('Status:', order.status)

  return order
}

/**
 * Enhanced mockup generation for products
 */
export async function generateProductMockups(
  productId: string,
  designUrl: string,
  variantIds: number[],
  placement: string = 'front'
): Promise<{
  taskKey: string
  status: string
  mockups?: Array<{
    placement: string
    image_url: string
    variant_ids: number[]
  }>
  error?: string
}> {
  console.log('=== Generating Product Mockups ===')
  console.log('Product ID:', productId)
  console.log('Design URL:', designUrl)
  console.log('Variant IDs:', variantIds)
  console.log('Placement:', placement)

  const client = getPrintfulV2Client()

  try {
    // Create mockup generation task
    const mockupTask = await client.createMockupTask(
      parseInt(productId),
      variantIds,
      [{
        placement,
        image_url: designUrl
      }],
      {
        format: 'jpg',
        width: 1000,
        dpi: 150
      }
    )

    console.log('Mockup task created:', mockupTask.task_key)
    return {
      taskKey: mockupTask.task_key,
      status: mockupTask.status,
      mockups: mockupTask.mockups,
      error: mockupTask.error
    }

  } catch (error) {
    console.error('Mockup generation failed:', error)
    throw error
  }
}

/**
 * Get mockup task result
 */
export async function getMockupTaskResult(taskKey: string): Promise<{
  taskKey: string
  status: string
  mockups?: Array<{
    placement: string
    image_url: string
    variant_ids: number[]
  }>
  error?: string
}> {
  const client = getPrintfulV2Client()
  const result = await client.getMockupTaskResult(taskKey)
  return {
    taskKey: result.task_key,
    status: result.status,
    mockups: result.mockups,
    error: result.error
  }
}
