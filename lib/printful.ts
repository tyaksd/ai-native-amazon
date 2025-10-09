// import { supabaseAdmin } from './supabase-admin'

// // Printful API types
// export interface PrintfulProduct {
//   id: number
//   name: string
//   type: string
//   brand: string
//   model: string
//   image: string
//   variant_count: number
//   currency: string
//   price: string
//   in_stock: boolean
// }

// export interface PrintfulVariant {
//   id: number
//   product_id: number
//   name: string
//   size: string
//   color: string
//   color_code: string
//   image: string
//   price: string
//   in_stock: boolean
// }

// export interface PrintfulFile {
//   id: number
//   type: string
//   hash: string
//   url: string
//   filename: string
//   mime_type: string
//   size: number
//   width: number
//   height: number
//   dpi: number
//   status: string
//   created: number
//   thumbnail_url: string
//   preview_url: string
//   visible: boolean
// }

// export interface PrintfulProductData {
//   sync_product: {
//     name: string
//     thumbnail?: string
//     description?: string
//   }
//   sync_variants: Array<{
//     variant_id: number
//     retail_price: string
//     files: Array<{
//       type: string
//       url: string
//       position?: {
//         area_width: number
//         area_height: number
//         width: number
//         height: number
//         top: number
//         left: number
//       }
//     }>
//   }>
// }

// export interface PrintfulFileWithPosition {
//   id: number
//   type: string
//   hash: string
//   url: string
//   filename: string
//   mime_type: string
//   size: number
//   width: number
//   height: number
//   dpi: number
//   status: string
//   created: number
//   thumbnail_url: string
//   preview_url: string
//   visible: boolean
//   placement?: string
//   position?: {
//     area_width: number
//     area_height: number
//     width: number
//     height: number
//     top: number
//     left: number
//   }
// }

// export interface PrintfulOrderItem {
//   variant_id: number
//   quantity: number
//   retail_price?: string
//   name?: string
//   files?: PrintfulFileWithPosition[]
//   options?: {
//     id: string
//     value: string
//   }[]
// }

// export interface PrintfulOrder {
//   external_id: string
//   shipping: string
//   recipient: {
//     name: string
//     company?: string
//     address1: string
//     address2?: string
//     city: string
//     state_code?: string
//     country_code: string
//     zip: string
//     phone?: string
//     email?: string
//   }
//   items: PrintfulOrderItem[]
//   retail_costs?: {
//     currency: string
//     subtotal: string
//     discount: string
//     shipping: string
//     digitization: string
//     additional_fee: string
//     fulfillment_fee: string
//     tax: string
//     vat: string
//     total: string
//   }
//   gift?: {
//     subject: string
//     message: string
//   }
//   packing_slip?: {
//     email: string
//     phone: string
//     message: string
//     logo_url?: string
//   }
// }

// export interface PrintfulOrderResponse {
//   id: number
//   external_id: string
//   status: string
//   shipping: string
//   created: number
//   updated: number
//   recipient: {
//     name: string
//     company?: string
//     address1: string
//     address2?: string
//     city: string
//     state_code?: string
//     country_code: string
//     zip: string
//     phone?: string
//     email?: string
//   }
//   items: PrintfulOrderItem[]
//   costs: {
//     currency: string
//     subtotal: string
//     discount: string
//     shipping: string
//     digitization: string
//     additional_fee: string
//     fulfillment_fee: string
//     tax: string
//     vat: string
//     total: string
//   }
//   retail_costs?: {
//     currency: string
//     subtotal: string
//     discount: string
//     shipping: string
//     digitization: string
//     additional_fee: string
//     fulfillment_fee: string
//     tax: string
//     vat: string
//     total: string
//   }
//   shipments: Array<{id: string; carrier: string; service: string; tracking_number: string; tracking_url: string; created: number; ship_date: string; shipped_at: number; reshipment: boolean; reshipment_reason: string; items: Array<{item_id: number; external_id: string; quantity: number}>}>
//   gift?: {
//     subject: string
//     message: string
//   }
//   packing_slip?: {
//     email: string
//     phone: string
//     message: string
//     logo_url?: string
//   }
// }

// class PrintfulClient {
//   private apiKey: string
//   private baseUrl = 'https://api.printful.com'

//   constructor(apiKey: string) {
//     this.apiKey = apiKey
//   }

//   private async makeRequest<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<T> {
//     const url = `${this.baseUrl}${endpoint}`
    
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         'Authorization': `Bearer ${this.apiKey}`,
//         'Content-Type': 'application/json',
//         ...options.headers,
//       },
//     })

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}))
//       throw new Error(
//         `Printful API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
//       )
//     }

//     return response.json()
//   }

