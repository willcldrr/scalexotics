"use client"

import Link from "next/link"
import { ArrowLeft, Car } from "lucide-react"

export default function TermsOfServicePage() {
  const primaryColor = "#375DEE"
  const backgroundColor = "#0a0a0a"

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-white/10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6" style={{ color: primaryColor }} />
            <span className="text-white font-semibold text-lg">Dior's Exotic Rentals</span>
          </div>
          <Link
            href="/lead/capture"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inquiry
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">SMS Terms &amp; Conditions</h1>
        <p className="text-white/50 mb-8">Last updated: February 2026</p>

        <div className="text-sm text-white/70 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Program Overview</h2>
            <p><strong className="text-white">Program Name:</strong> Dior's Exotic Rentals Alerts</p>
            <p className="mt-2"><strong className="text-white">Description:</strong> By opting in, you agree to receive recurring automated marketing and informational text messages about exotic and luxury vehicle rentals, including promotional offers, booking confirmations, availability updates, and customer service communications.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Message Types</h2>
            <p className="mb-2">You may receive:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Promotional:</strong> Special offers, discounts, new vehicle availability</li>
              <li><strong className="text-white">Transactional:</strong> Booking confirmations, rental reminders, payment receipts</li>
              <li><strong className="text-white">Reminders:</strong> Pickup/drop-off appointments, inspection notices</li>
              <li><strong className="text-white">Service:</strong> Responses to inquiries, support communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Message Frequency</h2>
            <p>Message frequency varies based on your interactions. You may receive up to 10 promotional messages per month, plus transactional messages as needed for active bookings. Frequency may increase during special promotions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Costs</h2>
            <p><strong className="text-white">Message and data rates may apply.</strong> You are responsible for any charges from your mobile carrier. We do not charge a fee for sending messages, but standard carrier rates apply.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. How to Opt Out</h2>
            <p className="mb-2">Stop messages at any time by:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Replying <strong className="text-white">STOP</strong> to any message</li>
              <li>Replying <strong className="text-white">CANCEL</strong>, <strong className="text-white">END</strong>, <strong className="text-white">QUIT</strong>, or <strong className="text-white">UNSUBSCRIBE</strong></li>
              <li>Emailing support@example.com with your phone number</li>
            </ul>
            <p className="mt-2">You will receive a confirmation message after opting out. No further promotional messages will be sent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. How to Get Help</h2>
            <p className="mb-2">For assistance:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Reply <strong className="text-white">HELP</strong> to any message</li>
              <li>Email support@example.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Consent Requirements</h2>
            <p className="mb-2">By opting in, you confirm:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You are at least 18 years old</li>
              <li>You are the account holder or authorized to receive messages</li>
              <li>You consent to automated marketing and informational texts</li>
              <li>Consent is NOT required to make a purchase or rental</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Supported Carriers</h2>
            <p>Supported on major U.S. carriers including AT&amp;T, Verizon, T-Mobile, and others. Carriers are not liable for delayed or undelivered messages.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Privacy</h2>
            <p>We do not sell, rent, or share your phone number with third parties for marketing. See our <Link href="/lead/privacy-policy" className="underline hover:text-white/90">Privacy Policy</Link> for complete details on data handling.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Age-Restricted Services</h2>
            <p>Exotic vehicle rentals typically require renters to be 25 years or older. By providing your phone number, you confirm you meet minimum age requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
            <p>Questions? Email support@example.com or reply HELP to any message.</p>
          </section>
        </div>

        {/* SMS Quick Reference */}
        <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">SMS Program Quick Reference</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
            <div>
              <p className="text-white font-medium">Program Name</p>
              <p>Dior's Exotic Rentals Alerts</p>
            </div>
            <div>
              <p className="text-white font-medium">Message Frequency</p>
              <p>Up to 10 messages/month</p>
            </div>
            <div>
              <p className="text-white font-medium">To Opt Out</p>
              <p>Reply STOP to any message</p>
            </div>
            <div>
              <p className="text-white font-medium">For Help</p>
              <p>Reply HELP or email support@example.com</p>
            </div>
            <div>
              <p className="text-white font-medium">Message Rates</p>
              <p>Message &amp; data rates may apply</p>
            </div>
            <div>
              <p className="text-white font-medium">Data Sharing</p>
              <p>We do NOT sell your phone number</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/50">
          <p>&copy; 2026 Dior's Exotic Rentals. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/lead/privacy-policy" className="hover:text-white/70">Privacy Policy</Link>
            {" | "}
            <Link href="/lead/tos" className="hover:text-white/70">SMS Terms</Link>
            {" | "}
            <a href="mailto:support@example.com" className="hover:text-white/70">Contact</a>
          </p>
        </div>
      </div>
    </div>
  )
}
