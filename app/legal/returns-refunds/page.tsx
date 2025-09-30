'use client'

export default function ReturnsRefundsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
      <p className="text-sm text-gray-500 mt-2">Last updated: September 29, 2025</p>

      <div className="mt-8 space-y-8 text-gray-800">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="mt-3 leading-7">
            Our products are made to order and fulfilled by a global print-on-demand partner. Because each item is
            produced especially for you, we generally do not accept returns, exchanges, or cancellations once
            production has started.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. General Return Policy</h2>
          <p className="mt-3 leading-7">
            We do not offer returns or exchanges for change of mind, incorrect size, or color preference. Before
            ordering, please review the size charts and product details on each product page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Refund Eligibility</h2>
          <p className="mt-3 leading-7">Refunds are offered only if:</p>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>You receive the wrong item, or</li>
            <li>The item arrives defective or damaged.</li>
          </ul>
          <p className="mt-3 leading-7">
            If any of these apply, contact <span className="font-medium">jack@godship.io</span> within 7 days of delivery and include:
          </p>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>Your order number</li>
            <li>Clear photos of the issue</li>
            <li>A brief description of the problem</li>
          </ul>
          <p className="mt-3 leading-7">Once verified, we will issue a refund or send a replacement at no additional cost.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Damaged or Incorrect Items</h2>
          <p className="mt-3 leading-7">
            If your product arrives damaged or incorrect, email <span className="font-medium">jack@godship.io</span> within 7 days of receiving the order.
            Attach photos of the item and include your order number. We will provide a resolution as quickly as possible—
            either a replacement or a refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Mislabelled Items</h2>
          <p className="mt-3 leading-7">
            Although rare, an item may be mislabelled. Email <span className="font-medium">jack@godship.io</span> within 7 days of receipt with your order number
            and photos of the mislabelled product. We will send a new item or issue a refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Exchanges</h2>
          <p className="mt-3 leading-7">
            We currently do not offer size or color exchanges. If you are unsure about sizing, please refer to the size
            charts available on each product page before purchasing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Lost Packages or Delivery Issues</h2>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>Double-check your shipping confirmation email for address errors.</li>
            <li>Ask your local post office if they are holding the package.</li>
            <li>Check with neighbors in case the courier left the package nearby.</li>
          </ul>
          <p className="mt-3 leading-7">
            If the shipping address was correct and the package is not at the post office or with neighbors, contact
            <span className="font-medium"> jack@godship.io</span> with your order number. If there was an address error, we can send a replacement, but
            reshipping costs will be your responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Customs, Duties & Taxes</h2>
          <p className="mt-3 leading-7">
            International orders may be subject to additional customs or tax fees, assessed by the destination country’s
            customs office. These charges are outside our control and are the responsibility of the customer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Need Help?</h2>
          <p className="mt-3 leading-7">
            For any questions about returns, refunds, or shipping issues, email <span className="font-medium">jack@godship.io</span> with your order number and a
            detailed description of the issue.
          </p>
        </section>
      </div>
    </div>
  )
}


