'use client'

export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Center</h1>
      
      <div className="space-y-6">
        {/* Shipping & Delivery */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shipping & Delivery</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How long does shipping take?</h3>
              <p className="text-gray-700">Shipping to the US and UK takes approximately 1 week. For all other countries, delivery takes 1-3 weeks depending on the destination.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Do you ship internationally?</h3>
              <p className="text-gray-700">Yes! We ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination. You can see the exact cost at checkout.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Can I track my order?</h3>
              <p className="text-gray-700">Absolutely! Once your order ships, you'll receive a tracking number via email. You can also track your order in your account dashboard.</p>
            </div>
          </div>
        </section>

        {/* Returns & Exchanges */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Returns & Exchanges</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Can I return my order?</h3>
              <p className="text-gray-700">We do not accept returns for customer preference reasons. Returns are only accepted for defective items or shipping errors on our part.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How do I start a return?</h3>
              <p className="text-gray-700">Please email us at <a href="mailto:jack@godship.io" className="text-blue-600 hover:text-blue-800 underline">jack@godship.io</a> with your order number and reason for return. We'll review your request and provide further instructions.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">What if my item doesn't fit?</h3>
              <p className="text-gray-700">Unfortunately, we do not offer exchanges for size issues. Please carefully check our size chart before placing your order to ensure the best fit.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How long do refunds take?</h3>
              <p className="text-gray-700">Once we receive your return, refunds are processed within 3-5 business days. The refund will appear on your original payment method within 5-10 business days.</p>
            </div>
          </div>
        </section>

        {/* Payment & Billing */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment & Billing</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-700">We accept all major credit cards (Visa, MasterCard, American Express), Apple Pay, and Google Pay. All payments are processed securely through Stripe.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Is my payment information secure?</h3>
              <p className="text-gray-700">Yes! We use industry-standard SSL encryption and never store your payment information. All transactions are processed securely through Stripe, which is PCI DSS compliant.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Can I change my payment method after ordering?</h3>
              <p className="text-gray-700">Unfortunately, we cannot change payment methods after an order is placed. If you need to update your payment information, please contact our support team before your order ships.</p>
            </div>
          </div>
        </section>

        {/* Product Information */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Product Information</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How do I find the right size?</h3>
              <p className="text-gray-700">Each product page includes a size chart with detailed measurements. Please check the size chart on the specific product page you're interested in. If you're between sizes, we recommend sizing up.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">What materials are your products made from?</h3>
              <p className="text-gray-700">Each product page includes detailed information about the materials used for that specific item. Please check the product page for the exact materials and specifications.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How should I care for my items?</h3>
              <p className="text-gray-700">Care instructions are included with each item and listed on the product page. Generally, we recommend machine washing in cold water and air drying to maintain quality and color.</p>
            </div>
          </div>
        </section>

        {/* Account & Orders */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account & Orders</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How do I create an account?</h3>
              <p className="text-gray-700">Click "Sign Up" in the top right corner and enter your email address and password. You can also create an account during checkout.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Can I modify my order after placing it?</h3>
              <p className="text-gray-700">Unfortunately, we cannot modify orders once they have been placed. Please double-check your order details before confirming your purchase.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How do I view my order history?</h3>
              <p className="text-gray-700">Log into your account and visit "My Orders" to view your complete order history, track current orders, and manage returns.</p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-700 mb-6">Can't find the answer you're looking for? Our support team is here to help!</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="mailto:jack@godship.io" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Email Support
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}


