#!/usr/bin/env node

/**
 * Send Fulfilled Status Email Script
 * 
 * This script sends a fulfilled status email to the customer
 * for the specified order item ID.
 */

const http = require('http');

// Configuration
const ORDER_ITEM_ID = '760ecd24-2c82-4ac5-a5cd-a71f99cf903f';
const API_BASE_URL = 'http://localhost:3000';

/**
 * Make HTTP request to local API
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Get order information
 */
async function getOrderInfo(orderItemId) {
  console.log(`📋 Fetching order information for: ${orderItemId}`);
  
  try {
    const response = await makeRequest('GET', `/api/get-printful-status?orderItemId=${orderItemId}`);
    
    if (response.status === 200) {
      console.log('✅ Order status retrieved successfully');
      console.log('📊 Status data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log(`⚠️  Failed to get order status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching order info: ${error.message}`);
    return null;
  }
}

/**
 * Send fulfilled status email
 */
async function sendFulfilledEmail(orderItemId) {
  console.log(`📧 Sending fulfilled status email for order item: ${orderItemId}`);
  
  try {
    const response = await makeRequest('POST', '/api/test-status-email', {
      orderItemId: orderItemId,
      testEmail: null // Use default email from environment
    });
    
    if (response.status === 200) {
      console.log('✅ Fulfilled status email sent successfully!');
      console.log('📧 Email details:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(`⚠️  Failed to send email: ${response.status}`);
      console.log('📧 Error details:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Fulfilled Status Email Sending...');
  console.log(`📦 Order Item ID: ${ORDER_ITEM_ID}`);
  console.log('');
  
  // Step 1: Get order information
  const orderInfo = await getOrderInfo(ORDER_ITEM_ID);
  
  if (!orderInfo) {
    console.log('❌ Failed to get order information');
    return;
  }
  
  console.log('');
  console.log('📊 Order Status Summary:');
  console.log(`- Status: ${orderInfo.data?.status || 'Unknown'}`);
  console.log(`- Fulfillment Status: ${orderInfo.data?.fulfillment_status || 'Unknown'}`);
  console.log(`- Last Updated: ${orderInfo.data?.last_updated || 'Unknown'}`);
  console.log('');
  
  // Step 2: Send fulfilled status email
  const emailSent = await sendFulfilledEmail(ORDER_ITEM_ID);
  
  if (emailSent) {
    console.log('');
    console.log('🎉 Fulfilled status email sent successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check the recipient email inbox');
    console.log('2. Verify the email content and formatting');
    console.log('3. Test with a real order if needed');
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
  makeRequest,
  getOrderInfo,
  sendFulfilledEmail
};