//   // Get all products
//   async getProducts(): Promise<PrintfulProduct[]> {
//     const response = await this.makeRequest<{ result: PrintfulProduct[] }>(
//       '/products'
//     )
//     return response.result
//   }

//   // Get product by ID
//   async getProduct(productId: number): Promise<PrintfulProduct> {
//     const response = await this.makeRequest<{ result: PrintfulProduct }>(
//       `/products/${productId}`
//     )
//     return response.result
//   }

//   // Get product variants
//   async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
//     const response = await this.makeRequest<{ result: PrintfulVariant[] }>(
//       `/products/${productId}/variants`
//     )
//     return response.result
//   }

//   // Upload file
//   async uploadFile(fileUrl: string, filename: string): Promise<PrintfulFile> {
//     const response = await this.makeRequest<{ result: PrintfulFile }>(
//       '/files',
//       {
//         method: 'POST',
//         body: JSON.stringify({
//           url: fileUrl,
//           filename: filename,
//         }),
//       }
//     )
//     return response.result
//   }

//   // Upload file with position settings
//   async uploadFileWithPosition(
//     fileUrl: string, 
//     filename: string, 
//     position?: {
//       area_width: number
//       area_height: number
//       width: number
//       height: number
//       top: number
//       left: number
//     },
//     placement?: string
//   ): Promise<PrintfulFileWithPosition> {
//     const response = await this.makeRequest<{ result: PrintfulFileWithPosition }>(
//       '/files',
//       {
//         method: 'POST',
//         body: JSON.stringify({
//           url: fileUrl,
//           filename: filename,
//           position: position,
//           placement: placement,
//         }),
//       }
//     )
//     return response.result
//   }

//   // Create order
//   async createOrder(order: PrintfulOrder): Promise<PrintfulOrderResponse> {
//     const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
//       '/orders',
//       {
//         method: 'POST',
//         body: JSON.stringify(order),
//       }
//     )
//     return response.result
//   }

//   // Get order by external ID
//   async getOrder(externalId: string): Promise<PrintfulOrderResponse> {
//     const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
//       `/orders/@${externalId}`
//     )
//     return response.result
//   }

//   // Confirm order for fulfillment
//   async confirmOrder(externalId: string): Promise<PrintfulOrderResponse> {
//     const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
//       `/orders/@${externalId}/confirm`,
//       {
//         method: 'POST',
//       }
//     )
//     return response.result
//   }

//   // Create product
//   async createProduct(productData: PrintfulProductData): Promise<PrintfulProduct> {
//     const response = await this.makeRequest<{ result: PrintfulProduct }>(
//       '/store/products',
//       {
//         method: 'POST',
//         body: JSON.stringify(productData),
//       }
//     )
//     return response.result
//   }
// }

// // Get Printful client instance
// export function getPrintfulClient(): PrintfulClient {
//   const apiKey = process.env.PRINTFUL_API_KEY
//   if (!apiKey) {
//     throw new Error('PRINTFUL_API_KEY environment variable is required')
//   }
//   return new PrintfulClient(apiKey)
// }

// // T-shirt product mapping based on gender
// // Note: These are example product IDs - you'll need to get the actual IDs from Printful API
// export const TSHIRT_PRODUCTS = {
//   unisex: {
//     productId: 71, // Unisex Basic Softstyle T-Shirt | Gildan 64000
//     name: 'Unisex Basic Softstyle T-Shirt',
//   },
//   men: {
//     productId: 71, // Same as unisex
//     name: 'Unisex Basic Softstyle T-Shirt',
//   },
//   women: {
//     productId: 71, // Women's Relaxed T-Shirt | Bella + Canvas 6400
//     name: "Women's Relaxed T-Shirt",
//   },
// } as const

// // Get product ID based on gender
// export function getTshirtProductId(gender: string): number {
//   const normalizedGender = gender.toLowerCase()
  
//   if (normalizedGender === 'women' || normalizedGender === 'female') {
//     return TSHIRT_PRODUCTS.women.productId
//   }
  
//   // Default to unisex for men, unisex, or unknown
//   return TSHIRT_PRODUCTS.unisex.productId
// }

// // Get available T-shirt products from Printful API
// export async function getAvailableTshirtProducts(): Promise<PrintfulProduct[]> {
//   const client = getPrintfulClient()
  
//   try {
//     const products = await client.getProducts()
//     console.log(`Fetched ${products.length} products from Printful`)
    
//     // Filter for T-shirt products
//     const tshirtProducts = products.filter(product => {
//       const name = product.name?.toLowerCase() || ''
//       const brand = product.brand?.toLowerCase() || ''
//       const model = product.model?.toLowerCase() || ''
      
//       return name.includes('t-shirt') || 
//              name.includes('tee') ||
//              name.includes('shirt') ||
//              name.includes('gildan') ||
//              name.includes('bella') ||
//              brand.includes('gildan') ||
//              brand.includes('bella') ||
//              model.includes('64000') ||
//              model.includes('6400')
//     })
    
