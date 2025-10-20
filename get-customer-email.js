#!/usr/bin/env node

/**
 * Get Customer Email Script
 * 
 * This script retrieves the customer email for the specified order item ID
 * by querying the database directly.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://lphwwwhwtbxgujmdqquf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHd3d2h3dGJ4Z3VqbWRxcXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA0MzkwMSwiZXhwIjoyMDc0NjE5OTAxfQ.fJJy_7DRXYqEWL17XVmm5lRcmF7oouyrYjDraB9e9wA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const ORDER_ITEM_ID = '760ecd24-2c82-4ac5-a5cd-a71f99cf903f';

/**
 * Get customer email for order item
 */
async function getCustomerEmail(orderItemId) {
  console.log(`📋 Fetching customer email for order item: ${orderItemId}`);
  
  try {
    const { data: orderItem, error } = await supabase
      .from('order_items')
      .select(`
        id,
        product_name,
        size,
        color,
        printful_status,
        printful_fulfillment_status,
        orders!inner (
          id,
          clerk_id,
          customer_email,
          total_amount,
          currency
        )
      `)
      .eq('id', orderItemId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch order item:', error);
      return null;
    }

    if (!orderItem) {
      console.log('❌ Order item not found');
      return null;
    }

    console.log('✅ Order item found!');
    console.log('📊 Order Details:');
    console.log(`- Order ID: ${orderItem.orders.id}`);
    console.log(`- Product: ${orderItem.product_name}`);
    console.log(`- Size: ${orderItem.size || 'N/A'}`);
    console.log(`- Color: ${orderItem.color || 'N/A'}`);
    console.log(`- Printful Status: ${orderItem.printful_status || 'N/A'}`);
    console.log(`- Fulfillment Status: ${orderItem.printful_fulfillment_status || 'N/A'}`);
    console.log(`- Customer Email: ${orderItem.orders.customer_email || 'N/A'}`);
    console.log(`- Total Amount: ${orderItem.orders.total_amount} ${orderItem.orders.currency}`);

    return orderItem;

  } catch (error) {
    console.error('❌ Error fetching customer email:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Getting Customer Email Information...');
  console.log(`📦 Order Item ID: ${ORDER_ITEM_ID}`);
  console.log('');

  const orderInfo = await getCustomerEmail(ORDER_ITEM_ID);

  if (orderInfo) {
    console.log('');
    console.log('🎉 Customer information retrieved successfully!');
    console.log('');
    console.log('📧 Customer Email:', orderInfo.orders.customer_email);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Use this email address to send the fulfilled status email');
    console.log('2. Test the email sending functionality');
    console.log('3. Verify the email content and formatting');
  } else {
    console.log('');
    console.log('❌ Failed to retrieve customer information!');
    console.log('Please check the error messages above and try again.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getCustomerEmail
};
