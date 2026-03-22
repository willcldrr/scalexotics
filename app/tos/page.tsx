'use client'

import Image from "next/image"

export default function TermsOfService() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">Effective Date: March 22, 2026 | Last Updated: March 22, 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">

            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;you&quot; or &quot;your&quot;) and Velocity Labs, LLC, a Florida limited liability company (&quot;Velocity Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Velocity Labs platform, website (managevelocity.com), applications, and related services (collectively, the &quot;Services&quot;).
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">BY ACCESSING OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY.</strong> If you do not agree to these Terms, you may not access or use our Services.
              </p>
              <p className="text-muted-foreground">
                If you are using the Services on behalf of a business or other legal entity, you represent that you have the authority to bind such entity to these Terms, in which case &quot;you&quot; and &quot;your&quot; shall refer to such entity.
              </p>
            </section>

            {/* Definitions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Definitions</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">&quot;Business User&quot;</strong> means a business entity or individual that subscribes to our Services to manage their vehicle rental operations.</li>
                <li><strong className="text-foreground">&quot;End User&quot;</strong> means an individual who interacts with a Business User through our platform (e.g., rental inquiries, bookings).</li>
                <li><strong className="text-foreground">&quot;User Content&quot;</strong> means any data, text, images, or other materials that you submit, upload, or transmit through the Services.</li>
                <li><strong className="text-foreground">&quot;Third-Party Services&quot;</strong> means external platforms integrated with our Services, including but not limited to Instagram, Facebook, Stripe, and Twilio.</li>
              </ul>
            </section>

            {/* Eligibility */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Eligibility</h2>
              <p className="text-muted-foreground">To use our Services, you must:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Be at least eighteen (18) years of age;</li>
                <li>Have the legal capacity to enter into a binding contract;</li>
                <li>Not be prohibited from using the Services under applicable law;</li>
                <li>Provide accurate and complete registration information; and</li>
                <li>Comply with all applicable laws and regulations.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                By using the Services, you represent and warrant that you meet all eligibility requirements.
              </p>
            </section>

            {/* Account Registration */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Account Registration and Security</h2>
              <h3 className="text-lg font-semibold text-foreground mt-4">4.1 Account Creation</h3>
              <p className="text-muted-foreground">
                To access certain features of the Services, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.2 Account Security</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use strong, unique passwords;</li>
                <li>Not share your account credentials with third parties;</li>
                <li>Notify us immediately of any unauthorized access or security breach; and</li>
                <li>Ensure that you log out of your account at the end of each session.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">4.3 Account Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion, with or without notice.
              </p>
            </section>

            {/* Services Description */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Description of Services</h2>
              <p className="text-muted-foreground">
                Velocity Labs provides a software-as-a-service (SaaS) platform for exotic and luxury car rental businesses, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Lead management and customer relationship management (CRM) tools;</li>
                <li>AI-powered automated messaging for SMS and social media (including Instagram Direct Messages);</li>
                <li>Booking and reservation management;</li>
                <li>Payment processing integration;</li>
                <li>Vehicle inventory management;</li>
                <li>Calendar synchronization; and</li>
                <li>Analytics and reporting.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the Services at any time, with or without notice.
              </p>
            </section>

            {/* Subscription and Billing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Subscription and Payment Terms</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.1 Subscription Plans</h3>
              <p className="text-muted-foreground">
                Access to certain features of the Services requires a paid subscription. Subscription plans, pricing, and features are described on our website and may be modified from time to time.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.2 Billing</h3>
              <p className="text-muted-foreground">
                By subscribing to a paid plan, you authorize us to charge the payment method on file for the applicable subscription fees on a recurring basis (monthly or annually, as selected). All fees are stated in U.S. dollars unless otherwise specified.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.3 Automatic Renewal</h3>
              <p className="text-muted-foreground">
                Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date. You may cancel your subscription at any time through your account settings or by contacting us.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.4 Refunds</h3>
              <p className="text-muted-foreground">
                All fees are non-refundable except as expressly stated in these Terms or as required by applicable law. If you believe you are entitled to a refund, please contact us at billing@managevelocity.com.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.5 Price Changes</h3>
              <p className="text-muted-foreground">
                We may change subscription prices upon thirty (30) days&apos; notice. Price changes will take effect at the start of your next billing period following the notice.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">6.6 Taxes</h3>
              <p className="text-muted-foreground">
                You are responsible for all applicable taxes associated with your use of the Services, excluding taxes based on our net income.
              </p>
            </section>

            {/* Third-Party Integrations */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Third-Party Services and Integrations</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">7.1 Instagram and Meta Integration</h3>
              <p className="text-muted-foreground">
                Our Services integrate with Instagram and other Meta platforms to provide messaging features. By connecting your Instagram account, you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Authorize us to access and use your Instagram Business or Creator account on your behalf;</li>
                <li>Agree to comply with Meta&apos;s Platform Terms and Community Guidelines;</li>
                <li>Acknowledge that Meta may modify or discontinue their APIs at any time, which may affect our Services;</li>
                <li>Accept responsibility for all content sent through your connected account.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">7.2 Payment Processing (Stripe)</h3>
              <p className="text-muted-foreground">
                Payment processing is provided by Stripe, Inc. By using payment features, you agree to Stripe&apos;s Services Agreement and Privacy Policy. We are not responsible for Stripe&apos;s services or any disputes related to payment processing.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">7.3 SMS Services (Twilio)</h3>
              <p className="text-muted-foreground">
                SMS messaging is provided through Twilio. You agree to use SMS features in compliance with all applicable laws, including the Telephone Consumer Protection Act (TCPA) and carrier guidelines.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">7.4 Third-Party Terms</h3>
              <p className="text-muted-foreground">
                Your use of Third-Party Services is subject to those providers&apos; terms and conditions. We are not responsible for the availability, accuracy, or content of Third-Party Services.
              </p>
            </section>

            {/* User Content */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. User Content and Conduct</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">8.1 Ownership</h3>
              <p className="text-muted-foreground">
                You retain ownership of all User Content you submit through the Services. By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, display, reproduce, and process such content solely for the purpose of providing and improving the Services.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">8.2 Responsibility</h3>
              <p className="text-muted-foreground">
                You are solely responsible for all User Content you submit and all activities conducted through your account. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You own or have the necessary rights to submit the User Content;</li>
                <li>The User Content does not infringe any third-party rights;</li>
                <li>The User Content complies with all applicable laws and these Terms.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">8.3 Prohibited Conduct</h3>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the Services for any unlawful purpose or in violation of any applicable laws;</li>
                <li>Send unsolicited messages (spam) or violate anti-spam laws;</li>
                <li>Harass, abuse, threaten, or intimidate any person;</li>
                <li>Impersonate any person or entity;</li>
                <li>Interfere with or disrupt the Services or servers;</li>
                <li>Attempt to gain unauthorized access to any part of the Services;</li>
                <li>Use automated means to access the Services without our permission;</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Services;</li>
                <li>Remove or alter any proprietary notices or labels;</li>
                <li>Use the Services to transmit malware or other harmful code; or</li>
                <li>Encourage or enable any other person to do any of the foregoing.</li>
              </ul>
            </section>

            {/* AI Services */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. AI-Powered Features</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">9.1 Nature of AI Services</h3>
              <p className="text-muted-foreground">
                Our Services include AI-powered features that generate automated responses to customer inquiries. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>AI-generated responses may not always be accurate or appropriate;</li>
                <li>You are responsible for reviewing and monitoring AI-generated content;</li>
                <li>AI features are provided &quot;as is&quot; without guarantees of accuracy or suitability.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">9.2 Your Responsibilities</h3>
              <p className="text-muted-foreground">
                You are responsible for configuring AI settings appropriately for your business and ensuring that AI-generated communications comply with applicable laws and regulations.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Intellectual Property Rights</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.1 Our Intellectual Property</h3>
              <p className="text-muted-foreground">
                The Services, including all software, designs, text, graphics, logos, trademarks, and other materials, are owned by or licensed to Velocity Labs and are protected by copyright, trademark, and other intellectual property laws. You may not use our intellectual property without our prior written consent.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.2 Limited License</h3>
              <p className="text-muted-foreground">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your internal business purposes. This license does not include the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Modify, copy, or create derivative works of the Services;</li>
                <li>Sell, resell, license, or sublicense the Services;</li>
                <li>Use the Services to build a competing product; or</li>
                <li>Remove or alter any proprietary notices.</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4">10.3 Feedback</h3>
              <p className="text-muted-foreground">
                If you provide feedback, suggestions, or ideas regarding the Services (&quot;Feedback&quot;), you grant us an unrestricted, perpetual, irrevocable, royalty-free license to use, modify, and incorporate such Feedback into our Services without compensation to you.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Disclaimers</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT;</li>
                <li>WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE;</li>
                <li>WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY INFORMATION OBTAINED THROUGH THE SERVICES; AND</li>
                <li>WARRANTIES REGARDING THIRD-PARTY SERVICES OR INTEGRATIONS.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                YOU USE THE SERVICES AT YOUR OWN RISK. WE DO NOT GUARANTEE ANY SPECIFIC RESULTS FROM YOUR USE OF THE SERVICES.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong>
              </p>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">12.1</strong> IN NO EVENT SHALL VELOCITY LABS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICES.
              </p>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">12.2</strong> OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNTS YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED U.S. DOLLARS ($100.00).
              </p>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">12.3</strong> THE LIMITATIONS IN THIS SECTION APPLY REGARDLESS OF THE THEORY OF LIABILITY (WHETHER CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-muted-foreground mt-4">
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </section>

            {/* Indemnification */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">13. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless Velocity Labs and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Your use of the Services;</li>
                <li>Your User Content;</li>
                <li>Your violation of these Terms;</li>
                <li>Your violation of any applicable law or regulation;</li>
                <li>Your violation of any third-party rights; or</li>
                <li>Any claim that your User Content caused damage to a third party.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We reserve the right to assume exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with our defense.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">14. Dispute Resolution</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">14.1 Informal Resolution</h3>
              <p className="text-muted-foreground">
                Before initiating any formal dispute resolution, you agree to contact us at legal@managevelocity.com and attempt to resolve the dispute informally for at least thirty (30) days.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">14.2 Binding Arbitration</h3>
              <p className="text-muted-foreground">
                If we cannot resolve a dispute informally, you and Velocity Labs agree to resolve any dispute, claim, or controversy arising out of or relating to these Terms or the Services through binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under its Commercial Arbitration Rules. The arbitration will be conducted in Miami-Dade County, Florida, unless you and we agree otherwise.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">14.3 Class Action Waiver</h3>
              <p className="text-muted-foreground">
                <strong className="text-foreground">YOU AND VELOCITY LABS AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.</strong> Unless both parties agree otherwise, the arbitrator may not consolidate more than one person&apos;s claims and may not preside over any form of representative or class proceeding.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">14.4 Exceptions</h3>
              <p className="text-muted-foreground">
                Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement of intellectual property rights.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">15. Governing Law and Jurisdiction</h2>
              <p className="text-muted-foreground">
                These Terms and any dispute arising out of or related to these Terms or the Services shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
              </p>
              <p className="text-muted-foreground mt-4">
                For any disputes not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in Miami-Dade County, Florida.
              </p>
            </section>

            {/* Termination */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">16. Termination</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">16.1 Termination by You</h3>
              <p className="text-muted-foreground">
                You may terminate your account at any time by canceling your subscription through your account settings or by contacting us at support@managevelocity.com.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">16.2 Termination by Us</h3>
              <p className="text-muted-foreground">
                We may suspend or terminate your access to the Services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">16.3 Effect of Termination</h3>
              <p className="text-muted-foreground">
                Upon termination: (a) your right to use the Services will immediately cease; (b) we may delete your account and User Content; and (c) all provisions of these Terms that should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
              </p>
            </section>

            {/* General Provisions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">17. General Provisions</h2>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.1 Entire Agreement</h3>
              <p className="text-muted-foreground">
                These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and Velocity Labs regarding the Services and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.2 Severability</h3>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be invalid or unenforceable, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.3 Waiver</h3>
              <p className="text-muted-foreground">
                Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.4 Assignment</h3>
              <p className="text-muted-foreground">
                You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.5 Force Majeure</h3>
              <p className="text-muted-foreground">
                We shall not be liable for any failure or delay in performing our obligations under these Terms due to causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor disputes, governmental actions, or internet service disruptions.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.6 Notices</h3>
              <p className="text-muted-foreground">
                We may provide notices to you via email, posting on the Services, or other reasonable means. You may provide notices to us at legal@managevelocity.com.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-4">17.7 No Third-Party Beneficiaries</h3>
              <p className="text-muted-foreground">
                These Terms do not create any third-party beneficiary rights in any person or entity.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">18. Changes to These Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last Updated&quot; date. For material changes, we will also provide notice via email or through the Services.
              </p>
              <p className="text-muted-foreground mt-4">
                Your continued use of the Services after the effective date of any changes constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">19. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-4">
                <p className="text-foreground font-semibold">Velocity Labs, LLC</p>
                <p className="text-muted-foreground mt-2">
                  Email: <a href="mailto:legal@managevelocity.com" className="text-foreground hover:underline">legal@managevelocity.com</a><br />
                  Support: <a href="mailto:support@managevelocity.com" className="text-foreground hover:underline">support@managevelocity.com</a><br />
                  Website: <a href="https://managevelocity.com" className="text-foreground hover:underline">managevelocity.com</a>
                </p>
              </div>
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
              <a href="mailto:legal@managevelocity.com" className="hover:text-foreground transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