//     console.log(`Found ${tshirtProducts.length} T-shirt products`)
//     console.log('Available T-shirt products:', tshirtProducts.map(p => ({
//       id: p.id,
//       name: p.name,
//       brand: p.brand,
//       model: p.model
//     })))
    
//     return tshirtProducts
//   } catch (error) {
//     console.error('Failed to fetch products from Printful:', error)
//     throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`)
//   }
// }

// // Get variant mapping for a specific product (size/color -> variant_id)
// export async function getVariantMapping(productId: number): Promise<Map<string, number>> {
//   const client = getPrintfulClient()
//   const variants = await client.getProductVariants(productId)
  
//   const variantMap = new Map<string, number>()
  
//   variants.forEach(variant => {
//     const key = `${variant.size}-${variant.color}`.toLowerCase()
//     variantMap.set(key, variant.id)
//   })
  
//   console.log(`Variant mapping for product ${productId}:`, Array.from(variantMap.entries()))
  
//   return variantMap
// }

// // Color mapping from Godship to Printful
// const COLOR_MAPPING: Record<string, string> = {
//   'BLUE': 'Royal',
//   'GREY': 'Sport Grey',
//   'BLACK': 'Black',
//   'WHITE': 'White',
//   'RED': 'Red',
//   'GREEN': 'Green',
//   'YELLOW': 'Yellow',
//   'ORANGE': 'Orange',
//   'PURPLE': 'Purple',
//   'PINK': 'Pink',
//   'NAVY': 'Navy',
//   'BROWN': 'Brown',
//   'BEIGE': 'Beige',
//   'KHAKI': 'Khaki',
//   'MAROON': 'Maroon',
//   'TEAL': 'Teal',
//   'LIME': 'Lime',
//   'GOLD': 'Gold',
//   'SILVER': 'Silver'
// }

// // Map Godship color to Printful color
// function mapColorToPrintful(godshipColor: string): string {
//   const upperColor = godshipColor.toUpperCase()
//   return COLOR_MAPPING[upperColor] || godshipColor
// }

// // Find the best matching variant for size and color
// export async function findBestVariant(
//   productId: number, 
//   size: string, 
//   color: string
// ): Promise<PrintfulVariant | null> {
//   console.log(`Finding best variant for product ${productId}, size: ${size}, color: ${color}`)
  
//   const client = getPrintfulClient()
  
//   try {
//     const variants = await client.getProductVariants(productId)
//     console.log(`Found ${variants.length} variants for product ${productId}`)
    
//     if (variants.length === 0) {
//       console.log(`❌ No variants found for product ${productId}`)
//       return null
//     }
    
//     // Log available variants for debugging
//     console.log('Available variants:', variants.map(v => ({
//       id: v.id,
//       size: v.size,
//       color: v.color,
//       in_stock: v.in_stock
//     })))
    
//     // Map Godship color to Printful color
//     const printfulColor = mapColorToPrintful(color)
//     console.log(`Mapped color: ${color} -> ${printfulColor}`)
    
//     // Try exact match first with mapped color
//     let matchingVariant = variants.find(variant => 
//       variant.size.toLowerCase() === size.toLowerCase() &&
//       variant.color.toLowerCase() === printfulColor.toLowerCase()
//     )
    
//     if (matchingVariant) {
//       console.log(`✅ Exact match found: ${matchingVariant.id} (${matchingVariant.size} ${matchingVariant.color})`)
//       return matchingVariant
//     }
    
//     // Try original color name as fallback
//     matchingVariant = variants.find(variant => 
//       variant.size.toLowerCase() === size.toLowerCase() &&
//       variant.color.toLowerCase() === color.toLowerCase()
//     )
    
//     if (matchingVariant) {
//       console.log(`✅ Original color match found: ${matchingVariant.id} (${matchingVariant.size} ${matchingVariant.color})`)
//       return matchingVariant
//     }
    
//     // Try size match with any color
//     matchingVariant = variants.find(variant => 
//       variant.size.toLowerCase() === size.toLowerCase() &&
//       variant.in_stock
//     )
    
//     if (matchingVariant) {
//       console.log(`⚠️ Size match with different color: ${matchingVariant.id} (${matchingVariant.size} ${matchingVariant.color})`)
//       return matchingVariant
//     }
    
//     // Try any available variant
//     matchingVariant = variants.find(variant => variant.in_stock)
    
//     if (matchingVariant) {
//       console.log(`⚠️ Using any available variant: ${matchingVariant.id} (${matchingVariant.size} ${matchingVariant.color})`)
//       return matchingVariant
//     }
    
//     console.log(`❌ No suitable variant found for product ${productId}`)
//     return null
    
