'use client'

import Image from "next/image"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <Image src="/scalexoticslogo.png" alt="Scale Exotics" width={160} height={48} className="h-12 w-auto" priority />
        </a>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Back to Home
        </a>
      </nav>

      {/* Content */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground">
                Scale Exotics is a Florida-based marketing and growth service for exotic and luxury car rental companies. This Privacy Policy explains how we collect, use, and protect your data when you use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Data We Collect</h2>
              <p className="text-muted-foreground">
                When you interact with Scale Exotics or our clients&apos; services, we collect the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Full name</li>
                <li>Business name (if applicable)</li>
                <li>Phone number (mobile and/or landline)</li>
                <li>Email address</li>
                <li>Age verification information</li>
                <li>Vehicle rental preferences and interests</li>
                <li>Booking dates and rental history</li>
                <li>Messages you send through our forms</li>
                <li>SMS/text message opt-in consent records</li>
                <li>IP address and device metadata (captured automatically by third-party platforms)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. SMS/Text Message Communications</h2>
              <p className="text-muted-foreground">
                When you provide your mobile phone number and consent to receive text messages, we collect and use your information as follows:
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">Information Collected for SMS</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Mobile phone number</li>
                <li>Consent timestamp and method</li>
                <li>Opt-in/opt-out status and history</li>
                <li>Message delivery status</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">How We Use SMS Data</h3>
              <p className="text-muted-foreground">
                Your phone number and SMS consent information is used solely to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Send promotional offers and deals related to exotic vehicle rentals</li>
                <li>Send booking confirmations and appointment reminders</li>
                <li>Provide rental availability updates</li>
                <li>Respond to your customer service inquiries</li>
                <li>Send transactional messages about your rental or inquiry</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">SMS Data Sharing</h3>
              <p className="text-muted-foreground">
                <strong className="text-foreground">We do not sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes.</strong> Your phone number is shared only with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Our SMS service provider (Twilio) solely for message delivery</li>
                <li>The specific rental business you inquired with</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                These service providers are contractually prohibited from using your information for any purpose other than providing the messaging service.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">Opting Out of SMS</h3>
              <p className="text-muted-foreground">
                You can stop receiving text messages at any time by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Replying <strong className="text-foreground">STOP</strong> to any text message</li>
                <li>Contacting us at info@scalexotics.com</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                After opting out, you will receive a confirmation message and no further marketing texts will be sent. Transactional messages (like booking confirmations) may still be sent if you have an active rental.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">SMS Data Retention</h3>
              <p className="text-muted-foreground">
                We retain SMS consent records and message logs for a minimum of 4 years to comply with regulatory requirements. You may request deletion of your data by contacting us, subject to legal retention requirements.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. How We Use Your Data</h2>
              <p className="text-muted-foreground">
                Your data is used solely for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Contacting you regarding our services</li>
                <li>Providing marketing and growth consulting services</li>
                <li>Communicating with you regarding your business needs</li>
                <li>Operating and maintaining our systems</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Data Storage and Retention</h2>
              <p className="text-muted-foreground">
                Your data is stored within secure service providers we use. Data is retained for the duration of our business relationship unless you request deletion. You may request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Data Sharing</h2>
              <p className="text-muted-foreground">
                We only share your data with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Third-party service processors required to operate our systems</li>
                <li>Partners necessary to deliver our services to you</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We do not sell your data to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Request access to your personal data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw from using our service at any time</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at the email provided below.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Age Requirement</h2>
              <p className="text-muted-foreground">
                You must be at least 18 years old to use Scale Exotics services. We do not knowingly collect data from users under 18.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Governing Law</h2>
              <p className="text-muted-foreground">
                This Privacy Policy is governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or your data, please contact us at: <strong className="text-foreground">info@scalexotics.com</strong>
              </p>
            </section>
          </div>

          <div className="pt-8 border-t border-border/30">
            <a 
              href="/"
              className="inline-block px-6 py-2.5 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: "#375DEE" }}
            >
                Return to Home
            </a>
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
