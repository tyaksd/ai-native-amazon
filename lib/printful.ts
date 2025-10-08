import { supabaseAdmin } from './supabase-admin'

// Printful API types
export interface PrintfulProduct {
  id: number
  name: string
  type: string
  brand: string
  model: string
  image: string
  variant_count: number
  currency: string
  price: string
  in_stock: boolean
}

export interface PrintfulVariant {
  id: number
  product_id: number
  name: string
  size: string
  color: string
  color_code: string
  image: string
  price: string
  in_stock: boolean
}

export interface PrintfulFile {
  id: number
  type: string
  hash: string
  url: string
  filename: string
  mime_type: string
  size: number
  width: number
  height: number
  dpi: number
  status: string
  created: number
  thumbnail_url: string
  preview_url: string
  visible: boolean
}

export interface PrintfulFileWithPosition {
  id: number
  type: string
  hash: string
  url: string
  filename: string
  mime_type: string
  size: number
  width: number
  height: number
  dpi: number
  status: string
  created: number
  thumbnail_url: string
  preview_url: string
  visible: boolean
  placement?: string
  position?: {
    area_width: number
    area_height: number
    width: number
    height: number
    top: number
    left: number
  }
}

export interface PrintfulOrderItem {
  variant_id: number
  quantity: number
  retail_price?: string
  name?: string
  files?: PrintfulFileWithPosition[]
  options?: {
    id: string
    value: string
  }[]
}

export interface PrintfulOrder {
  external_id: string
  shipping: string
  recipient: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  }
  items: PrintfulOrderItem[]
  retail_costs?: {
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
  gift?: {
    subject: string
    message: string
  }
  packing_slip?: {
    email: string
    phone: string
    message: string
    logo_url?: string
  }
}

export interface PrintfulOrderResponse {
  id: number
  external_id: string
  status: string
  shipping: string
  created: number
  updated: number
  recipient: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  }
  items: PrintfulOrderItem[]
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
  retail_costs?: {
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
  shipments: any[]
  gift?: {
    subject: string
    message: string
  }
  packing_slip?: {
    email: string
    phone: string
    message: string
    logo_url?: string
  }
}

class PrintfulClient {
  private apiKey: string
  private baseUrl = 'https://api.printful.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Printful API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    return response.json()
  }

  // Get all products
  async getProducts(): Promise<PrintfulProduct[]> {
    const response = await this.makeRequest<{ result: PrintfulProduct[] }>(
      '/products'
    )
    return response.result
  }

  // Get product by ID
  async getProduct(productId: number): Promise<PrintfulProduct> {
    const response = await this.makeRequest<{ result: PrintfulProduct }>(
      `/products/${productId}`
    )
    return response.result
  }

  // Get product variants
  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    const response = await this.makeRequest<{ result: PrintfulVariant[] }>(
      `/products/${productId}/variants`
    )
    return response.result
  }

  // Upload file
  async uploadFile(fileUrl: string, filename: string): Promise<PrintfulFile> {
    const response = await this.makeRequest<{ result: PrintfulFile }>(
      '/files',
      {
        method: 'POST',
        body: JSON.stringify({
          url: fileUrl,
          filename: filename,
        }),
      }
    )
    return response.result
  }

  // Upload file with position settings
  async uploadFileWithPosition(
    fileUrl: string, 
    filename: string, 
    position?: {
      area_width: number
      area_height: number
      width: number
      height: number
      top: number
      left: number
    },
    placement?: string
  ): Promise<PrintfulFileWithPosition> {
    const response = await this.makeRequest<{ result: PrintfulFileWithPosition }>(
      '/files',
      {
        method: 'POST',
        body: JSON.stringify({
          url: fileUrl,
          filename: filename,
          position: position,
          placement: placement,
        }),
      }
    )
    return response.result
  }

  // Create order
  async createOrder(order: PrintfulOrder): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(order),
      }
    )
    return response.result
  }

  // Get order by external ID
  async getOrder(externalId: string): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
      `/orders/@${externalId}`
    )
    return response.result
  }

  // Confirm order for fulfillment
  async confirmOrder(externalId: string): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
      `/orders/@${externalId}/confirm`,
      {
        method: 'POST',
      }
    )
    return response.result
  }

  // Create product
  async createProduct(productData: any): Promise<any> {
    const response = await this.makeRequest<{ result: any }>(
      '/store/products',
      {
        method: 'POST',
        body: JSON.stringify(productData),
      }
    )
    return response.result
  }
}

// Get Printful client instance
export function getPrintfulClient(): PrintfulClient {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY environment variable is required')
  }
  return new PrintfulClient(apiKey)
}

