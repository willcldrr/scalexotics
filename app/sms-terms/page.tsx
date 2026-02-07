'use client'

export default function SMSTerms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <img src="/scalexoticslogo.png" alt="Scale Exotics" className="h-12 w-auto" />
        </a>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          &larr; Back to Home
        </a>
      </nav>

      {/* Content */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">SMS Terms &amp; Conditions</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. SMS Program Overview</h2>
              <p className="text-muted-foreground">
                By opting in to receive SMS/text messages from Scale Exotics or our partner rental businesses, you agree to the following terms and conditions. These terms govern our text messaging communications with you.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Program Name:</strong> Scale Exotics Vehicle Rental Alerts
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Program Description:</strong> Receive promotional offers, booking confirmations, appointment reminders, availability updates, and customer service communications related to exotic and luxury vehicle rentals.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Message Types</h2>
              <p className="text-muted-foreground">
                By opting in, you may receive the following types of text messages:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Promotional Messages:</strong> Special offers, discounts, deals, and new vehicle availability</li>
                <li><strong className="text-foreground">Transactional Messages:</strong> Booking confirmations, rental reminders, payment receipts</li>
                <li><strong className="text-foreground">Appointment Reminders:</strong> Pickup/drop-off reminders, inspection appointments</li>
                <li><strong className="text-foreground">Customer Service:</strong> Responses to your inquiries and support communications</li>
                <li><strong className="text-foreground">Account Updates:</strong> Important information about your rental or account</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Message Frequency</h2>
              <p className="text-muted-foreground">
                Message frequency varies based on your interactions and preferences. You may receive:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Up to 10 promotional messages per month</li>
                <li>Transactional messages as needed for active bookings</li>
                <li>Appointment reminders 24-48 hours before scheduled events</li>
              </ul>
              <p className="text-muted-foreground">
                Frequency may increase during special promotions or if you have multiple active inquiries.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Costs and Carrier Fees</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Message and data rates may apply.</strong> You are responsible for any charges from your mobile carrier for sending or receiving text messages. Check with your carrier for details about your messaging plan.
              </p>
              <p className="text-muted-foreground">
                Scale Exotics does not charge a fee for sending text messages, but standard carrier messaging rates apply.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. How to Opt Out</h2>
              <p className="text-muted-foreground">
                You can stop receiving text messages at any time using any of these methods:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Text STOP:</strong> Reply <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">STOP</span> to any message to unsubscribe from all promotional messages</li>
                <li><strong className="text-foreground">Text CANCEL:</strong> Reply <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">CANCEL</span>, <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">END</span>, <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">QUIT</span>, or <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">UNSUBSCRIBE</span> to any message</li>
                <li><strong className="text-foreground">Email:</strong> Contact us at info@scalexotics.com with your phone number and opt-out request</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                After opting out, you will receive a single confirmation message. No further promotional messages will be sent. Note: You may still receive transactional messages for active bookings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. How to Get Help</h2>
              <p className="text-muted-foreground">
                For assistance with our SMS program:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Text HELP:</strong> Reply <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">HELP</span> to any message for support information</li>
                <li><strong className="text-foreground">Email:</strong> Contact us at info@scalexotics.com</li>
                <li><strong className="text-foreground">Phone:</strong> Call our support team during business hours</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Consent Requirements</h2>
              <p className="text-muted-foreground">
                By opting in to our SMS program, you confirm that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You are at least 18 years of age</li>
                <li>You are the account holder or have authorization from the account holder</li>
                <li>You consent to receive automated marketing and informational text messages</li>
                <li>Your consent is not a condition of purchasing any goods or services</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">Important:</strong> Consent to receive text messages is not required to make a purchase or rental. You can still use our services without subscribing to text messages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Supported Carriers</h2>
              <p className="text-muted-foreground">
                Our SMS service is supported by major U.S. carriers including but not limited to: AT&amp;T, Verizon, T-Mobile, Sprint, U.S. Cellular, and other regional carriers. Carriers are not liable for delayed or undelivered messages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Privacy</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. Your mobile phone number and SMS consent information will be handled in accordance with our <a href="/privacy-policy" className="text-foreground underline hover:opacity-80">Privacy Policy</a>.
              </p>
              <p className="text-muted-foreground">
                Key points:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We do not sell, rent, or share your phone number with third parties for marketing purposes</li>
                <li>Your information is shared only with our SMS service provider for message delivery</li>
                <li>We maintain records of consent for regulatory compliance</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Age-Restricted Services</h2>
              <p className="text-muted-foreground">
                Our rental services have age requirements (typically 25 years or older for exotic vehicle rentals). By providing your phone number, you confirm that you meet the minimum age requirements for our services as specified during the booking process.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these SMS Terms &amp; Conditions at any time. Changes will be effective immediately upon posting to this page. Your continued participation in our SMS program after changes are posted constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have questions about these SMS Terms &amp; Conditions, please contact us:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Email:</strong> info@scalexotics.com</li>
                <li><strong className="text-foreground">Text:</strong> Reply HELP to any message</li>
              </ul>
            </section>
          </div>

          <div className="pt-8 border-t border-border/30">
            <div className="flex flex-wrap gap-4">
              <a
                href="/"
                className="inline-block px-6 py-2.5 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: "#375DEE" }}
              >
                Return to Home
              </a>
              <a
                href="/privacy-policy"
                className="inline-block px-6 py-2.5 text-sm font-medium text-muted-foreground border border-border/50 rounded-xl transition hover:text-foreground hover:border-border"
              >
                Privacy Policy
              </a>
              <a
                href="/tos"
                className="inline-block px-6 py-2.5 text-sm font-medium text-muted-foreground border border-border/50 rounded-xl transition hover:text-foreground hover:border-border"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-muted-foreground">&copy; 2026 Scale Exotics Marketing. All rights reserved.</div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</a>
              <a href="/tos" className="hover:text-foreground transition">Terms of Service</a>
              <a href="/sms-terms" className="hover:text-foreground transition">SMS Terms</a>
              <a href="mailto:info@scalexotics.com" className="hover:text-foreground transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