//   } catch (error) {
//     console.error(`❌ Failed to get variants for product ${productId}:`, error)
//     throw error
//   }
// }

// // Find T-shirt product by name pattern
// export async function findTshirtProduct(
//   gender: string,
//   client: PrintfulClient
// ): Promise<PrintfulProduct | null> {
//   const products = await client.getProducts()
  
//   const searchPatterns = {
//     unisex: ['unisex', 'basic', 'softstyle', 'gildan', '64000'],
//     men: ['unisex', 'basic', 'softstyle', 'gildan', '64000'],
//     women: ['women', 'relaxed', 'bella', 'canvas', '6400']
//   }
  
//   const normalizedGender = gender.toLowerCase()
//   const patterns = normalizedGender === 'women' || normalizedGender === 'female' 
//     ? searchPatterns.women 
//     : searchPatterns.unisex
  
//   // Find product that matches the patterns
//   const matchingProduct = products.find(product => 
//     patterns.some(pattern => 
//       product.name?.toLowerCase().includes(pattern.toLowerCase())
//     )
//   )
  
//   return matchingProduct || null
// }

// // Get product variants and find matching variant
// export async function getMatchingVariant(
//   productId: number,
//   size: string,
//   color: string
// ): Promise<PrintfulVariant | null> {
//   console.log(`Getting variants for product ID: ${productId}, size: ${size}, color: ${color}`)
  
//   const client = getPrintfulClient()
  
//   try {
//     const variants = await client.getProductVariants(productId)
//     console.log(`Found ${variants.length} variants for product ${productId}`)
//     console.log('Available variants:', variants.map(v => ({
//       id: v.id,
//       size: v.size,
//       color: v.color,
//       in_stock: v.in_stock
//     })))
    
//     // Find variant that matches size and color
//     const matchingVariant = variants.find(variant => 
//       variant.size.toLowerCase() === size.toLowerCase() &&
//       variant.color.toLowerCase() === color.toLowerCase()
//     )
    
//     if (matchingVariant) {
//       console.log(`Found matching variant: ${matchingVariant.id} (${matchingVariant.size} ${matchingVariant.color})`)
//     } else {
//       console.log(`No matching variant found for size: ${size}, color: ${color}`)
//       // Try to find any available variant as fallback
//       const availableVariant = variants.find(v => v.in_stock)
//       if (availableVariant) {
//         console.log(`Using fallback variant: ${availableVariant.id} (${availableVariant.size} ${availableVariant.color})`)
//         return availableVariant
//       }
//     }
    
//     return matchingVariant || null
//   } catch (error) {
//     console.error(`Failed to get variants for product ${productId}:`, error)
//     throw error
//   }
// }

// // Calculate design position for T-shirt
// export function calculateDesignPosition(
//   designWidth: number,
//   designHeight: number,
//   _tshirtType: 'unisex' | 'women' = 'unisex'
// ): {
//   area_width: number
//   area_height: number
//   width: number
//   height: number
//   top: number
//   left: number
// } {
//   // front_large: 15"×18" at 300DPI = 4500×5400px
//   const area_width = 4500
//   const area_height = 5400
  
//   // Set design size to 1024×1024px as requested
//   const finalWidth = 1024
//   const finalHeight = 1024
  
//   // Calculate width as 75% of print area width
//   const targetWidth = Math.round(area_width * 0.75) // 4500 * 0.75 = 3375px
//   const targetHeight = Math.round(area_height * 0.75) // 5400 * 0.75 = 4050px
  
//   // Use the smaller dimension to maintain aspect ratio
//   const scaleFactor = Math.min(targetWidth / finalWidth, targetHeight / finalHeight)
//   const scaledWidth = Math.round(finalWidth * scaleFactor)
//   const scaledHeight = Math.round(finalHeight * scaleFactor)
  
//   // Central positioning algorithm: x = (area_w - w) / 2, y = (area_h - h) / 2
//   const left = Math.round((area_width - scaledWidth) / 2)
//   const top = Math.round((area_height - scaledHeight) / 2)
  
//   return {
//     area_width: area_width,
//     area_height: area_height,
//     width: scaledWidth,
//     height: scaledHeight,
//     top: top,
//     left: left
//   }
// }

// // Get image dimensions from URL
// export async function getImageDimensions(_imageUrl: string): Promise<{ width: number; height: number }> {
//   // For server-side, return default dimensions
//   // In a real implementation, you might want to use a library like 'sharp' or 'jimp'
//   return { width: 1000, height: 1000 }
// }

