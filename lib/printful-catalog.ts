// PrintfulカタログAPIクライアント
import { PrintfulV2Client } from './printful-v2'

export interface CatalogProduct {
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

export interface CatalogVariant {
  id: number
  product_id: number
  name: string
  size: string
  color: string
  color_code: string
  color_code2?: string
  image: string
  price: string
  in_stock: boolean
  availability_regions: Record<string, string>
  availability_status: Array<{
    region: string
    status: string
  }>
  material?: Array<{
    name: string
    percentage: number
  }>
}

export interface PrintfileInfo {
  id: number
  type: string
  width: number
  height: number
  dpi: number
  position: string
  orientation: string
  additional_price: string
}

export class PrintfulCatalogClient {
  private client: PrintfulV2Client

  constructor(apiKey: string) {
    this.client = new PrintfulV2Client(apiKey)
  }

  /**
   * 商品を検索して取得
   */
  async searchProducts(searchTerm: string): Promise<CatalogProduct[]> {
    try {
      const products = await this.client.getCatalogProducts(searchTerm)
      return products || []
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  /**
   * 特定の商品の詳細を取得
   */
  async getProductDetails(productId: number): Promise<CatalogProduct | null> {
    try {
      const product = await this.client.getCatalogProduct(productId)
      return product || null
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error)
      return null
    }
  }

  /**
   * 商品のバリエーションを取得
   */
  async getProductVariants(productId: number): Promise<CatalogVariant[]> {
    try {
      const product = await this.client.getCatalogProduct(productId)
      return product?.variants || []
    } catch (error) {
      console.error(`Error fetching variants for product ${productId}:`, error)
      return []
    }
  }

  /**
   * 商品のプリントファイル情報を取得
   */
  async getProductPrintfiles(productId: number): Promise<PrintfileInfo[]> {
    try {
      const printfiles = await this.client.getProductPrintfiles(productId)
      return printfiles || []
    } catch (error) {
      console.error(`Error fetching printfiles for product ${productId}:`, error)
      return []
    }
  }

  /**
   * Gildan 64000 Unisex Softstyle T-Shirtを検索
   */
  async findGildan64000(): Promise<CatalogProduct | null> {
    try {
      // 複数の検索語で試行
      const searchTerms = [
        'Gildan 64000',
        'Gildan 64000 Unisex',
        'Gildan 64000 Softstyle',
        'Gildan 64000 T-Shirt',
        '64000',
        'Gildan'
      ]

      for (const term of searchTerms) {
        console.log(`Searching for: ${term}`)
        const products = await this.searchProducts(term)
        
        // Gildan 64000を探す
        const gildan64000 = products.find(p => 
          p.name?.toLowerCase().includes('gildan') &&
          p.name?.toLowerCase().includes('64000') &&
          (p.name?.toLowerCase().includes('unisex') || p.name?.toLowerCase().includes('softstyle'))
        )

        if (gildan64000) {
          console.log(`Found Gildan 64000: ${gildan64000.name} (ID: ${gildan64000.id})`)
          return gildan64000
        }
      }

      console.warn('Gildan 64000 not found in any search')
      return null
    } catch (error) {
      console.error('Error finding Gildan 64000:', error)
      return null
    }
  }

  /**
   * サイズと色の組み合わせでvariant IDを取得
   */
  async getVariantId(
    productId: number, 
    size: string, 
    color: string
  ): Promise<number | null> {
    try {
      const variants = await this.getProductVariants(productId)
      
      // 完全一致を探す
      let variant = variants.find(v => 
        v.size?.toLowerCase() === size.toLowerCase() && 
        v.color?.toLowerCase() === color.toLowerCase()
      )

      // 完全一致が見つからない場合、部分一致を試す
      if (!variant) {
        variant = variants.find(v => 
          v.size?.toLowerCase().includes(size.toLowerCase()) && 
          v.color?.toLowerCase().includes(color.toLowerCase())
        )
      }

      // それでも見つからない場合、大文字小文字を無視して検索
      if (!variant) {
        variant = variants.find(v => 
          v.size?.toLowerCase() === size.toLowerCase() && 
          v.color?.toLowerCase() === color.toLowerCase()
        )
      }

      if (variant) {
        console.log(`Found variant: ${variant.size} ${variant.color} (ID: ${variant.id})`)
        return variant.id
      }

      console.warn(`Variant not found: ${size} ${color}`)
      console.warn(`Available variants:`, variants.map(v => ({ size: v.size, color: v.color, id: v.id })))
      return null
    } catch (error) {
      console.error(`Error getting variant ID for ${size} ${color}:`, error)
      return null
    }
  }

  /**
   * 利用可能なサイズと色のリストを取得
   */
  async getAvailableOptions(productId: number): Promise<{
    sizes: string[]
    colors: string[]
    variants: Array<{ size: string; color: string; id: number; in_stock: boolean }>
  }> {
    try {
      const variants = await this.getProductVariants(productId)
      
      const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
      const colors = [...new Set(variants.map(v => v.color).filter(Boolean))]
      
      const variantList = variants.map(v => ({
        size: v.size,
        color: v.color,
        id: v.id,
        in_stock: v.in_stock
      }))

      return {
        sizes: sizes.sort(),
        colors: colors.sort(),
        variants: variantList
      }
    } catch (error) {
      console.error(`Error getting available options for product ${productId}:`, error)
      return { sizes: [], colors: [], variants: [] }
    }
  }
}
