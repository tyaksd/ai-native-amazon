// Printful API v2 Enhanced Client
// Based on https://developers.printful.com/docs/#tag/Products-API


// Enhanced types based on API v2 documentation
export interface PrintfulV2Error {
  code: number
  result: string
  error?: {
    reason: string
    message: string
  }
}

export interface PrintfulV2Response<T> {
  code: number
  result: T
  paging?: {
    total: number
    offset: number
    limit: number
  }
}

// Mockup Generator API types
export interface MockupTask {
  task_key: string
  status: 'pending' | 'completed' | 'failed'
  mockups?: MockupResult[]
  error?: string
}

export interface MockupResult {
  placement: string
  image_url: string
  background_url?: string
  variant_ids: number[]
}

export interface PrintfileInfo {
  printfile_id: number
  width: number
  height: number
  dpi: number
  fill_mode: string
  can_rotate: boolean
}

export interface LayoutTemplate {
  template_id: number
  image_url: string
  background_url?: string
  background_color?: string
  printfile_id: number
  template_width: number
  template_height: number
  print_area_width: number
  print_area_height: number
  print_area_top: number
  print_area_left: number
  is_template_on_front: boolean
  orientation: string
}

// Enhanced Printful Client with API v2 features
export class PrintfulV2Client {
  private apiKey: string
  private baseUrl = 'https://api.printful.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<PrintfulV2Response<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const reqId = response.headers.get('x-request-id') ?? undefined
    let body: unknown = null
    
    try {
      body = await response.json()
    } catch {
      /* ignore non-JSON bodies */
    }

    if (!response.ok) {
      const errorData = body as PrintfulV2Error
      const tail = reqId ? ` (x-request-id=${reqId})` : ''
      const errorMessage = errorData?.error?.message || errorData?.result || 'Unknown error'
      throw new Error(`Printful API v2 error: ${response.status} ${response.statusText}. ${errorMessage}${tail}`)
    }

