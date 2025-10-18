// Test script for batch product generation
// Run this with: node test-batch-generation.js

const fetch = require('node-fetch');

async function testBatchGeneration() {
  try {
    console.log('Testing batch product generation...');
    
    const response = await fetch('http://localhost:3000/api/generate-batch-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('Batch generation result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Successfully generated ${result.generatedProducts.length} products`);
      console.log('Generated products:');
      result.generatedProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.brand}: ${product.product} (${product.color}) - $${product.price}`);
      });
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.brand}: ${error.error}`);
        });
      }
    } else {
      console.log('❌ Batch generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBatchGeneration();