// // Create inside label file for brand using Printful's Inside Label 1.3 template
// export async function createInsideLabelFile(
//   brandLogoUrl: string,
//   brandName: string,
//   client: PrintfulClient
// ): Promise<PrintfulFileWithPosition> {
//   // Inside Label 1.3 template specifications:
//   // - Maximum print area: 3" x 3" (450px x 450px at 150 DPI)
//   // - Template includes: size, material, country of origin, care instructions
//   // - Brand logo is added to the template
  
//   const insideLabelPosition = {
//     area_width: 450,   // 3 inches at 150 DPI
//     area_height: 450,  // 3 inches at 150 DPI
//     width: 400,        // Logo area width
//     height: 100,       // Logo area height
//     top: 175,          // Center vertically in template
//     left: 25           // Center horizontally in template
//   }
  
//   // Upload brand logo for Inside Label 1.3 template
//   // Printful will automatically combine this with the 1.3 template
//   const insideLabelFile = await client.uploadFileWithPosition(
//     brandLogoUrl,
//     `${brandName}_inside_label_1.3.png`,
//     insideLabelPosition,
//     "label_inside" // Inside label placement
//   )
  
//   return insideLabelFile
// }

// // Create Printful order from Stripe order data
// export async function createPrintfulOrder(
//   orderId: string,
//   items: Array<{
//     product_id: string | null
//     product_name: string
//     quantity: number
//     size: string | null
//     color: string | null
//   }>,
//   shippingAddress: {
//     name: string
//     address1: string
//     address2?: string
//     city: string
//     state_code?: string
//     country_code: string
//     zip: string
//     phone?: string
//     email?: string
//   },
//   customerEmail?: string
// ): Promise<PrintfulOrderResponse> {
//   console.log('=== createPrintfulOrder called ===')
//   console.log('Order ID:', orderId)
//   console.log('Items:', JSON.stringify(items, null, 2))
//   console.log('Shipping address:', JSON.stringify(shippingAddress, null, 2))
//   console.log('Customer email:', customerEmail)
  
//   const client = getPrintfulClient()
  
//   // Get product details from database
//   const productIds = items
//     .map(item => item.product_id)
//     .filter(Boolean) as string[]
  
//   console.log('Product IDs to fetch:', productIds)
  
//   if (productIds.length === 0) {
//     throw new Error('No valid product IDs found in order items')
//   }
  
//   console.log('Fetching products from database...')
//   const { data: products, error } = await supabaseAdmin
//     .from('products')
//     .select(`
//       id, 
//       name, 
//       gender, 
//       design_png, 
//       colors, 
//       sizes,
//       brand_id,
//       brands!inner(
//         id,
//         name,
//         icon
//       )
//     `)
//     .in('id', productIds)
  
//   if (error || !products) {
//     console.error('Failed to fetch products:', error)
//     throw new Error(`Failed to fetch products: ${error?.message}`)
//   }
  
//   console.log('Products fetched successfully:', products.length)
//   console.log('Product details:', JSON.stringify(products, null, 2))
  
//   const printfulItems: PrintfulOrderItem[] = []
  
//   for (const item of items) {
//     if (!item.product_id) continue
    
//     const product = products.find(p => p.id === item.product_id)
//     if (!product) continue
    
//     // Determine gender and get appropriate product ID
//     const gender = product.gender || 'unisex'
    
//     // Get available T-shirt products from Printful
//     console.log(`Finding T-shirt product for gender: ${gender}`)
//     const availableProducts = await getAvailableTshirtProducts()
    
//     if (availableProducts.length === 0) {
//       throw new Error('No T-shirt products found in Printful')
//     }
    
//     // Try to find a product that matches the gender preference
//     let printfulProduct = availableProducts.find(p => {
//       const name = p.name?.toLowerCase() || ''
//       const brand = p.brand?.toLowerCase() || ''
//       const model = p.model?.toLowerCase() || ''
      
//       if (gender.toLowerCase() === 'women' || gender.toLowerCase() === 'female') {
//         return name.includes('women') || name.includes('bella') || 
//                brand.includes('bella') || model.includes('6400')
//       }
//       return name.includes('unisex') || name.includes('gildan') || 
//              brand.includes('gildan') || model.includes('64000')
//     })
    
//     // Fallback to a known working product (Gildan 64000)
//     if (!printfulProduct) {
//       printfulProduct = availableProducts.find(p => 
//         p.id === 12 || (p.brand?.toLowerCase() === 'gildan' && p.model?.toLowerCase().includes('64000'))
//       )
//     }
    
//     // Final fallback to any Gildan product
//     if (!printfulProduct) {
//       printfulProduct = availableProducts.find(p => 
//         p.brand?.toLowerCase() === 'gildan'
//       )
//     }
    
//     // Last resort: use first available product
//     if (!printfulProduct) {
//       printfulProduct = availableProducts[0]
//     }
    
//     const printfulProductId = printfulProduct.id
    
//     console.log(`Using Printful product: ${printfulProduct.name} (ID: ${printfulProductId})`)
    
