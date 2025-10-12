// Printful Variant Mapping Management
import { supabaseAdmin } from './supabase-admin'

export interface VariantMapping {
  id: string
  product_id: string
  size: string
  color: string
  printful_variant_id: number
  printful_product_id: number
  created_at: string
  updated_at: string
}

export interface VariantMappingInput {
  product_id: string
  size: string
  color: string
  printful_variant_id: number
  printful_product_id: number
}

/**
 * Get variant mapping from database (cache-first approach)
 */
export async function getVariantMapping(
  productId: string,
  size: string,
  color: string
): Promise<VariantMapping | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('*')
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      console.error('Error fetching variant mapping:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getVariantMapping:', error)
    return null
  }
}

/**
 * Create or update variant mapping
 */
export async function upsertVariantMapping(
  mapping: VariantMappingInput
): Promise<VariantMapping | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .upsert({
        product_id: mapping.product_id,
        size: mapping.size,
        color: mapping.color,
        printful_variant_id: mapping.printful_variant_id,
        printful_product_id: mapping.printful_product_id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,size,color'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting variant mapping:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in upsertVariantMapping:', error)
    return null
  }
}

/**
 * Batch create variant mappings
 */
export async function batchCreateVariantMappings(
  mappings: VariantMappingInput[]
): Promise<VariantMapping[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .upsert(
        mappings.map(mapping => ({
          ...mapping,
          updated_at: new Date().toISOString()
        })), {
          onConflict: 'product_id,size,color'
        }
      )
      .select()

    if (error) {
      console.error('Error batch creating variant mappings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in batchCreateVariantMappings:', error)
    return []
  }
}

/**
 * Get all variant mappings for a product
 */
export async function getProductVariantMappings(
  productId: string
): Promise<VariantMapping[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .select('*')
      .eq('product_id', productId)

    if (error) {
      console.error('Error fetching product variant mappings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductVariantMappings:', error)
    return []
  }
}

/**
 * Delete variant mapping
 */
export async function deleteVariantMapping(
  productId: string,
  size: string,
  color: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .delete()
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color)

    if (error) {
      console.error('Error deleting variant mapping:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteVariantMapping:', error)
    return false
  }
}

/**
 * Clear all mappings for a product
 */
export async function clearProductMappings(productId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('printful_variant_mappings')
      .delete()
      .eq('product_id', productId)

    if (error) {
      console.error('Error clearing product mappings:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in clearProductMappings:', error)
    return false
  }
}
