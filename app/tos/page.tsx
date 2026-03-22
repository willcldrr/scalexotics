"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, FileText, BookOpen, UserCheck, Shield, CreditCard, Link2, FileCode, Sparkles, Copyright, AlertTriangle, Scale, XCircle, Gavel, MapPin, LogOut, Settings, RefreshCw, Mail, ChevronUp } from "lucide-react"

const sections = [
  { id: "agreement", title: "Agreement to Terms", icon: FileText },
  { id: "definitions", title: "Definitions", icon: BookOpen },
  { id: "eligibility", title: "Eligibility", icon: UserCheck },
  { id: "account", title: "Account Security", icon: Shield },
  { id: "services", title: "Description of Services", icon: Settings },
  { id: "billing", title: "Subscription & Payment", icon: CreditCard },
  { id: "integrations", title: "Third-Party Integrations", icon: Link2 },
  { id: "content", title: "User Content & Conduct", icon: FileCode },
  { id: "ai", title: "AI-Powered Features", icon: Sparkles },
  { id: "ip", title: "Intellectual Property", icon: Copyright },
  { id: "disclaimers", title: "Disclaimers", icon: AlertTriangle },
  { id: "liability", title: "Limitation of Liability", icon: Scale },
  { id: "indemnification", title: "Indemnification", icon: Shield },
  { id: "disputes", title: "Dispute Resolution", icon: Gavel },
  { id: "governing", title: "Governing Law", icon: MapPin },
  { id: "termination", title: "Termination", icon: LogOut },
  { id: "general", title: "General Provisions", icon: Settings },
  { id: "changes", title: "Changes to Terms", icon: RefreshCw },
  { id: "contact", title: "Contact Information", icon: Mail },
]

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState("agreement")
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)

      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }))

      for (const section of sectionElements.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)", top: "-20%", right: "-10%" }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", bottom: "-10%", left: "-5%" }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/velocity.jpg" alt="Velocity Labs" width={120} height={36} className="h-9 w-auto" priority />
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Contents</h3>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeSection === section.id
                            ? "bg-white text-black font-medium shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 mb-6">
                <FileText className="w-4 h-4" />
                Legal Document
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
                Terms of Service
              </h1>
              <p className="text-white/50">
                Effective Date: March 22, 2026 · Last Updated: March 22, 2026
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {/* Agreement to Terms */}
              <section id="agreement" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and Velocity Labs, LLC, a Florida limited liability company (&quot;Velocity Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Velocity Labs platform, website (managevelocity.com), applications, and related services (collectively, the &quot;Services&quot;).
                  </p>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 font-medium">
                      BY ACCESSING OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY.
                    </p>
                  </div>
                  <p>
                    If you are using the Services on behalf of a business or other legal entity, you represent that you have the authority to bind such entity to these Terms.
                  </p>
                </div>
              </section>

              {/* Definitions */}
              <section id="definitions" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">2. Definitions</h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { term: "Business User", def: "A business entity or individual that subscribes to our Services to manage their vehicle rental operations." },
                    { term: "End User", def: "An individual who interacts with a Business User through our platform (e.g., rental inquiries, bookings)." },
                    { term: "User Content", def: "Any data, text, images, or other materials that you submit, upload, or transmit through the Services." },
                    { term: "Third-Party Services", def: "External platforms integrated with our Services, including Instagram, Facebook, Stripe, and Twilio." },
                  ].map((item) => (
                    <div key={item.term} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="font-medium text-white mb-1">&quot;{item.term}&quot;</p>
                      <p className="text-sm text-white/60">{item.def}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Eligibility */}
              <section id="eligibility" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">3. Eligibility</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">To use our Services, you must:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "Be at least 18 years of age",
                      "Have legal capacity to enter into a binding contract",
                      "Not be prohibited from using the Services under applicable law",
                      "Provide accurate and complete registration information",
                      "Comply with all applicable laws and regulations",
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                        <span className="text-sm">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Account Security */}
              <section id="account" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">4. Account Registration and Security</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Account Creation</h3>
                    <p>To access certain features of the Services, you must create an account. You agree to provide accurate, current, and complete information during registration.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Account Security</h3>
                    <p className="mb-3">You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Use strong, unique passwords</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Not share your account credentials with third parties</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Notify us immediately of any unauthorized access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Log out of your account at the end of each session</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Description of Services */}
              <section id="services" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">5. Description of Services</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">Velocity Labs provides a SaaS platform for exotic and luxury car rental businesses, including:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "Lead management and CRM tools",
                      "AI-powered automated messaging",
                      "Booking and reservation management",
                      "Payment processing integration",
                      "Vehicle inventory management",
                      "Calendar synchronization",
                      "Analytics and reporting",
                    ].map((service, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-white/50">
                    We reserve the right to modify, suspend, or discontinue any part of the Services at any time.
                  </p>
                </div>
              </section>

              {/* Subscription & Payment */}
              <section id="billing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold">6. Subscription and Payment Terms</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Billing</h3>
                      <p className="text-sm">By subscribing, you authorize us to charge your payment method for recurring fees (monthly or annually). All fees are in U.S. dollars.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Automatic Renewal</h3>
                      <p className="text-sm">Subscriptions automatically renew unless cancelled before the renewal date. Cancel anytime through account settings.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Refunds</h3>
                      <p className="text-sm">All fees are non-refundable except as expressly stated or required by law. Contact billing@managevelocity.com for refund requests.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Price Changes</h3>
                      <p className="text-sm">We may change prices with 30 days&apos; notice. Changes take effect at your next billing period.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Third-Party Integrations */}
              <section id="integrations" className="bg-gradient-to-br from-purple-500/[0.08] to-blue-500/[0.08] rounded-2xl border border-purple-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">7. Third-Party Services and Integrations</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <h3 className="font-medium text-purple-300 mb-2">Instagram and Meta Integration</h3>
                      <p className="text-sm text-white/60">By connecting your Instagram account, you authorize us to access and use your account on your behalf, agree to comply with Meta&apos;s Platform Terms, and accept responsibility for all content sent through your connected account.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <h3 className="font-medium text-blue-300 mb-2">Payment Processing (Stripe)</h3>
                      <p className="text-sm text-white/60">Payment processing is provided by Stripe, Inc. By using payment features, you agree to Stripe&apos;s Services Agreement and Privacy Policy.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <h3 className="font-medium text-emerald-300 mb-2">SMS Services (Twilio)</h3>
                      <p className="text-sm text-white/60">SMS messaging is provided through Twilio. You agree to use SMS features in compliance with all applicable laws, including TCPA.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Content & Conduct */}
              <section id="content" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">8. User Content and Conduct</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Ownership & License</h3>
                    <p>You retain ownership of all User Content. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use it solely for providing and improving the Services.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Prohibited Conduct</h3>
                    <p className="mb-3">You agree not to:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        "Use Services for unlawful purposes",
                        "Send unsolicited messages (spam)",
                        "Harass or intimidate any person",
                        "Impersonate any person or entity",
                        "Interfere with or disrupt Services",
                        "Attempt unauthorized access",
                        "Reverse engineer the Services",
                        "Transmit malware or harmful code",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* AI-Powered Features */}
              <section id="ai" className="bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.08] rounded-2xl border border-violet-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">9. AI-Powered Features</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>Our Services include AI-powered features that generate automated responses. You acknowledge that:</p>
                  <div className="grid gap-3 mt-4">
                    <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      <p className="text-sm">AI-generated responses may not always be accurate or appropriate</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      <p className="text-sm">You are responsible for reviewing and monitoring AI-generated content</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      <p className="text-sm">AI features are provided &quot;as is&quot; without guarantees of accuracy</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/50 mt-4">
                    You are responsible for configuring AI settings appropriately for your business.
                  </p>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="ip" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Copyright className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">10. Intellectual Property Rights</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    The Services, including all software, designs, text, graphics, logos, trademarks, and other materials, are owned by or licensed to Velocity Labs and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">Limited License</h3>
                    <p className="text-sm mb-3">We grant you a limited, non-exclusive, non-transferable, revocable license to use the Services. This license does not include the right to:</p>
                    <ul className="space-y-1 text-sm text-white/50">
                      <li>• Modify, copy, or create derivative works</li>
                      <li>• Sell, resell, license, or sublicense the Services</li>
                      <li>• Use the Services to build a competing product</li>
                      <li>• Remove or alter any proprietary notices</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Disclaimers */}
              <section id="disclaimers" className="bg-amber-500/[0.08] rounded-2xl border border-amber-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-semibold">11. Disclaimers</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 font-medium uppercase text-sm">
                      THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                    </p>
                  </div>
                  <p>To the fullest extent permitted by law, we disclaim all warranties, including:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                      <span>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                      <span>Warranties that the Services will be uninterrupted, error-free, or secure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                      <span>Warranties regarding the accuracy or reliability of any information</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">12. Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p className="font-medium text-white">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-sm">Velocity Labs shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, goodwill, data, or other intangible losses.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-sm">Our total aggregate liability shall not exceed the greater of: (a) amounts you paid in the 12 months preceding the claim; or (b) $100.00.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-sm">These limitations apply regardless of the theory of liability and even if we have been advised of the possibility of such damages.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Indemnification */}
              <section id="indemnification" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">13. Indemnification</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">You agree to indemnify and hold harmless Velocity Labs from any claims, damages, losses, liabilities, and expenses arising out of:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "Your use of the Services",
                      "Your User Content",
                      "Your violation of these Terms",
                      "Your violation of any applicable law",
                      "Your violation of third-party rights",
                      "Any claim that your content caused damage",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Dispute Resolution */}
              <section id="disputes" className="bg-red-500/[0.08] rounded-2xl border border-red-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold">14. Dispute Resolution</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <h3 className="font-medium text-white mb-2">Informal Resolution</h3>
                    <p className="text-sm">Before initiating formal dispute resolution, contact us at legal@managevelocity.com and attempt to resolve the dispute informally for at least 30 days.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <h3 className="font-medium text-white mb-2">Binding Arbitration</h3>
                    <p className="text-sm">If we cannot resolve a dispute informally, you agree to resolve any dispute through binding arbitration administered by the AAA under its Commercial Arbitration Rules, conducted in Miami-Dade County, Florida.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="font-medium text-red-300 mb-2">Class Action Waiver</h3>
                    <p className="text-sm text-white/70">YOU AND VELOCITY LABS AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.</p>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section id="governing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">15. Governing Law and Jurisdiction</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
                  </p>
                  <p className="mt-4">
                    For any disputes not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in Miami-Dade County, Florida.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section id="termination" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">16. Termination</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Termination by You</h3>
                      <p className="text-sm">You may terminate your account at any time by canceling your subscription through your account settings or by contacting support@managevelocity.com.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Termination by Us</h3>
                      <p className="text-sm">We may suspend or terminate your access immediately, without prior notice, for any reason, including if you breach these Terms.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">Effect of Termination</h3>
                      <p className="text-sm">Upon termination, your right to use the Services will cease, we may delete your account and content, and all provisions that should survive termination shall survive.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* General Provisions */}
              <section id="general" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">17. General Provisions</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { title: "Entire Agreement", desc: "These Terms constitute the entire agreement between you and Velocity Labs." },
                    { title: "Severability", desc: "If any provision is found invalid, remaining provisions remain in effect." },
                    { title: "Waiver", desc: "Our failure to enforce any right shall not constitute a waiver." },
                    { title: "Assignment", desc: "You may not assign these Terms without our consent." },
                    { title: "Force Majeure", desc: "We are not liable for failures due to causes beyond our control." },
                    { title: "Notices", desc: "We may provide notices via email or posting on the Services." },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="font-medium text-white mb-1">{item.title}</p>
                      <p className="text-sm text-white/50">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Changes to Terms */}
              <section id="changes" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">18. Changes to These Terms</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms and updating the &quot;Last Updated&quot; date. For material changes, we will also provide notice via email or through the Services.
                  </p>
                  <p className="mt-4">
                    Your continued use of the Services after the effective date constitutes your acceptance of the updated Terms.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section id="contact" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">19. Contact Information</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">If you have any questions about these Terms, please contact us:</p>
                  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="font-semibold text-white text-lg mb-3">Velocity Labs, LLC</p>
                    <div className="space-y-2 text-sm">
                      <p>Email: <a href="mailto:legal@managevelocity.com" className="text-blue-400 hover:underline">legal@managevelocity.com</a></p>
                      <p>Support: <a href="mailto:support@managevelocity.com" className="text-blue-400 hover:underline">support@managevelocity.com</a></p>
                      <p>Website: <a href="https://managevelocity.com" className="text-blue-400 hover:underline">managevelocity.com</a></p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/[0.08]">
              <div className="flex flex-wrap gap-4 text-sm text-white/40">
                <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/tos" className="hover:text-white transition">Terms of Service</Link>
                <Link href="/sms-terms" className="hover:text-white transition">SMS Terms</Link>
                <Link href="/data-deletion" className="hover:text-white transition">Data Deletion</Link>
              </div>
              <p className="mt-4 text-sm text-white/30">© 2026 Velocity Labs, LLC. All rights reserved.</p>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
