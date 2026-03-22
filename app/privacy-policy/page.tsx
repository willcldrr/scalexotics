"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Database, Instagram, MessageSquare, Share2, Clock, Lock, Cookie, UserCheck, Baby, Globe, Eye, RefreshCw, Mail, Scale, ChevronUp } from "lucide-react"

const sections = [
  { id: "introduction", title: "Introduction", icon: Shield },
  { id: "collection", title: "Information We Collect", icon: Database },
  { id: "usage", title: "How We Use Information", icon: UserCheck },
  { id: "instagram", title: "Instagram Integration", icon: Instagram },
  { id: "sms", title: "SMS Communications", icon: MessageSquare },
  { id: "sharing", title: "Data Sharing", icon: Share2 },
  { id: "retention", title: "Data Retention", icon: Clock },
  { id: "security", title: "Data Security", icon: Lock },
  { id: "cookies", title: "Cookies & Tracking", icon: Cookie },
  { id: "rights", title: "Your Privacy Rights", icon: UserCheck },
  { id: "children", title: "Children's Privacy", icon: Baby },
  { id: "international", title: "International Transfers", icon: Globe },
  { id: "dnt", title: "Do Not Track", icon: Eye },
  { id: "changes", title: "Policy Changes", icon: RefreshCw },
  { id: "contact", title: "Contact Us", icon: Mail },
  { id: "governing", title: "Governing Law", icon: Scale },
]

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("introduction")
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
        <div className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)", top: "-20%", left: "-10%" }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", bottom: "-10%", right: "-5%" }} />
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
              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
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
                <Shield className="w-4 h-4" />
                Legal Document
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
                Privacy Policy
              </h1>
              <p className="text-white/50">
                Effective Date: March 22, 2026 · Last Updated: March 22, 2026
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {/* Introduction */}
              <section id="introduction" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">1. Introduction</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Velocity Labs, LLC (&quot;Velocity Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a Florida limited liability company providing software-as-a-service (&quot;SaaS&quot;) solutions for exotic and luxury car rental businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website (managevelocity.com), mobile applications, and related services (collectively, the &quot;Services&quot;).
                  </p>
                  <p>
                    This Privacy Policy applies to: (a) business users who subscribe to our platform (&quot;Business Users&quot;); and (b) end consumers who interact with our Business Users through our platform (&quot;End Users&quot;). By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium">
                      If you do not agree with this Privacy Policy, please do not access or use our Services.
                    </p>
                  </div>
                </div>
              </section>

              {/* Information We Collect */}
              <section id="collection" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Database className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">2. Information We Collect</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.1 Information You Provide Directly</h3>
                    <p className="mb-3">We collect information you voluntarily provide, including:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Account Information:</strong> Name, email address, phone number, business name, billing address, and payment information.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Profile Information:</strong> Business details, logo, vehicle inventory, pricing, availability, and service descriptions.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Communications:</strong> Messages through our platform, including SMS/text messages, Instagram Direct Messages, and other channels.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Booking Information:</strong> Rental dates, vehicle preferences, customer names, contact information, and payment details.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Consent Records:</strong> Records of your consent to receive communications, including SMS opt-in timestamps.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.2 Information Collected Automatically</h3>
                    <p className="mb-3">When you access our Services, we automatically collect:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Usage Information:</strong> Pages visited, features used, clickstream data, access times, and referring URLs.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Location Information:</strong> General geographic location based on IP address.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.3 Information from Third-Party Platforms</h3>
                    <p className="mb-3">When you connect third-party accounts to our Services, we receive information from those platforms:</p>
                    <div className="grid gap-3 mt-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <p className="font-medium text-purple-300 mb-1">Instagram/Meta</p>
                        <p className="text-sm text-white/60">Access tokens, account ID, username, and Direct Message capabilities</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="font-medium text-blue-300 mb-1">Stripe</p>
                        <p className="text-sm text-white/60">Payment processing information, transaction history, and payout details</p>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="font-medium text-emerald-300 mb-1">Twilio</p>
                        <p className="text-sm text-white/60">SMS delivery status, phone number verification, and message logs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section id="usage" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
                </div>
                <div className="grid gap-4 text-white/70">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">To Provide Services</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Process account registration and authentication</li>
                      <li>• Facilitate bookings, payments, and transactions</li>
                      <li>• Enable communication between Business Users and End Users</li>
                      <li>• Provide AI-powered automated responses</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">To Improve Services</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Analyze usage patterns to improve functionality</li>
                      <li>• Customize user experience based on preferences</li>
                      <li>• Train and improve our AI models (using de-identified data)</li>
                      <li>• Develop new features and services</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">To Communicate</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Send transactional emails and notifications</li>
                      <li>• Provide customer support</li>
                      <li>• Send marketing communications (with consent)</li>
                      <li>• Notify of changes to Services or policies</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">For Security & Compliance</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Detect and prevent fraud and abuse</li>
                      <li>• Enforce our Terms of Service</li>
                      <li>• Comply with legal obligations</li>
                      <li>• Respond to legal requests</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Instagram Integration */}
              <section id="instagram" className="bg-gradient-to-br from-purple-500/[0.08] to-pink-500/[0.08] rounded-2xl border border-purple-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">4. Instagram and Social Media Integration</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Our Services integrate with Instagram and other social media platforms to provide automated messaging capabilities.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Data We Access from Instagram</h3>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        <span>Instagram Business/Creator account ID and username</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        <span>Connected Facebook Page information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        <span>Direct Message conversations (read and write access)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        <span>Basic profile information of users who message the account</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-medium">
                      We comply with Meta&apos;s Platform Terms. We do not sell Instagram data to third parties or share it with data brokers.
                    </p>
                  </div>
                </div>
              </section>

              {/* SMS Communications */}
              <section id="sms" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold">5. SMS/Text Message Communications</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Information Collected for SMS</h3>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <span>Mobile phone number and consent timestamp</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <span>Opt-in/opt-out status and history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <span>Message content and delivery status</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-300 font-medium mb-2">We do not sell your phone number or SMS consent data.</p>
                    <p className="text-white/60 text-sm">Phone numbers are shared only with Twilio for message delivery and with the specific Business User you are communicating with.</p>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-white mb-3">Opting Out of SMS</h3>
                    <p className="mb-2">You can stop receiving text messages at any time by:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Replying <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">STOP</strong> to any message</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Contacting us at privacy@managevelocity.com</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="sharing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">6. Data Sharing and Disclosure</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>We may share your information in the following circumstances:</p>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">With Service Providers</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {["Supabase", "Vercel", "Twilio", "Stripe", "Anthropic", "Meta"].map((provider) => (
                        <div key={provider} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                          <span className="text-sm text-white/80">{provider}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-300 font-medium">We do not sell your personal information to third parties.</p>
                    <p className="text-white/60 text-sm mt-1">We do not share your information with data brokers or for third-party advertising purposes.</p>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section id="retention" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">7. Data Retention</h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { type: "Account Data", period: "7 years", reason: "Legal and tax purposes" },
                    { type: "Transaction Records", period: "7 years", reason: "IRS requirements" },
                    { type: "SMS Consent Records", period: "4 years", reason: "TCPA requirements" },
                    { type: "Communication Logs", period: "2 years", reason: "Until deletion requested" },
                    { type: "Access Tokens", period: "While active", reason: "Deleted upon disconnection" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div>
                        <p className="font-medium text-white">{item.type}</p>
                        <p className="text-sm text-white/50">{item.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-white/80">{item.period}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Data Security */}
              <section id="security" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">8. Data Security</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">We implement appropriate technical and organizational measures to protect your information:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { title: "Encryption", desc: "TLS 1.2+ in transit, AES-256 at rest" },
                      { title: "Access Controls", desc: "Authentication requirements" },
                      { title: "Monitoring", desc: "Regular security assessments" },
                      { title: "Training", desc: "Employee data protection training" },
                    ].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-1">{item.title}</p>
                        <p className="text-sm text-white/50">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">9. Cookies and Tracking Technologies</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">We use cookies and similar technologies to:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Maintain your session and authentication status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Remember your preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Analyze usage patterns and improve our Services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Prevent fraud and enhance security</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-white/50">You can control cookies through your browser settings. Disabling cookies may affect functionality.</p>
                </div>
              </section>

              {/* Your Rights */}
              <section id="rights" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">10. Your Privacy Rights</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { right: "Access", desc: "Request a copy of your personal information" },
                      { right: "Correction", desc: "Request correction of inaccurate information" },
                      { right: "Deletion", desc: "Request deletion of your personal information" },
                      { right: "Portability", desc: "Request your data in a portable format" },
                    ].map((item) => (
                      <div key={item.right} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-1">{item.right}</p>
                        <p className="text-sm text-white/50">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h3 className="font-medium text-blue-300 mb-2">California Residents (CCPA/CPRA)</h3>
                    <p className="text-sm text-white/60">
                      California residents have additional rights including the right to know what personal information is collected, right to delete, right to opt out of sale/sharing, and right to non-discrimination. <strong className="text-white">We do not sell or share your personal information.</strong>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">How to Exercise Your Rights</h3>
                    <div className="space-y-2">
                      <p>• Email us at: <strong className="text-white">privacy@managevelocity.com</strong></p>
                      <p>• Use our <Link href="/data-deletion" className="text-blue-400 hover:underline">data deletion request form</Link></p>
                    </div>
                    <p className="mt-3 text-sm text-white/50">We will respond to verifiable requests within 45 days.</p>
                  </div>
                </div>
              </section>

              {/* Children's Privacy */}
              <section id="children" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Baby className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">11. Children&apos;s Privacy</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@managevelocity.com.
                  </p>
                </div>
              </section>

              {/* International Transfers */}
              <section id="international" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">12. International Data Transfers</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    Our Services are primarily operated in the United States. If you access our Services from outside the United States, your information may be transferred to, stored, and processed in the United States. By using our Services, you consent to the transfer of your information to the United States.
                  </p>
                </div>
              </section>

              {/* Do Not Track */}
              <section id="dnt" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">13. Do Not Track Signals</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    Our Services do not currently respond to &quot;Do Not Track&quot; signals. However, you can manage your cookie preferences through your browser settings.
                  </p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section id="changes" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">14. Changes to This Privacy Policy</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy and updating the &quot;Last Updated&quot; date. For material changes, we will also notify you via email or through our Services.
                  </p>
                </div>
              </section>

              {/* Contact Us */}
              <section id="contact" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">15. Contact Us</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
                  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="font-semibold text-white text-lg mb-3">Velocity Labs, LLC</p>
                    <div className="space-y-2 text-sm">
                      <p>Email: <a href="mailto:privacy@managevelocity.com" className="text-blue-400 hover:underline">privacy@managevelocity.com</a></p>
                      <p>Website: <a href="https://managevelocity.com" className="text-blue-400 hover:underline">managevelocity.com</a></p>
                      <p>Data Deletion: <Link href="/data-deletion" className="text-blue-400 hover:underline">managevelocity.com/data-deletion</Link></p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section id="governing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">16. Governing Law</h2>
                </div>
                <div className="text-white/70 leading-relaxed">
                  <p>
                    This Privacy Policy is governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
                  </p>
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