//     // Get matching variant using the new function
//     console.log(`Looking for variant: size=${item.size || 'M'}, color=${item.color || 'Black'}`)
//     const variant = await findBestVariant(
//       printfulProductId,
//       item.size || 'M',
//       item.color || 'Black'
//     )
    
//     if (!variant) {
//       console.warn(`No matching variant found for product ${item.product_id}, size: ${item.size}, color: ${item.color}`)
//       continue
//     }
    
//     // Upload design file with position if available
//     const designFiles: PrintfulFileWithPosition[] = []
//     if (product.design_png && product.design_png.length > 0) {
//       try {
//         // Determine T-shirt type for position calculation
//         const tshirtType = (product.gender?.toLowerCase() === 'women') ? 'women' : 'unisex'
        
//         // Get actual design dimensions
//         const { width: designWidth, height: designHeight } = await getImageDimensions(product.design_png[0])
        
//         // Calculate design position based on actual dimensions
//         const designPosition = calculateDesignPosition(designWidth, designHeight, tshirtType)
        
//         const designFile = await client.uploadFileWithPosition(
//           product.design_png[0], // Use first design file
//           `${product.name}_design.png`,
//           designPosition,
//           "front_large"
//         )
//         designFiles.push(designFile)
        
//         // Add inside label with brand logo
//         if (product.brands?.[0]?.icon) {
//           try {
//             const insideLabelFile = await createInsideLabelFile(
//               product.brands[0].icon,
//               product.brands[0].name,
//               client
//             )
//             designFiles.push(insideLabelFile)
//           } catch (error) {
//             console.error(`Failed to create inside label for product ${product.id}:`, error)
//           }
//         }
//       } catch (error) {
//         console.error(`Failed to upload design file for product ${product.id}:`, error)
//       }
//     }
    
//     printfulItems.push({
//       variant_id: variant.id,
//       quantity: item.quantity,
//       retail_price: '0.00', // Set to 0 since we handle pricing separately
//       name: item.product_name,
//       files: designFiles,
//     })
//   }
  
//   if (printfulItems.length === 0) {
//     throw new Error('No valid items found for Printful order')
//   }
  
//   // Create Printful order
//   const printfulOrder: PrintfulOrder = {
//     external_id: orderId,
//     shipping: 'STANDARD',
//     recipient: {
//       name: shippingAddress.name,
//       address1: shippingAddress.address1,
//       address2: shippingAddress.address2,
//       city: shippingAddress.city,
//       state_code: shippingAddress.state_code,
//       country_code: shippingAddress.country_code,
//       zip: shippingAddress.zip,
//       phone: shippingAddress.phone,
//       email: customerEmail,
//     },
//     items: printfulItems,
//   }
  
//   console.log('Printful order data:', JSON.stringify(printfulOrder, null, 2))
//   console.log('Creating order in Printful...')
  
//   // Create order in Printful
//   const printfulOrderResponse = await client.createOrder(printfulOrder)
  
//   console.log('✅ Printful order created successfully!')
//   console.log('Printful Order ID:', printfulOrderResponse.id)
//   console.log('Printful External ID:', printfulOrderResponse.external_id)
  
//   return printfulOrderResponse
// }

import { supabaseAdmin } from './supabase-admin'

// ===== Types =====
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

export interface PrintfulProductData {
  sync_product: {
    name: string
    thumbnail?: string
    description?: string
  }
  sync_variants: Array<{
    variant_id: number
    retail_price: string
    files: Array<{
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
}

export interface PrintfulFileWithPosition extends PrintfulFile {
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
  shipments: Array<{id: string; carrier: string; service: string; tracking_number: string; tracking_url: string; created: number; ship_date: string; shipped_at: number; reshipment: boolean; reshipment_reason: string; items: Array<{item_id: number; external_id: string; quantity: number}>}>
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

// ===== Client =====
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

  // ---------- Catalog API（正） ----------
  // 検索（brand/modelでヒットさせる）
  async getCatalogProducts(search?: string): Promise<PrintfulProduct[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await this.makeRequest<{ result: PrintfulProduct[] }>(`/catalog/products${q}`)
    return res.result
  }

  // 1件取得（variants[] を含む）
  async getCatalogProduct(productId: number): Promise<{ product: PrintfulProduct; variants: PrintfulVariant[] }> {
    const res = await this.makeRequest<{ result: { product: PrintfulProduct; variants: PrintfulVariant[] } }>(
      `/catalog/products/${productId}`
    )
    return res.result
  }

  // ---------- Files ----------
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

  // ---------- Orders ----------
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

  async getOrder(externalId: string): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
      `/orders/@${externalId}`
    )
    return response.result
  }

