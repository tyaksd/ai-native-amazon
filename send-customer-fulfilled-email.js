#!/usr/bin/env node

/**
 * Send Customer Fulfilled Email Script
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM (or falls back to SMTP_USER),
 * ORDER_ITEM_ID, CUSTOMER_EMAIL. Optional: SMTP_PORT (default 465), SMTP_SECURE (default true).
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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

function smtpConfigFromEnv () {
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = (process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false';
  return {
    host: requireEnv('SMTP_HOST'),
    port,
    secure,
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS')
    }
  };
}

function orderItemIdFromEnv () {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  return requireEnv('ORDER_ITEM_ID');
}

function customerEmailFromEnv () {
  return requireEnv('CUSTOMER_EMAIL');
}

/**
 * Get order information
 */
async function getOrderInfo(orderItemId) {
  console.log(`📋 Fetching order information for: ${orderItemId}`);
  
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

    return orderItem;

  } catch (error) {
    console.error('❌ Error fetching order info:', error);
    return null;
  }
}

/**
 * Render fulfilled status email
 */
function renderFulfilledEmail(orderInfo) {
  const statusInfo = {
    title: 'Your order is being prepared! ⚡',
    message: 'Your order has been fulfilled and is being prepared for shipment.',
    color: '#f59e0b'
  };
  
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;line-height:1.6;max-width:600px;margin:0 auto;">
      
      <div style="background:linear-gradient(135deg,${statusInfo.color}15,${statusInfo.color}05);border:1px solid ${statusInfo.color}30;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:${statusInfo.color};font-size:24px;">${statusInfo.title}</h2>
        <p style="margin:0;color:#374151;font-size:16px;">${statusInfo.message}</p>
      </div>
      
      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 16px;color:#111827;font-size:18px;">Order Details</h3>
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Order ID:</strong> ${orderInfo.orders.id}</p>
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Product:</strong> ${orderInfo.product_name}</p>
        ${orderInfo.size ? `<p style="margin:0 0 8px;color:#6b7280;"><strong>Size:</strong> ${orderInfo.size}</p>` : ''}
        ${orderInfo.color ? `<p style="margin:0 0 8px;color:#6b7280;"><strong>Color:</strong> ${orderInfo.color}</p>` : ''}
        <p style="margin:0 0 8px;color:#6b7280;"><strong>Status:</strong> ${orderInfo.printful_status}</p>
        <p style="margin:0;color:#6b7280;"><strong>Fulfillment:</strong> ${orderInfo.printful_fulfillment_status || 'Preparing'}</p>
      </div>
      
      <div style="text-align:center;margin:24px 0;">
        <p style="margin:0;color:#6b7280;font-size:14px;">Thank you for choosing Godship!</p>
        <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please contact us through our website.</p>
      </div>
    </div>
  `;
}

/**
 * Send email
 */
async function sendEmail (to, subject, html, smtpConfig, fromAddress) {
  console.log(`📧 Sending email to: ${to}`);
  
  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Send email
    const info = await transporter.sendMail({
      from: fromAddress,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main () {
  const orderItemId = orderItemIdFromEnv();
  const customerEmail = customerEmailFromEnv();
  const smtpConfig = smtpConfigFromEnv();
  const fromAddress = process.env.SMTP_FROM?.trim() || smtpConfig.auth.user;

  console.log('🚀 Sending Fulfilled Status Email...');
  console.log(`📦 Order Item ID: ${orderItemId}`);
  console.log(`📧 Customer Email: ${customerEmail}`);
  console.log('');
  
  const orderInfo = await getOrderInfo(orderItemId);
  
  if (!orderInfo) {
    console.log('❌ Failed to get order information');
    return;
  }
  
  console.log('✅ Order information retrieved:');
  console.log(`- Order ID: ${orderInfo.orders.id}`);
  console.log(`- Product: ${orderInfo.product_name}`);
  console.log(`- Status: ${orderInfo.printful_status}`);
  console.log('');
  
  // Step 2: Generate email content
  const emailHtml = renderFulfilledEmail(orderInfo);
  const subject = `Order Update - ${orderInfo.orders.id}`;
  
  // Step 3: Send email
  const emailSent = await sendEmail(customerEmail, subject, emailHtml, smtpConfig, fromAddress);
  
  if (emailSent) {
    console.log('');
    console.log('🎉 Fulfilled status email sent successfully!');
    console.log(`📧 Sent to: ${customerEmail}`);
    console.log('');
    console.log('📋 Email Details:');
    console.log(`- Subject: ${subject}`);
    console.log(`- Recipient: ${customerEmail}`);
    console.log(`- Order ID: ${orderInfo.orders.id}`);
    console.log(`- Product: ${orderInfo.product_name}`);
  } else {
    console.log('');
    console.log('❌ Failed to send fulfilled status email!');
    console.log('Please check the error messages above and try again.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getOrderInfo,
  renderFulfilledEmail,
  sendEmail
};