    return body as PrintfulV2Response<T>
  }

  // ===== Mockup Generator API =====
  
  /**
   * Create a mockup generation task
   * POST /mockup-generator/create-task/{product_id}
   */
  async createMockupTask(
    productId: number,
    variantIds: number[],
    files: Array<{
      placement: string
      image_url: string
    }>,
    options?: {
      format?: 'jpg' | 'png'
      width?: number
      dpi?: number
    }
  ): Promise<MockupTask> {
    const response = await this.makeRequest<MockupTask>(
      `/mockup-generator/create-task/${productId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          variant_ids: variantIds,
          files,
          format: options?.format || 'jpg',
          width: options?.width || 1000,
          dpi: options?.dpi || 150
        })
      }
    )
    return response.result
  }

  /**
   * Get mockup generation task result
   * GET /mockup-generator/task/{task_key}
   */
  async getMockupTaskResult(taskKey: string): Promise<MockupTask> {
    const response = await this.makeRequest<MockupTask>(
      `/mockup-generator/task/${taskKey}`
    )
    return response.result
  }

  /**
   * Get product variant print files
   * GET /mockup-generator/printfiles/{product_id}
   */
  async getProductPrintfiles(
    productId: number,
    technique?: 'DTG' | 'EMBROIDERY' | 'SUBLIMATION'
  ): Promise<{
    product_id: number
    available_placements: Record<string, string>
    printfiles: PrintfileInfo[]
    variant_printfiles: Array<{
      variant_id: number
      placements: Record<string, number>
    }>
    option_groups: string[]
    options: string[]
  }> {
    const techniqueParam = technique ? `?technique=${technique}` : ''
    const response = await this.makeRequest(
      `/mockup-generator/printfiles/${productId}${techniqueParam}`
    )
    return response.result
  }

  /**
   * Get layout templates
   * GET /mockup-generator/templates/{product_id}
   */
  async getLayoutTemplates(
    productId: number,
    technique?: 'DTG' | 'EMBROIDERY' | 'SUBLIMATION'
  ): Promise<{
    version: number
    variant_mapping: Array<{
      variant_id: number
      templates: Array<{
        placement: string
        template_id: number
      }>
    }>
    templates: LayoutTemplate[]
    min_dpi: number
    conflicting_placements: Array<{
      placement: string
      conflicts: string[]
    }>
  }> {
    const techniqueParam = technique ? `?technique=${technique}` : ''
    const response = await this.makeRequest(
      `/mockup-generator/templates/${productId}${techniqueParam}`
    )
    return response.result
  }

  // ===== Catalog API =====
  
  /**
   * Get catalog products
   * GET /catalog/products
   */
  async getCatalogProducts(search?: string): Promise<Array<{
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
  }>> {
    const q = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await this.makeRequest<Array<any>>(`/catalog/products${q}`)
    return response.result || []
  }

  /**
   * Get catalog product details
   * GET /catalog/products/{id}
   */
  async getCatalogProduct(productId: number): Promise<{
    product?: any
    variants?: Array<{
      id: number
      product_id: number
      name: string
      size: string
      color: string
      color_code: string
      image: string
      price: string
      in_stock: boolean
    }>
  }> {
    const response = await this.makeRequest(`/catalog/products/${productId}`)
    return response.result || {}
  }

  /**
   * Upload file to Printful
   * POST /files
   */
  async uploadFile(fileUrl: string, filename: string): Promise<{
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
  }> {
    const response = await this.makeRequest('/files', {
      method: 'POST',
      body: JSON.stringify({ url: fileUrl, filename })
    })
    return response.result
  }

  /**
   * Get order by external ID
   * GET /orders/@{external_id}
   */
  async getOrder(externalId: string): Promise<any> {
    const response = await this.makeRequest(`/orders/@${externalId}`)
    return response.result
  }

  // ===== Enhanced Products API =====
  
  /**
   * Create a new Sync Product with enhanced error handling
   * POST /sync-products
   */
  async createSyncProduct(productData: {
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
  }): Promise<{
    id: number
    external_id: string
    name: string
    variants: number
    synced: number
  }> {
    const response = await this.makeRequest(
      '/sync-products',
      {
        method: 'POST',
        body: JSON.stringify(productData)
      }
    )
    return response.result
  }

  /**
   * Get Sync Products with pagination
   * GET /sync-products
   */
  async getSyncProducts(params?: {
    offset?: number
    limit?: number
    status?: 'synced' | 'unsynced' | 'all'
  }): Promise<{
    items: Array<{
      id: number
      external_id: string
      name: string
      variants: number
      synced: number
    }>
    paging: {
      total: number
      offset: number
      limit: number
    }
  }> {
    const queryParams = new URLSearchParams()
    if (params?.offset) queryParams.set('offset', params.offset.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.status) queryParams.set('status', params.status)
    
    const query = queryParams.toString()
    const endpoint = query ? `/sync-products?${query}` : '/sync-products'
    
    const response = await this.makeRequest(endpoint)
    return response.result
  }

  // ===== Enhanced Orders API =====
  
  /**
   * Create order with enhanced validation
   * POST /orders
   */
  async createOrder(order: {
    external_id: string
    shipping: string
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
  }): Promise<{
    id: number
    external_id: string
    status: string
    shipping: string
    created: number
    updated: number
    recipient: any
    items: any[]
    costs: any
    retail_costs: any
    shipments: any[]
    gift: any
    packing_slip: any
  }> {
    // Enhanced validation
    if (!order.external_id) {
      throw new Error('external_id is required')
    }
    if (!order.recipient.name) {
      throw new Error('recipient name is required')
    }
    if (!order.recipient.address1) {
      throw new Error('recipient address1 is required')
    }
    if (!order.recipient.city) {
      throw new Error('recipient city is required')
    }
    if (!order.recipient.country_code) {
      throw new Error('recipient country_code is required')
    }
    if (!order.recipient.zip) {
      throw new Error('recipient zip is required')
    }
    if (!order.items || order.items.length === 0) {
      throw new Error('items array is required and cannot be empty')
    }

    const response = await this.makeRequest(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(order)
      }
    )
    return response.result
  }

  /**
   * Estimate order costs before creating
   * POST /orders/estimate-costs
   */
  async estimateOrderCosts(order: {
    recipient: {
      country_code: string
      state_code?: string
      city?: string
      zip?: string
    }
    items: Array<{
      variant_id: number
      quantity: number
    }>
  }): Promise<{
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
  }> {
    const response = await this.makeRequest(
      '/orders/estimate-costs',
      {
        method: 'POST',
        body: JSON.stringify(order)
      }
    )
    return response.result
  }
}

// Enhanced client factory
export function getPrintfulV2Client(): PrintfulV2Client {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY environment variable is required')
  }
  return new PrintfulV2Client(apiKey)
}

// Utility function for retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries: number; baseDelayMs: number } = { retries: 3, baseDelayMs: 300 }
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i <= options.retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i === options.retries) break
      
      const delay = options.baseDelayMs * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