  async confirmOrder(externalId: string): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<{ result: PrintfulOrderResponse }>(
      `/orders/@${externalId}/confirm`,
      { method: 'POST' }
    )
    return response.result
  }

  // ---------- （参考）Store API：使わない ----------
  // ※ /products・/products/:id/variants は使わない（404の元）
  // ※ /store/products は事前にSync Productを作る運用のときのみ使用
}

// Instance
export function getPrintfulClient(): PrintfulClient {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) throw new Error('PRINTFUL_API_KEY environment variable is required')
  return new PrintfulClient(apiKey)
}

// ===== Color mapping =====
const COLOR_MAPPING: Record<string, string> = {
  'BLUE': 'Royal',
  'GREY': 'Sport Grey',
  'BLACK': 'Black',
  'WHITE': 'White',
  'RED': 'Red',
  'GREEN': 'Green',
  'YELLOW': 'Yellow',
  'ORANGE': 'Orange',
  'PURPLE': 'Purple',
  'PINK': 'Pink',
  'NAVY': 'Navy',
  'BROWN': 'Brown',
  'BEIGE': 'Beige',
  'KHAKI': 'Khaki',
  'MAROON': 'Maroon',
  'TEAL': 'Teal',
  'LIME': 'Lime',
  'GOLD': 'Gold',
  'SILVER': 'Silver',
  'DARK HEATHER': 'Dark Heather',
  // よく使う追加表記ゆれ
  'DARK GREY': 'Dark Grey Heather',
  'HEATHER BLACK': 'Black Heather',
}
function mapColorToPrintful(godshipColor: string): string {
  const upperColor = (godshipColor || '').toUpperCase()
  return COLOR_MAPPING[upperColor] || godshipColor
}

// ===== Catalog helpers =====
async function resolveCatalogProductIdByGender(client: PrintfulClient, gender: string): Promise<number> {
  const g = (gender || '').toLowerCase()
  const isWomen = g === 'women' || g === 'female'

  const query = isWomen ? 'Bella + Canvas 6400' : 'Gildan 64000'
  const list = await client.getCatalogProducts(query)

  // brand/modelを優先して最も合うものを選ぶ
  const pick =
    list.find(p =>
      (isWomen
        ? (String(p.brand).toLowerCase().includes('bella') && String(p.model).toLowerCase().includes('6400'))
        : (String(p.brand).toLowerCase().includes('gildan') && String(p.model).toLowerCase().includes('64000'))
      )
    ) || list[0]

  if (!pick) throw new Error(`Catalog product not found for query: ${query}`)
  return pick.id as number
}

async function getCatalogVariants(client: PrintfulClient, productId: number) {
  const { variants } = await client.getCatalogProduct(productId)
  return variants as Array<{ id: number; size: string; color: string; in_stock: boolean }>
}

export async function findBestVariantCatalog(
  client: PrintfulClient,
  productId: number,
  size: string,
  color: string
) {
  const variants = await getCatalogVariants(client, productId)
  const wantSize = (size || '').toLowerCase()
  const wantColorA = (mapColorToPrintful(color || '') || '').toLowerCase()
  const wantColorB = (color || '').toLowerCase()

  return (
    variants.find(v => v.size?.toLowerCase() === wantSize && v.color?.toLowerCase() === wantColorA) ||
    variants.find(v => v.size?.toLowerCase() === wantSize && v.color?.toLowerCase() === wantColorB) ||
    variants.find(v => v.size?.toLowerCase() === wantSize && v.in_stock) ||
    variants.find(v => v.in_stock) ||
    null
  )
}

// ===== Positioning (75% center in front_large) =====
export function calculateDesignPosition(
  designWidth: number,
  designHeight: number,
  _tshirtType: 'unisex' | 'women' = 'unisex'
): {
  area_width: number
  area_height: number
  width: number
  height: number
  top: number
  left: number
} {
  // front_large: 15"×18" @300DPI = 4500×5400
  const area_width = 4500
  const area_height = 5400

  // 元画像の想定（1024×1024）
  const finalWidth = designWidth || 1024
  const finalHeight = designHeight || 1024

  // 面積ベースではなく「print areaに対して幅75%」で統一
  const targetWidth = Math.round(area_width * 0.75) // 3375px
  const scaleFactor = targetWidth / finalWidth
  const scaledWidth = Math.round(finalWidth * scaleFactor)
  const scaledHeight = Math.round(finalHeight * scaleFactor)

  const left = Math.round((area_width - scaledWidth) / 2)
  const top = Math.round((area_height - scaledHeight) / 2)

  return {
    area_width,
    area_height,
    width: scaledWidth,
    height: scaledHeight,
    top,
    left,
  }
}

// 画像サイズ取得（必要ならsharp等に差し替え）
export async function getImageDimensions(_imageUrl: string): Promise<{ width: number; height: number }> {
  return { width: 1024, height: 1024 }
}

