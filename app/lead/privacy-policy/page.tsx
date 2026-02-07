"use client"

import Link from "next/link"
import { ArrowLeft, Car } from "lucide-react"

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/50 mb-8">Last updated: February 2026</p>

        <div className="text-sm text-white/70 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Introduction</h2>
            <p>This Privacy Policy explains how we collect, use, and protect your personal information when you use our exotic and luxury vehicle rental inquiry services and opt-in to receive SMS/text messages.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h2>
            <p className="mb-2">When you submit an inquiry through this form, we collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Full name</li>
              <li>Mobile phone number</li>
              <li>Email address</li>
              <li>Vehicle preferences</li>
              <li>SMS consent status and timestamp</li>
              <li>IP address and device information (automatically collected)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">Your information is used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Send promotional text messages about vehicle availability and special offers</li>
              <li>Send booking confirmations and appointment reminders via SMS</li>
              <li>Respond to your rental inquiries</li>
              <li>Provide customer support</li>
              <li>Process and manage your vehicle rental bookings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. SMS/Text Message Data</h2>
            <p className="mb-2">For SMS communications specifically, we collect and maintain:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your mobile phone number</li>
              <li>Consent timestamp and method</li>
              <li>Opt-in and opt-out history</li>
              <li>Message delivery records</li>
            </ul>
            <p className="mt-2"><strong className="text-white">Important:</strong> We do NOT sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes. Your phone number is used solely for communications from our rental service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Data Sharing</h2>
            <p className="mb-2">We only share your information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Our SMS service provider (for message delivery only)</li>
              <li>Payment processors (for rental transactions)</li>
              <li>Legal authorities (when required by law)</li>
            </ul>
            <p className="mt-2">These service providers are contractually prohibited from using your information for any purpose other than providing their specific services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Opting Out of SMS</h2>
            <p className="mb-2">You can stop receiving text messages at any time:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Reply <strong className="text-white">STOP</strong> to any text message</li>
              <li>Reply <strong className="text-white">CANCEL</strong>, <strong className="text-white">END</strong>, <strong className="text-white">QUIT</strong>, or <strong className="text-white">UNSUBSCRIBE</strong></li>
              <li>Contact us at support@example.com</li>
            </ul>
            <p className="mt-2">After opting out, you will receive a confirmation message and no further promotional texts will be sent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Data Retention</h2>
            <p>We retain your information for the duration of our business relationship and for a minimum of 4 years after to comply with legal and regulatory requirements. You may request deletion of your data by contacting us, subject to legal retention requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of SMS communications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Age Requirement</h2>
            <p>You must be at least 18 years old to use this service. Our vehicle rental services typically require renters to be 25 years or older. We do not knowingly collect information from individuals under 18.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Contact Us</h2>
            <p>For questions about this Privacy Policy or your data, contact us at: support@example.com</p>
          </section>
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
