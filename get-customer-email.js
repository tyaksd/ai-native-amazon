#!/usr/bin/env node

/**
 * Get Customer Email Script
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * and ORDER_ITEM_ID, or pass order item UUID as first CLI argument.
 */

const { createClient } = require('@supabase/supabase-js');

function requireEnv (name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

function orderItemIdFromEnv () {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  return requireEnv('ORDER_ITEM_ID');
}

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
async function main () {
  const orderItemId = orderItemIdFromEnv();
  console.log('🚀 Getting Customer Email Information...');
  console.log(`📦 Order Item ID: ${orderItemId}`);
  console.log('');

  const orderInfo = await getCustomerEmail(orderItemId);

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
