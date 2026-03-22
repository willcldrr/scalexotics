'use client'

import Image from "next/image"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <Image src="/velocity.jpg" alt="Velocity Labs" width={160} height={48} className="h-12 w-auto" priority />
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
            <p className="text-muted-foreground">Effective Date: March 22, 2026 | Last Updated: March 22, 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">

            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground">
                Velocity Labs, LLC (&quot;Velocity Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a Florida limited liability company providing software-as-a-service (&quot;SaaS&quot;) solutions for exotic and luxury car rental businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website (managevelocity.com), mobile applications, and related services (collectively, the &quot;Services&quot;).
              </p>
              <p className="text-muted-foreground">
                This Privacy Policy applies to: (a) business users who subscribe to our platform (&quot;Business Users&quot;); and (b) end consumers who interact with our Business Users through our platform (&quot;End Users&quot;). By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">If you do not agree with this Privacy Policy, please do not access or use our Services.</strong>
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">2.1 Information You Provide Directly</h3>
              <p className="text-muted-foreground">We collect information you voluntarily provide, including:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Account Information:</strong> Name, email address, phone number, business name, billing address, and payment information when you create an account or subscribe to our Services.</li>
                <li><strong className="text-foreground">Profile Information:</strong> Business details, logo, vehicle inventory, pricing, availability, and service descriptions.</li>
                <li><strong className="text-foreground">Communications:</strong> Messages, inquiries, and correspondence you send through our platform, including SMS/text messages, Instagram Direct Messages, and other communication channels.</li>
                <li><strong className="text-foreground">Booking Information:</strong> Rental dates, vehicle preferences, customer names, contact information, and payment details for transactions processed through our platform.</li>
                <li><strong className="text-foreground">Consent Records:</strong> Records of your consent to receive communications, including SMS opt-in timestamps and preferences.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">2.2 Information Collected Automatically</h3>
              <p className="text-muted-foreground">When you access our Services, we automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information.</li>
                <li><strong className="text-foreground">Usage Information:</strong> Pages visited, features used, clickstream data, access times, and referring URLs.</li>
                <li><strong className="text-foreground">Location Information:</strong> General geographic location based on IP address.</li>
                <li><strong className="text-foreground">Cookies and Similar Technologies:</strong> We use cookies, pixel tags, and similar technologies to collect information about your browsing activities. See Section 9 (Cookies and Tracking Technologies) for more details.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">2.3 Information from Third-Party Platforms</h3>
              <p className="text-muted-foreground">When you connect third-party accounts to our Services, we receive information from those platforms:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Instagram/Meta:</strong> When Business Users connect their Instagram Business or Creator accounts, we receive access tokens, Instagram account ID, username, and the ability to send and receive Direct Messages on their behalf. We access message content solely to facilitate AI-powered responses and lead management as authorized by the Business User.</li>
                <li><strong className="text-foreground">Facebook:</strong> Facebook Page information necessary to connect Instagram Business accounts.</li>
                <li><strong className="text-foreground">Stripe:</strong> Payment processing information, transaction history, and payout details for Business Users who connect their Stripe accounts.</li>
                <li><strong className="text-foreground">Twilio:</strong> SMS delivery status, phone number verification, and message logs.</li>
                <li><strong className="text-foreground">Calendar Services:</strong> When connected, calendar availability and booking synchronization data.</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the information we collect for the following purposes:</p>

              <h3 className="text-lg font-semibold text-foreground mt-4">3.1 To Provide and Maintain Our Services</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Process account registration and authentication</li>
                <li>Facilitate bookings, payments, and transactions</li>
                <li>Enable communication between Business Users and End Users</li>
                <li>Provide AI-powered automated responses to customer inquiries</li>
                <li>Generate leads and manage customer relationships</li>
                <li>Synchronize calendars and availability</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">3.2 To Improve and Personalize Our Services</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Analyze usage patterns to improve functionality</li>
                <li>Customize user experience based on preferences</li>
                <li>Train and improve our AI models (using aggregated, de-identified data)</li>
                <li>Develop new features and services</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">3.3 To Communicate With You</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Send transactional emails and notifications</li>
                <li>Provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Notify you of changes to our Services or policies</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">3.4 To Ensure Security and Compliance</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Enforce our Terms of Service</li>
                <li>Comply with legal obligations</li>
                <li>Respond to legal requests and prevent harm</li>
              </ul>
            </section>

            {/* Instagram and Social Media Data */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Instagram and Social Media Integration</h2>
              <p className="text-muted-foreground">
                Our Services integrate with Instagram and other social media platforms to provide automated messaging capabilities. This section describes how we handle data from these integrations.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.1 Data We Access from Instagram</h3>
              <p className="text-muted-foreground">When a Business User connects their Instagram account, we access:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Instagram Business/Creator account ID and username</li>
                <li>Connected Facebook Page information</li>
                <li>Direct Message conversations (read and write access)</li>
                <li>Basic profile information of users who message the connected account</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.2 How We Use Instagram Data</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To send and receive Direct Messages on behalf of the Business User</li>
                <li>To provide AI-powered automated responses to customer inquiries</li>
                <li>To create and manage leads from Instagram conversations</li>
                <li>To display conversation history within our dashboard</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.3 Instagram Data Storage and Retention</h3>
              <p className="text-muted-foreground">
                Instagram access tokens are encrypted and stored securely. Message content is stored to provide conversation history and lead management features. Business Users can disconnect their Instagram account at any time, which will revoke our access and cease new data collection.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.4 Compliance with Meta Platform Terms</h3>
              <p className="text-muted-foreground">
                Our use of Instagram data complies with Meta&apos;s Platform Terms and Developer Policies. We do not sell Instagram data to third parties, use it for advertising purposes unrelated to our Services, or share it with data brokers.
              </p>
            </section>

            {/* SMS/Text Message Communications */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. SMS/Text Message Communications</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">5.1 Information Collected for SMS</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Mobile phone number</li>
                <li>Consent timestamp, method, and source</li>
                <li>Opt-in/opt-out status and history</li>
                <li>Message content and delivery status</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">5.2 How We Use SMS Data</h3>
              <p className="text-muted-foreground">Your phone number and SMS consent information is used to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Send and receive messages related to vehicle rental inquiries</li>
                <li>Provide booking confirmations and reminders</li>
                <li>Send promotional offers (with explicit consent)</li>
                <li>Facilitate customer service communications</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">5.3 SMS Data Sharing</h3>
              <p className="text-muted-foreground">
                <strong className="text-foreground">We do not sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes.</strong> Phone numbers are shared only with our SMS service provider (Twilio) for message delivery and with the specific Business User you are communicating with.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">5.4 Opting Out of SMS</h3>
              <p className="text-muted-foreground">You can stop receiving text messages at any time by:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Replying <strong className="text-foreground">STOP</strong> to any message</li>
                <li>Contacting us at privacy@managevelocity.com</li>
                <li>Using the opt-out link in our messages</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">5.5 SMS Data Retention</h3>
              <p className="text-muted-foreground">
                SMS consent records and message logs are retained for a minimum of four (4) years to comply with TCPA and carrier requirements. You may request deletion subject to legal retention requirements.
              </p>
            </section>

            {/* Data Sharing and Disclosure */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground">We may share your information in the following circumstances:</p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.1 With Service Providers</h3>
              <p className="text-muted-foreground">We share data with third-party vendors who perform services on our behalf:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Supabase:</strong> Database hosting and authentication</li>
                <li><strong className="text-foreground">Vercel:</strong> Website and application hosting</li>
                <li><strong className="text-foreground">Twilio:</strong> SMS messaging services</li>
                <li><strong className="text-foreground">Stripe:</strong> Payment processing</li>
                <li><strong className="text-foreground">Anthropic:</strong> AI language model services (no personal data stored)</li>
                <li><strong className="text-foreground">Meta/Instagram:</strong> Social media messaging integration</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                These providers are contractually obligated to use your data only to provide services to us and to maintain appropriate security measures.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.2 With Business Users</h3>
              <p className="text-muted-foreground">
                If you are an End User, your information (name, contact details, messages, booking information) is shared with the Business User whose services you are inquiring about or using. Each Business User is responsible for their own handling of your data.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.3 For Legal Reasons</h3>
              <p className="text-muted-foreground">We may disclose your information if required to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Comply with applicable laws, regulations, or legal processes</li>
                <li>Respond to lawful requests from public authorities</li>
                <li>Protect our rights, privacy, safety, or property</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect against legal liability</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.4 Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, reorganization, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.5 No Sale of Personal Information</h3>
              <p className="text-muted-foreground">
                <strong className="text-foreground">We do not sell your personal information to third parties.</strong> We do not share your information with data brokers or for third-party advertising purposes unrelated to our Services.
              </p>
            </section>

            {/* Data Retention */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide our Services and fulfill the purposes described in this Privacy Policy, unless a longer retention period is required by law.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Account Data:</strong> Retained while your account is active and for seven (7) years thereafter for legal and tax purposes.</li>
                <li><strong className="text-foreground">Transaction Records:</strong> Retained for seven (7) years per IRS requirements.</li>
                <li><strong className="text-foreground">SMS Consent Records:</strong> Retained for four (4) years per TCPA requirements.</li>
                <li><strong className="text-foreground">Communication Logs:</strong> Retained for two (2) years or until deletion is requested.</li>
                <li><strong className="text-foreground">Access Tokens:</strong> Retained while integration is active; deleted upon disconnection.</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
                <li>Access controls and authentication requirements</li>
                <li>Regular security assessments and monitoring</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            {/* Cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Maintain your session and authentication status</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns and improve our Services</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control cookies through your browser settings. Disabling cookies may affect the functionality of our Services.
              </p>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Your Privacy Rights</h2>
              <p className="text-muted-foreground">Depending on your location, you may have the following rights:</p>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.1 All Users</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Access:</strong> Request a copy of your personal information</li>
                <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate information</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal information</li>
                <li><strong className="text-foreground">Opt-Out:</strong> Opt out of marketing communications</li>
                <li><strong className="text-foreground">Data Portability:</strong> Request your data in a portable format</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.2 California Residents (CCPA/CPRA)</h3>
              <p className="text-muted-foreground">If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Right to know what personal information is collected, used, and shared</li>
                <li>Right to delete personal information</li>
                <li>Right to opt out of the sale or sharing of personal information</li>
                <li>Right to non-discrimination for exercising your rights</li>
                <li>Right to correct inaccurate personal information</li>
                <li>Right to limit use of sensitive personal information</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong className="text-foreground">We do not sell or share your personal information</strong> as defined under CCPA/CPRA.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.3 How to Exercise Your Rights</h3>
              <p className="text-muted-foreground">To exercise any of these rights:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Email us at: <strong className="text-foreground">privacy@managevelocity.com</strong></li>
                <li>Use our data deletion request form at: <a href="/data-deletion" className="text-foreground underline hover:opacity-80">managevelocity.com/data-deletion</a></li>
                <li>Call us at: <strong className="text-foreground">(888) 555-0123</strong></li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We will respond to verifiable requests within 45 days (or as required by applicable law). We may need to verify your identity before processing your request.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@managevelocity.com. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
              </p>
            </section>

            {/* International Data Transfers */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Our Services are primarily operated in the United States. If you access our Services from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate. These countries may have data protection laws that differ from your country of residence.
              </p>
              <p className="text-muted-foreground mt-4">
                By using our Services, you consent to the transfer of your information to the United States and other countries as described in this Privacy Policy.
              </p>
            </section>

            {/* Do Not Track */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">13. Do Not Track Signals</h2>
              <p className="text-muted-foreground">
                Our Services do not currently respond to &quot;Do Not Track&quot; signals. However, you can manage your cookie preferences through your browser settings.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">14. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. For material changes, we will also notify you via email or through our Services.
              </p>
              <p className="text-muted-foreground mt-4">
                Your continued use of our Services after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact Us */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">15. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-4">
                <p className="text-foreground font-semibold">Velocity Labs, LLC</p>
                <p className="text-muted-foreground mt-2">
                  Email: <a href="mailto:privacy@managevelocity.com" className="text-foreground hover:underline">privacy@managevelocity.com</a><br />
                  Website: <a href="https://managevelocity.com" className="text-foreground hover:underline">managevelocity.com</a><br />
                  Data Deletion Requests: <a href="/data-deletion" className="text-foreground hover:underline">managevelocity.com/data-deletion</a>
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">16. Governing Law</h2>
              <p className="text-muted-foreground">
                This Privacy Policy is governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
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
            <div className="text-sm text-muted-foreground">&copy; 2026 Velocity Labs, LLC. All rights reserved.</div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</a>
              <a href="/tos" className="hover:text-foreground transition">Terms of Service</a>
              <a href="/sms-terms" className="hover:text-foreground transition">SMS Terms</a>
              <a href="/data-deletion" className="hover:text-foreground transition">Data Deletion</a>
              <a href="mailto:privacy@managevelocity.com" className="hover:text-foreground transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
