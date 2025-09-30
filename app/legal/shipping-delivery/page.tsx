'use client'

export default function ShippingDeliveryPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Shipping & Delivery</h1>
      <p className="text-sm text-gray-500 mt-2">Last updated: September 29, 2025</p>

      <div className="mt-8 space-y-8 text-gray-800">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="mt-3 leading-7">
            We partner with a global print-on-demand fulfillment company to manufacture and ship every order. Because
            each product is made to order, please allow production time plus shipping time for delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Fulfillment & Production Time</h2>
          <p className="mt-3 leading-7">
            Typical production time is <span className="font-medium">3–7 business days</span> from the date your order is placed. Production begins after
            payment is confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Estimated Shipping Times</h2>
          <p className="mt-3 leading-7">After production, average delivery times are:</p>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>USA: 3–4 business days</li>
            <li>Europe: 6–8 business days</li>
            <li>Australia: 2–14 business days</li>
            <li>Japan: 4–8 business days</li>
            <li>International: 10–20 business days</li>
          </ul>
          <p className="mt-3 leading-7 text-gray-700">Estimates are not guaranteed and may vary due to customs, weather, and seasonal peaks.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Shipping Origin</h2>
          <p className="mt-3 leading-7">
            Orders are fulfilled at the facility closest to the delivery address whenever possible (US, EU, Asia, or
            other regions) to minimize transit time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Customs, Duties & Taxes</h2>
          <p className="mt-3 leading-7">
            International orders may incur customs duties, taxes, or import fees determined by your local customs
            office. Unless stated otherwise, these charges are the customer’s responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Tracking Your Order</h2>
          <p className="mt-3 leading-7">
            Once your order ships, you’ll receive a tracking link via email. Questions about tracking or shipment?
            Contact <span className="font-medium">jack@godship.io</span> with your order number.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Lost or Delayed Packages</h2>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>Verify your shipping confirmation for address accuracy.</li>
            <li>Check with your local post office and neighbors.</li>
          </ul>
          <p className="mt-3 leading-7">
            If the address was correct and the package is still missing, email <span className="font-medium">jack@godship.io</span> with your order number.
            If the address was incorrect, we can resend the order, but reshipping costs will be your responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Split Shipments</h2>
          <p className="mt-3 leading-7">Orders with multiple items may ship separately depending on availability and location.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Delays & Force Majeure</h2>
          <p className="mt-3 leading-7">
            Delivery may be delayed by customs inspections, weather, or carrier disruptions. We appreciate your
            understanding.
          </p>
        </section>
      </div>
    </div>
  )
}