// T-shirt product mapping based on gender
// Note: These are example product IDs - you'll need to get the actual IDs from Printful API
export const TSHIRT_PRODUCTS = {
  unisex: {
    productId: 71, // Unisex Basic Softstyle T-Shirt | Gildan 64000
    name: 'Unisex Basic Softstyle T-Shirt',
  },
  men: {
    productId: 71, // Same as unisex
    name: 'Unisex Basic Softstyle T-Shirt',
  },
  women: {
    productId: 71, // Women's Relaxed T-Shirt | Bella + Canvas 6400
    name: "Women's Relaxed T-Shirt",
  },
} as const

// Get product ID based on gender
export function getTshirtProductId(gender: string): number {
  const normalizedGender = gender.toLowerCase()
  
  if (normalizedGender === 'women' || normalizedGender === 'female') {
    return TSHIRT_PRODUCTS.women.productId
  }
  
  // Default to unisex for men, unisex, or unknown
  return TSHIRT_PRODUCTS.unisex.productId
}

// Find T-shirt product by name pattern
export async function findTshirtProduct(
  gender: string,
  client: PrintfulClient
): Promise<PrintfulProduct | null> {
  const products = await client.getProducts()
  
  const searchPatterns = {
    unisex: ['unisex', 'basic', 'softstyle', 'gildan', '64000'],
    men: ['unisex', 'basic', 'softstyle', 'gildan', '64000'],
    women: ['women', 'relaxed', 'bella', 'canvas', '6400']
  }
  
  const normalizedGender = gender.toLowerCase()
  const patterns = normalizedGender === 'women' || normalizedGender === 'female' 
    ? searchPatterns.women 
    : searchPatterns.unisex
  
  // Find product that matches the patterns
  const matchingProduct = products.find(product => 
    patterns.some(pattern => 
      product.name?.toLowerCase().includes(pattern.toLowerCase())
    )
  )
  
  return matchingProduct || null
}

// Get product variants and find matching variant
export async function getMatchingVariant(
  productId: number,
  size: string,
  color: string
): Promise<PrintfulVariant | null> {
  const client = getPrintfulClient()
  const variants = await client.getProductVariants(productId)
  
  // Find variant that matches size and color
  const matchingVariant = variants.find(variant => 
    variant.size.toLowerCase() === size.toLowerCase() &&
    variant.color.toLowerCase() === color.toLowerCase()
  )
  
  return matchingVariant || null
}

// Calculate design position for T-shirt
export function calculateDesignPosition(
  designWidth: number,
  designHeight: number,
  tshirtType: 'unisex' | 'women' = 'unisex'
): {
  area_width: number
  area_height: number
  width: number
  height: number
  top: number
  left: number
} {
  // front_large: 15"×18" at 300DPI = 4500×5400px
  const area_width = 4500
  const area_height = 5400
  
  // Set design size to 1024×1024px as requested
  const finalWidth = 1024
  const finalHeight = 1024
  
  // Calculate width as 75% of print area width
  const targetWidth = Math.round(area_width * 0.75) // 4500 * 0.75 = 3375px
  const targetHeight = Math.round(area_height * 0.75) // 5400 * 0.75 = 4050px
  
  // Use the smaller dimension to maintain aspect ratio
  const scaleFactor = Math.min(targetWidth / finalWidth, targetHeight / finalHeight)
  const scaledWidth = Math.round(finalWidth * scaleFactor)
  const scaledHeight = Math.round(finalHeight * scaleFactor)
  
  // Central positioning algorithm: x = (area_w - w) / 2, y = (area_h - h) / 2
  const left = Math.round((area_width - scaledWidth) / 2)
  const top = Math.round((area_height - scaledHeight) / 2)
  
  return {
    area_width: area_width,
    area_height: area_height,
    width: scaledWidth,
    height: scaledHeight,
    top: top,
    left: left
  }
}

// Get image dimensions from URL
export async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  // For server-side, return default dimensions
  // In a real implementation, you might want to use a library like 'sharp' or 'jimp'
  return { width: 1000, height: 1000 }
}

// Create inside label file for brand using Printful's Inside Label 1.3 template
export async function createInsideLabelFile(
  brandLogoUrl: string,
  brandName: string,
  client: PrintfulClient
): Promise<PrintfulFileWithPosition> {
  // Inside Label 1.3 template specifications:
  // - Maximum print area: 3" x 3" (450px x 450px at 150 DPI)
  // - Template includes: size, material, country of origin, care instructions
  // - Brand logo is added to the template
  
  const insideLabelPosition = {
    area_width: 450,   // 3 inches at 150 DPI
    area_height: 450,  // 3 inches at 150 DPI
    width: 400,        // Logo area width
    height: 100,       // Logo area height
    top: 175,          // Center vertically in template
    left: 25           // Center horizontally in template
  }
  
  // Upload brand logo for Inside Label 1.3 template
  // Printful will automatically combine this with the 1.3 template
  const insideLabelFile = await client.uploadFileWithPosition(
    brandLogoUrl,
    `${brandName}_inside_label_1.3.png`,
    insideLabelPosition,
    "label_inside" // Inside label placement
  )
  
  return insideLabelFile
}

