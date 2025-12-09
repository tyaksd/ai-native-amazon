'use client'

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Legal Notice</h1>
      <p className="text-sm text-gray-500 mt-2">Specified Commercial Transactions Act (Japan)</p>

      <div className="mt-8 space-y-6 text-gray-800">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Seller Information</h2>
          <p className="mt-3 leading-7">
            <span className="font-medium">Seller / Business Name:</span> Takuto Yasui<br/>
            <span className="font-medium">Address:</span> Room 206, Evergreen Hatsudai, 6-1-19 Honmachi, Shibuya-ku, Tokyo, Japan<br/>
            <span className="font-medium">Contact:</span> jack@godship.io / +81 70 9230 5412<br/>
            <span className="font-medium">Website:</span> godship.io
          </p>
        </section>
x
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Pricing & Fees</h2>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>Prices and applicable taxes are shown on product pages.</li>
            <li>Additional fees may include shipping and import duties/taxes (borne by customer unless stated).</li>
            <li>Payment processor fees may apply where applicable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Payment & Delivery</h2>
          <ul className="mt-3 list-disc list-inside leading-7 space-y-1">
            <li>Payment methods: credit/debit card, PayPal, or methods shown at checkout; charged upon order.</li>
            <li>Production: typically 2–7 business days after order confirmation.</li>
            <li>Shipping: time depends on destination and carrier. Tracking provided when available.</li>
            <li>Fulfillment: manufactured and shipped by Printful from global facilities (US/EU/other regions).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Returns & Cancellations</h2>
          <p className="mt-3 leading-7">
            Due to made-to-order production, cancellations after production begins and change-of-mind returns are not
            accepted. Defective, damaged, or incorrect items will be replaced or refunded—contact us within 14 days of
            delivery with photos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Defective Product Handling</h2>
          <p className="mt-3 leading-7">
            We will verify the issue and coordinate replacement/refund; we may request return or disposal per
            instructions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Special Conditions</h2>
          <p className="mt-3 leading-7">
            Product specifications and manufacturing location may vary by order; delivery may be delayed by customs,
            holidays, or force majeure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Business Hours</h2>
          <p className="mt-3 leading-7">Mon–Fri 10:00–18:00 JST (excluding holidays)</p>
        </section>
      </div>
    </div>
    </div>
  )
}


