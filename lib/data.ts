import { supabase } from './supabase'

export type Brand = {
  id: string;
  name: string;
  icon: string;
  background_image: string | null;
  description: string | null;
  category: string | null;
  design_concept: string | null;
  target_audience: string | null;
  logo_design: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  images: string[];
  price: number;
  brand_id: string;
  description: string | null;
  category: string;
  type: string;
  colors: string[];
  sizes: string[];
  gender: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Feature = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching brands:', error)
    return []
  }

  return data || []
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getVisibleProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching visible products:', error)
    return []
  }

  return data || []
}

export async function getBrandById(brandId: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single()

  if (error) {
    console.error('Error fetching brand:', error)
    return null
  }

  return data
}

export async function getProductById(productId: string): Promise<Product | null> {
  console.log('Fetching product with ID:', productId)
  
  // Check if the productId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (uuidRegex.test(productId)) {
    // It's a valid UUID, fetch by ID
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      console.error('Error fetching product by UUID:', error)
      return null
    }

    console.log('Product found by UUID:', data)
    return data
  } else {
    // It's not a UUID, this is likely an invalid or old product ID
    console.error('Invalid product ID format:', productId)
    console.error('Expected UUID format, but received:', productId)
    
    // Don't try to search by name for invalid IDs, as this could cause security issues
    // Instead, return null and let the UI handle the 404 case
    return null
  }
}

export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by brand:', error)
    return []
  }

  return data || []
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }

  return data || []
}

export async function getProductsByType(type: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('type', type)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by type:', error)
    return []
  }

  return data || []
}

export async function getProductsByGender(gender: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('gender', gender)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by gender:', error)
    return []
  }

  return data || []
}

export async function createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .insert([brand])
    .select()
    .single()

  if (error) {
    console.error('Error creating brand:', error)
    return null
  }

  return data
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  console.log('Creating product with data:', JSON.stringify(product, null, 2))
  
  // デフォルトで公開状態にする
  const productData = {
    ...product,
    is_visible: product.is_visible ?? true
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.error('Product data being inserted:', JSON.stringify(productData, null, 2))
    return null
  }

  console.log('Product created successfully:', data)
  return data
}

export async function updateProduct(productId: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

export async function updateProductVisibility(productId: string, isVisible: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ is_visible: isVisible })
    .eq('id', productId)

  if (error) {
    console.error('Error updating product visibility:', error)
    return false
  }

  return true
}

export async function deleteBrand(brandId: string): Promise<boolean> {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', brandId)

  if (error) {
    console.error('Error deleting brand:', error)
    return false
  }

  return true
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data || []
}

export async function searchBrands(query: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')

  if (error) {
    console.error('Error searching brands:', error)
    return []
  }

  return data || []
}

export async function getRandomProducts(excludeId: string, limit: number = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching random products:', error)
    return []
  }

  // ランダムに並び替えて指定された数だけ取得
  const shuffled = (data || []).sort(() => 0.5 - Math.random())
  return shuffled.slice(0, limit)
}

export async function getProductCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching product categories:', error)
    return []
  }

  // 重複を除去してカテゴリーの配列を作成
  const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
  return categories.sort()
}

// カテゴリーとタイプのマッピング
export function getCategoryTypeMapping(): Record<string, string[]> {
  return {
    'Clothing': ['T-Shirt', 'Long Tee', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts'],
    'Accessories': ['Bags'],
    'Hats': ['Hat'],
    'Others': ['Other']
  }
}

// 大分類を取得する関数
export async function getMainCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching product categories:', error)
    return []
  }

  const existingCategories = [...new Set(data?.map(item => item.category).filter(Boolean))]
  return existingCategories.sort()
}

// 特定の大分類のタイプを取得する関数
export async function getTypesByCategory(category: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('type')
    .eq('category', category)
    .not('type', 'is', null)

  if (error) {
    console.error('Error fetching product types:', error)
    return []
  }

  const existingTypes = [...new Set(data?.map(item => item.type).filter(Boolean))]
  return existingTypes.sort()
}

// 特定のカテゴリーの性別を取得する関数
export async function getGendersByCategory(category: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('gender')
    .eq('category', category)
    .not('gender', 'is', null)

  if (error) {
    console.error('Error fetching product genders:', error)
    return []
  }

  const existingGenders = [...new Set(data?.map(item => item.gender).filter(Boolean))]
  return existingGenders.sort()
}

// 特定のカテゴリーと性別のタイプを取得する関数
export async function getTypesByCategoryAndGender(category: string, gender: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('type')
    .eq('category', category)
    .eq('gender', gender)
    .not('type', 'is', null)

  if (error) {
    console.error('Error fetching product types by category and gender:', error)
    return []
  }

  const existingTypes = [...new Set(data?.map(item => item.type).filter(Boolean))]
  return existingTypes.sort()
}

// カテゴリー、性別、タイプで商品を絞り込む関数
export async function getProductsByCategoryGenderAndType(category: string, gender: string, type: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('gender', gender)
    .eq('type', type)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by category, gender and type:', error)
    return []
  }

  return data || []
}

// カテゴリーと性別で商品を絞り込む関数
export async function getProductsByCategoryAndGender(category: string, gender: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('gender', gender)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by category and gender:', error)
    return []
  }

  return data || []
}

// Features management functions
export async function getFeatures(): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching features:', error)
    return []
  }

  return data || []
}