// Inside label（任意：今回のエラーとは無関係）
export async function createInsideLabelFile(
  brandLogoUrl: string,
  brandName: string,
  client: PrintfulClient
): Promise<PrintfulFileWithPosition> {
  // 注意：/files アップロードに position/placement は不要（＆無効）
  const base = await client.uploadFile(brandLogoUrl, `${brandName}_inside_label_1.3.png`)
  // position は注文時に渡す（ここでは返却用に保持だけ）
  const position = {
    area_width: 450,
    area_height: 450,
    width: 400,
    height: 100,
    top: 175,
    left: 25,
  }
  return { ...base, placement: 'label_inside', position }
}

// ===== Main: create order =====
export async function createPrintfulOrder(
  orderId: string,
  items: Array<{
    product_id: string | null
    product_name: string
    quantity: number
    size: string | null
    color: string | null
  }>,
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  },
  customerEmail?: string
): Promise<PrintfulOrderResponse> {
  console.log('=== createPrintfulOrder called ===')
  console.log('Order ID:', orderId)
  console.log('Items:', JSON.stringify(items, null, 2))
  console.log('Shipping address:', JSON.stringify(shippingAddress, null, 2))
  console.log('Customer email:', customerEmail)

  const client = getPrintfulClient()

  // DBから自社商品の設計情報を取得
  const productIds = items.map(i => i.product_id).filter(Boolean) as string[]
  if (productIds.length === 0) throw new Error('No valid product IDs found in order items')

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
    console.error('Failed to fetch products:', error)
    throw new Error(`Failed to fetch products: ${error?.message}`)
  }

  const printfulItems: PrintfulOrderItem[] = []

  for (const item of items) {
    if (!item.product_id) continue
    const product = products.find(p => p.id === item.product_id)
    if (!product) continue

    const gender = product.gender || 'unisex'

    // Catalogで product_id を決める（Gildan 64000 or Bella+Canvas 6400）
    const catalogProductId = await resolveCatalogProductIdByGender(client, gender)
    console.log(`Using Catalog productId: ${catalogProductId}`)

    // variant を選定
    const size = item.size || 'M'
    const color = item.color || 'Black'
    const variant = await findBestVariantCatalog(client, catalogProductId, size, color)
    if (!variant) {
      console.warn(`No variant found (productId=${catalogProductId}, size=${size}, color=${color})`)
      continue
    }

    // デザイン画像アップロード
    const designFiles: PrintfulFileWithPosition[] = []
    if (product.design_png && product.design_png.length > 0) {
      try {
        const designUrl = product.design_png[0]
        const { width: dw, height: dh } = await getImageDimensions(designUrl)
        const pos = calculateDesignPosition(dw, dh, (gender.toLowerCase() === 'women' ? 'women' : 'unisex'))

        const uploaded = await client.uploadFile(designUrl, `${product.name}_design.png`)

        // 注文に添付：placement/position はここで指定（front_large）
        designFiles.push({
          ...uploaded,
          placement: 'front_large',
          position: pos,
        })

        // 任意：内ラベル（テンプレの有無はPrintful側の設定に依存）
        if (product.brands?.[0]?.icon) {
          try {
            await createInsideLabelFile(product.brands[0].icon, product.brands[0].name, client)
            // 実際に使うかはSKU運用次第。使うなら push
            // designFiles.push(insideLabel)
          } catch (e) {
            console.error(`Failed to create inside label for product ${product.id}:`, e)
          }
        }
      } catch (e) {
        console.error(`Failed to upload design file for product ${product.id}:`, e)
      }
    }

    printfulItems.push({
      variant_id: variant.id,
      quantity: item.quantity,
      retail_price: '0.00', // 価格は自社側で管理する想定なら省略も可
      name: item.product_name,
      files: designFiles,
    })
  }

  if (printfulItems.length === 0) {
    throw new Error('No valid items found for Printful order')
  }

  // city が空だと将来の検証で弾かれる場合があるためフォールバック
  const safeCity = shippingAddress.city || ' '

  const printfulOrder: PrintfulOrder = {
    external_id: orderId,
    shipping: 'STANDARD',
    recipient: {
      name: shippingAddress.name,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      city: safeCity,
      state_code: shippingAddress.state_code,
      country_code: shippingAddress.country_code,
      zip: shippingAddress.zip,
      phone: shippingAddress.phone,
      email: customerEmail || shippingAddress.email,
    },
    items: printfulItems,
  }

  console.log('Printful order data:', JSON.stringify(printfulOrder, null, 2))
  console.log('Creating order in Printful...')

  const res = await client.createOrder(printfulOrder)
  console.log('✅ Printful order created successfully!', res.id, res.external_id)
  return res
}

