#!/usr/bin/env node

/**
 * Send Customer Fulfilled Email Script
 * 
 * This script sends a fulfilled status email to the specific customer
 * for the order item ID: 760ecd24-2c82-4ac5-a5cd-a71f99cf903f
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Supabase configuration
const supabaseUrl = 'https://lphwwwhwtbxgujmdqquf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHd3d2h3dGJ4Z3VqbWRxcXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA0MzkwMSwiZXhwIjoyMDc0NjE5OTAxfQ.fJJy_7DRXYqEWL17XVmm5lRcmF7oouyrYjDraB9e9wA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Email configuration
const SMTP_CONFIG = {
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: 'jack@godship.io',
    pass: 'Shsnwu2877-'
  }
};

// Configuration
const ORDER_ITEM_ID = '760ecd24-2c82-4ac5-a5cd-a71f99cf903f';
const CUSTOMER_EMAIL = 'z42i9h0o3j1c4rj3a7p@icloud.com';

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
async function sendEmail(to, subject, html) {
  console.log(`📧 Sending email to: ${to}`);
  
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Send email
    const info = await transporter.sendMail({
      from: 'jack@godship.io',
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
async function main() {
  console.log('🚀 Sending Fulfilled Status Email...');
  console.log(`📦 Order Item ID: ${ORDER_ITEM_ID}`);
  console.log(`📧 Customer Email: ${CUSTOMER_EMAIL}`);
  console.log('');
  
  // Step 1: Get order information
  const orderInfo = await getOrderInfo(ORDER_ITEM_ID);
  
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
  const emailSent = await sendEmail(CUSTOMER_EMAIL, subject, emailHtml);
  
  if (emailSent) {
    console.log('');
    console.log('🎉 Fulfilled status email sent successfully!');
    console.log(`📧 Sent to: ${CUSTOMER_EMAIL}`);
    console.log('');
    console.log('📋 Email Details:');
    console.log(`- Subject: ${subject}`);
    console.log(`- Recipient: ${CUSTOMER_EMAIL}`);
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
