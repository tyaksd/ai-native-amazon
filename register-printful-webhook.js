#!/usr/bin/env node

/**
 * Printful Webhook Registration Script
 * 
 * This script registers a webhook with Printful using their API.
 * It will automatically configure the webhook to receive order status updates.
 */

const https = require('https');

function requireEnv (name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
}

// Configuration (set in the shell or .env.local — never commit real values)
const PRINTFUL_API_KEY = requireEnv('PRINTFUL_API_KEY');
const WEBHOOK_URL = requireEnv('PRINTFUL_WEBHOOK_URL');
const WEBHOOK_SECRET = requireEnv('PRINTFUL_WEBHOOK_SECRET');

// Events to subscribe to
const WEBHOOK_EVENTS = [
  'package_shipped',
  'order_created',
  'order_updated',
  'order_failed'
];

/**
 * Make HTTP request to Printful API
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'api.printful.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };

    const req = https.request(options, (res) => {
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
 * Get current webhooks
 */
async function getCurrentWebhooks() {
  console.log('📋 Fetching current webhooks...');
  
  try {
    const response = await makeRequest('GET', '/webhooks');
    
    if (response.status === 200) {
      console.log('📋 API Response:', JSON.stringify(response.data, null, 2));
      const webhooks = response.data.result || [];
      console.log(`✅ Found ${webhooks.length} existing webhooks`);
      return Array.isArray(webhooks) ? webhooks : [];
    } else {
      console.log(`⚠️  Failed to fetch webhooks: ${response.status}`);
      console.log('📋 Error Response:', JSON.stringify(response.data, null, 2));
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching webhooks: ${error.message}`);
    return [];
  }
}

/**
 * Delete existing webhook
 */
async function deleteWebhook(webhookId) {
  console.log(`🗑️  Deleting webhook ${webhookId}...`);
  
  try {
    const response = await makeRequest('DELETE', `/webhooks/${webhookId}`);
    
    if (response.status === 200) {
      console.log(`✅ Webhook ${webhookId} deleted successfully`);
      return true;
    } else {
      console.log(`⚠️  Failed to delete webhook ${webhookId}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting webhook ${webhookId}: ${error.message}`);
    return false;
  }
}

/**
 * Register new webhook
 */
async function registerWebhook() {
  console.log('🔧 Registering new webhook...');
  
  const webhookData = {
    url: WEBHOOK_URL,
    types: WEBHOOK_EVENTS,
    secret: WEBHOOK_SECRET
  };
  
  try {
    const response = await makeRequest('POST', '/webhooks', webhookData);
    
    if (response.status === 200) {
      console.log('✅ Webhook registered successfully!');
      console.log(`📡 Webhook ID: ${response.data.result.id}`);
      console.log(`🔗 URL: ${response.data.result.url}`);
      console.log(`📋 Events: ${response.data.result.types.join(', ')}`);
      return response.data.result;
    } else {
      console.log(`❌ Failed to register webhook: ${response.status}`);
      console.log(`Error: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error registering webhook: ${error.message}`);
    return null;
  }
}

/**
 * Test webhook
 */
async function testWebhook(webhookId) {
  console.log(`🧪 Testing webhook ${webhookId}...`);
  
  try {
    const response = await makeRequest('POST', `/webhooks/${webhookId}/test`);
    
    if (response.status === 200) {
      console.log('✅ Webhook test successful!');
      return true;
    } else {
      console.log(`⚠️  Webhook test failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing webhook: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Printful Webhook Registration...');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log('🔑 Webhook Secret: (set via PRINTFUL_WEBHOOK_SECRET)');
  console.log(`📋 Events: ${WEBHOOK_EVENTS.join(', ')}`);
  console.log('');
  
  // Step 1: Get current webhooks
  const currentWebhooks = await getCurrentWebhooks();
  
  // Step 2: Delete existing webhooks with same URL
  for (const webhook of currentWebhooks) {
    if (webhook.url === WEBHOOK_URL) {
      console.log(`🔄 Found existing webhook for ${WEBHOOK_URL}, removing...`);
      await deleteWebhook(webhook.id);
    }
  }
  
  // Step 3: Register new webhook
  const newWebhook = await registerWebhook();
  
  if (newWebhook) {
    // Step 4: Test webhook
    await testWebhook(newWebhook.id);
    
    console.log('');
    console.log('🎉 Webhook registration completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Make sure your webhook endpoint is accessible');
    console.log('2. Test with a real order status change');
    console.log('3. Check your application logs for webhook events');
  } else {
    console.log('');
    console.log('❌ Webhook registration failed!');
    console.log('Please check your API key and webhook URL.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  makeRequest,
  getCurrentWebhooks,
  deleteWebhook,
  registerWebhook,
  testWebhook
};