// Create Printful order from Stripe order data
export async function createPrintfulOrder(
  orderId: string,
  items: Array<{
    product_id: string | null
    product_name: string
    quantity: number
    size: string | null
    color: string | null
  }>,
  shippingAddress: any,
  customerEmail?: string
): Promise<PrintfulOrderResponse> {
  const client = getPrintfulClient()
  
  // Get product details from database
  const productIds = items
    .map(item => item.product_id)
    .filter(Boolean) as string[]
  
  if (productIds.length === 0) {
    throw new Error('No valid product IDs found in order items')
  }
  
  const { data: products, error } = await supabaseAdmin
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
  
  if (error || !products) {
    throw new Error(`Failed to fetch products: ${error?.message}`)
  }
  
  const printfulItems: PrintfulOrderItem[] = []
  
  for (const item of items) {
    if (!item.product_id) continue
    
    const product = products.find(p => p.id === item.product_id)
    if (!product) continue
    
    // Determine gender and get appropriate product ID
    const gender = product.gender || 'unisex'
    
    // Try to find the actual product in Printful
    let printfulProduct = await findTshirtProduct(gender, client)
    let printfulProductId = printfulProduct?.id
    
    // Fallback to hardcoded IDs if not found
    if (!printfulProductId) {
      printfulProductId = getTshirtProductId(gender)
      console.warn(`Using fallback product ID ${printfulProductId} for gender: ${gender}`)
    }
    
    // Get matching variant
    const variant = await getMatchingVariant(
      printfulProductId,
      item.size || 'M',
      item.color || 'Black'
    )
    
    if (!variant) {
      console.warn(`No matching variant found for product ${item.product_id}, size: ${item.size}, color: ${item.color}`)
      continue
    }
    
    // Upload design file with position if available
    let designFiles: PrintfulFileWithPosition[] = []
    if (product.design_png && product.design_png.length > 0) {
      try {
        // Determine T-shirt type for position calculation
        const tshirtType = (product.gender?.toLowerCase() === 'women') ? 'women' : 'unisex'
        
        // Get actual design dimensions
        const { width: designWidth, height: designHeight } = await getImageDimensions(product.design_png[0])
        
        // Calculate design position based on actual dimensions
        const designPosition = calculateDesignPosition(designWidth, designHeight, tshirtType)
        
        const designFile = await client.uploadFileWithPosition(
          product.design_png[0], // Use first design file
          `${product.name}_design.png`,
          designPosition,
          "front_large"
        )
        designFiles.push(designFile)
        
        // Add inside label with brand logo
        if (product.brands?.[0]?.icon) {
          try {
            const insideLabelFile = await createInsideLabelFile(
              product.brands[0].icon,
              product.brands[0].name,
              client
            )
            designFiles.push(insideLabelFile)
          } catch (error) {
            console.error(`Failed to create inside label for product ${product.id}:`, error)
          }
        }
      } catch (error) {
        console.error(`Failed to upload design file for product ${product.id}:`, error)
      }
    }
    
    printfulItems.push({
      variant_id: variant.id,
      quantity: item.quantity,
      retail_price: '0.00', // Set to 0 since we handle pricing separately
      name: item.product_name,
      files: designFiles,
    })
  }
  
  if (printfulItems.length === 0) {
    throw new Error('No valid items found for Printful order')
  }
  
  // Create Printful order
  const printfulOrder: PrintfulOrder = {
    external_id: orderId,
    shipping: 'STANDARD',
    recipient: {
      name: shippingAddress.name || 'Customer',
      address1: shippingAddress.line1 || shippingAddress.address_line_1,
      address2: shippingAddress.line2 || shippingAddress.address_line_2,
      city: shippingAddress.city,
      state_code: shippingAddress.state,
      country_code: shippingAddress.country,
      zip: shippingAddress.postal_code,
      phone: shippingAddress.phone,
      email: customerEmail,
    },
    items: printfulItems,
  }
  
  // Create order in Printful
  const printfulOrderResponse = await client.createOrder(printfulOrder)
  
  console.log('Printful order created:', printfulOrderResponse.id)
  
  return printfulOrderResponse
}
