// Enhanced Printful v2 integration for existing webhook system
import { getPrintfulV2Client } from './printful-v2'
import { supabaseAdmin } from './supabase-admin'
import { calculateDesignPosition } from './printful'
import { getVariantMapping, upsertVariantMapping, VariantMappingInput } from './printful-variant-mapping'
import { PrintfulCatalogClient } from './printful-catalog'


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

  // Process each item with cache-first approach
  for (const item of items) {
    if (!item.product_id) continue

    const product = products?.find(p => p.id === item.product_id)
    if (!product) {
      console.warn(`Product not found: ${item.product_id}`)
      continue
    }

    console.log(`Processing item: ${item.product_name} (${item.size}, ${item.color})`)

    // Step 1: Try to get variant mapping from database (cache-first)
    let matchingVariant = await getVariantMapping(
      item.product_id,
      item.size,
      item.color
    )

    if (matchingVariant) {
      console.log(`✅ Found cached variant mapping: ${matchingVariant.printful_variant_id}`)
    } else {
      console.log(`❌ No cached mapping found, attempting API lookup...`)
      
        // Step 2: Fallback to dynamic catalog lookup
        try {
          console.log(`❌ No cached mapping found, attempting dynamic catalog lookup...`)
          
          // カタログクライアントを使用してGildan 64000を検索
          const catalogClient = new PrintfulCatalogClient(process.env.PRINTFUL_API_KEY!)
          const gildanProduct = await catalogClient.findGildan64000()
          
          if (!gildanProduct) {
            console.warn(`Gildan 64000 not found in Printful catalog`)
            continue
          }

          console.log(`Found Gildan 64000: ${gildanProduct.name} (ID: ${gildanProduct.id})`)

          // 動的にvariant IDを取得
          const variantId = await catalogClient.getVariantId(
            gildanProduct.id, 
            item.size, 
            item.color
          )

          if (!variantId) {
            console.warn(`No matching variant found for size: ${item.size}, color: ${item.color}`)
            continue
          }

          console.log(`✅ Found dynamic variant: ${item.size} ${item.color} -> ${variantId}`)

          // Cache the mapping for future use
          const mappingInput: VariantMappingInput = {
            product_id: item.product_id,
            size: item.size,
            color: item.color,
            printful_variant_id: variantId,
            printful_product_id: gildanProduct.id
          }

          await upsertVariantMapping(mappingInput)
          console.log(`✅ Cached new dynamic variant mapping: ${variantId}`)

          matchingVariant = {
            id: '', // Will be set by database
            product_id: item.product_id,
            size: item.size,
            color: item.color,
            printful_variant_id: variantId,
            printful_product_id: gildanProduct.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

        } catch (apiError) {
          console.error(`❌ Dynamic catalog lookup failed for product ${item.product_id}:`, apiError)
          console.warn(`Skipping item due to API error - consider pre-populating mappings`)
          continue
        }
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
      variant_id: matchingVariant.printful_variant_id,
      quantity: item.quantity,
      name: item.product_name,
      files: designFiles
    })

  } catch (error) {
    console.error(`Failed to process product ${item.product_id}:`, error)
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
