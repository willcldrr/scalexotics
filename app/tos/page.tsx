'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <img src="/scalexoticslogo.png" alt="Scale Exotics" className="h-12 w-auto" />
        </a>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Back to Home
        </a>
      </nav>

      {/* Content */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Scale Exotics services, you agree to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service. Scale Exotics is a marketing and growth service for exotic and luxury car rental businesses.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Services</h2>
              <p className="text-muted-foreground">
                Scale Exotics provides marketing, booking automation, and growth consulting services to exotic and luxury car rental companies. Our services include but are not limited to: booking engine implementation, profit optimization strategies, and 24/7 support.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Age Requirement</h2>
              <p className="text-muted-foreground">
                You must be at least 18 years old to use Scale Exotics services. By using our service, you represent and warrant that you are at least 18 years of age and possess the legal authority to enter into this agreement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p className="text-muted-foreground">
                You agree not to use Scale Exotics for any unlawful purpose or in any way that violates these terms. Specifically, you agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Harass, threaten, or abuse our team members</li>
                <li>Provide false or misleading information</li>
                <li>Interfere with the normal operation of our services</li>
                <li>Use our services for any illegal activities</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Data and Privacy</h2>
              <p className="text-muted-foreground">
                By using Scale Exotics, you consent to the collection and use of your data as outlined in our <a href="/privacy-policy" className="text-foreground underline hover:opacity-80">Privacy Policy</a>. We collect your name, business information, phone number, email, and other relevant details for the purpose of providing our services.
              </p>
              <p className="text-muted-foreground mt-4">
                Data is shared only with partners and third-party service processors necessary to deliver our services. We do not sell your data.
              </p>
              <p className="text-muted-foreground mt-4">
                If you opt in to receive SMS/text messages, additional terms apply. Please review our <a href="/sms-terms" className="text-foreground underline hover:opacity-80">SMS Terms &amp; Conditions</a> for complete details about our text messaging program.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Payment Terms</h2>
              <p className="text-muted-foreground">
                Payment terms will be agreed upon separately based on the services selected. All fees are non-refundable unless otherwise specified in writing.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Scale Exotics services are provided on an "as-is" basis. To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Scale Exotics and its team from any claims, losses, or damages arising from your use of our services, violation of these terms, or infringement of any third-party rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to terminate or suspend your access to Scale Exotics services at any time, for any reason, with notice. You may also discontinue use at any time by contacting our support team.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of Scale Exotics after changes are posted constitutes your acceptance of the new terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms of Service are governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any legal action or proceeding shall be exclusively resolved in the courts of Florida.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at: <strong className="text-foreground">info@scalexotics.com</strong>
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
