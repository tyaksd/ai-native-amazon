// Test script for estimated delivery email functionality
// Run with: node test-estimated-delivery-email.js

const testEmailAPI = async () => {
  try {
    console.log('🧪 Testing estimated delivery email API...')
    
    // Test data - you'll need to replace with actual order item ID from your database
    const testData = {
      orderItemId: 'your-order-item-id-here', // Replace with actual order item ID
      estimatedDelivery: 'October 18–23, 2024'
    }
    
    const response = await fetch('http://localhost:3000/api/send-estimated-delivery-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Email API test successful!')
      console.log('Response:', result)
    } else {
      console.log('❌ Email API test failed!')
      console.log('Error:', result)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Instructions for manual testing
console.log(`
📧 Estimated Delivery Email Test Instructions:

1. Start your Next.js development server:
   npm run dev

2. Get an actual order item ID from your database:
   - Go to /lkj page
   - Open browser dev tools
   - Look for order item IDs in the console logs

3. Update the testData.orderItemId above with a real order item ID

4. Run this test:
   node test-estimated-delivery-email.js

5. Check the email was sent to the customer's email address

6. Test the /lkj page:
   - Go to /lkj
   - Find an order with a customer email
   - Enter estimated delivery (e.g., "October 18–23")
   - Press Enter or click outside the input
   - Check console logs for email sending confirmation
   - Check customer's email for the notification

📝 Email Template Features:
- Professional Godship branding
- Order details with product info
- Clear estimated delivery date
- Next steps information
- Important disclaimers
- Responsive design
`)

// Uncomment the line below to run the test automatically
// testEmailAPI()
