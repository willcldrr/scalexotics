'use client'

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2025</p>
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
                When you interact with Scale Exotics, we collect the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Business owner name</li>
                <li>Business name</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Business preferences and goals</li>
                <li>Messages you send through our forms</li>
                <li>IP address and device metadata (captured automatically by third-party platforms)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Data</h2>
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
              <h2 className="text-2xl font-semibold text-foreground">4. Data Storage and Retention</h2>
              <p className="text-muted-foreground">
                Your data is stored within secure service providers we use. Data is retained for the duration of our business relationship unless you request deletion. You may request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Data Sharing</h2>
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
              <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
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
              <h2 className="text-2xl font-semibold text-foreground">7. Age Requirement</h2>
              <p className="text-muted-foreground">
                You must be at least 18 years old to use Scale Exotics services. We do not knowingly collect data from users under 18.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Governing Law</h2>
              <p className="text-muted-foreground">
                This Privacy Policy is governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Contact Us</h2>
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
            <div className="text-sm text-muted-foreground">© 2025 Scale Exotics Marketing. All rights reserved.</div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</a>
              <a href="/tos" className="hover:text-foreground transition">Terms of Service</a>
              <a href="mailto:info@scalexotics.com" className="hover:text-foreground transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
