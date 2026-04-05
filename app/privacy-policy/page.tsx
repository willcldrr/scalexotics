"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Database, Instagram, MessageSquare, Share2, Clock, Lock, Cookie, UserCheck, Baby, Globe, Eye, RefreshCw, Mail, Scale, ChevronUp, ChevronDown } from "lucide-react"

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
  const [isContentsOpen, setIsContentsOpen] = useState(false)

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
          {/* Mobile Contents Dropdown */}
          <div className="lg:hidden mb-8">
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] overflow-hidden">
              <button
                onClick={() => setIsContentsOpen(!isContentsOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Contents</h3>
                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-300 ${isContentsOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isContentsOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"}`}>
                <nav className="space-y-1 px-4 pb-4 overflow-y-auto max-h-[50vh]">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          scrollToSection(section.id)
                          setIsContentsOpen(false)
                        }}
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
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 max-h-[calc(100vh-8rem)] overflow-hidden">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Contents</h3>
                <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
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
                  <h2 className="text-xl font-semibold">1. Introduction and Scope</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Velocity Labs, LLC (&quot;Velocity Labs,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a Florida limited liability company committed to protecting your privacy and ensuring the security of your personal information. We provide software-as-a-service (&quot;SaaS&quot;) solutions specifically designed for exotic and luxury car rental businesses, enabling them to manage customer relationships, process bookings, and streamline operations.
                  </p>
                  <p>
                    This Privacy Policy (&quot;Policy&quot;) describes in detail how we collect, use, process, disclose, retain, and safeguard your personal information when you access or use our platform, website located at managevelocity.com, mobile applications, application programming interfaces (APIs), and all related services, features, and functionalities (collectively, the &quot;Services&quot;). This Policy also explains your rights regarding your personal information and how you can exercise those rights.
                  </p>
                  <p>
                    This Privacy Policy applies to: (a) business users who subscribe to our platform to manage their vehicle rental operations (&quot;Business Users&quot;); (b) employees, agents, and representatives of Business Users who access the Services on behalf of the Business User; and (c) end consumers who interact with Business Users through our platform, including individuals who submit rental inquiries, make bookings, or receive communications (&quot;End Users&quot;). The specific data we collect and how we use it may vary depending on your relationship with us.
                  </p>
                  <p>
                    We are committed to processing your personal information in accordance with applicable privacy laws and regulations, including but not limited to the California Consumer Privacy Act (CCPA), the California Privacy Rights Act (CPRA), the General Data Protection Regulation (GDPR) where applicable, and other federal, state, and international privacy requirements.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium">
                      PLEASE READ THIS PRIVACY POLICY CAREFULLY. BY ACCESSING OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS PRIVACY POLICY. IF YOU DO NOT AGREE WITH THE TERMS OF THIS PRIVACY POLICY, PLEASE DO NOT ACCESS OR USE OUR SERVICES.
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
                  <p>
                    We collect various types of information from and about you and your use of our Services. The categories of information we collect depend on how you interact with us and which Services you use. Below is a comprehensive description of the information we may collect:
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.1 Information You Provide Directly</h3>
                    <p className="mb-3">We collect information that you voluntarily provide to us when you register for an account, subscribe to our Services, make a purchase, contact us for support, or otherwise communicate with us. This information may include:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Account and Registration Information:</strong> Full legal name, email address, telephone number, business name or DBA, business address, billing address, tax identification numbers, and account credentials (username and password).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Business Profile Information:</strong> Business description, company logo and branding materials, vehicle inventory details (make, model, year, specifications, photos), pricing schedules, availability calendars, service area information, and terms of service.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Payment and Financial Information:</strong> Credit card numbers, debit card numbers, bank account information, billing history, transaction records, and payout preferences. Note that payment card data is processed and stored by our PCI-compliant payment processor, Stripe, and we do not store full payment card numbers on our systems.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Communications and Correspondence:</strong> All messages, emails, and communications exchanged through our platform, including SMS/text messages, Instagram Direct Messages, email correspondence, in-app messages, and customer support tickets.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Booking and Transaction Information:</strong> Rental inquiry details, reservation dates and times, vehicle selection preferences, driver information, rental agreements, transaction amounts, payment confirmations, and rental history.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Consent Records and Preferences:</strong> Records of consent for communications, SMS opt-in and opt-out timestamps, marketing preferences, communication channel preferences, and privacy setting selections.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">User-Generated Content:</strong> Any content you create, upload, or share through the Services, including photographs, videos, reviews, comments, and other materials.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.2 Information Collected Automatically</h3>
                    <p className="mb-3">When you access, browse, or use our Services, we automatically collect certain technical and usage information through cookies, web beacons, log files, and other tracking technologies. This information includes:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Device and Technical Information:</strong> IP address, device type and model, operating system and version, browser type and version, screen resolution, device identifiers (such as IDFA or GAID), hardware model, and mobile network information.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Usage and Activity Information:</strong> Pages and screens viewed, features accessed and used, actions taken within the Services, clickstream data, navigation paths, search queries, access dates and times, session duration, referring URLs, and exit pages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Location Information:</strong> General geographic location based on IP address geolocation, time zone settings, and language preferences. We do not collect precise GPS location data without your explicit consent.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Log Data:</strong> Server logs that record information about your requests to our servers, including timestamp, request type, response status, and system activity.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.3 Information from Third-Party Platforms and Integrations</h3>
                    <p className="mb-3">When you connect third-party accounts or use third-party integrations with our Services, we may receive information from those platforms in accordance with the permissions you grant and the third party&apos;s privacy practices:</p>
                    <div className="grid gap-3 mt-4">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-2">Instagram/Meta Platform</p>
                        <p className="text-sm text-white/60">When you connect your Instagram Business or Creator account, we receive: access tokens and refresh tokens for API authentication, Instagram account ID and username, connected Facebook Page information, Direct Message conversations (read and write access), basic profile information of users who message your account, and message delivery status. We use this information to enable automated messaging features and customer engagement through Instagram.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-2">Stripe Payment Services</p>
                        <p className="text-sm text-white/60">When you enable payment features, we receive information from Stripe including: connected account status and verification information, transaction details and payment confirmations, payout information and transfer records, dispute and chargeback notifications, and account balance information. Stripe processes and stores all sensitive payment card data in accordance with PCI-DSS requirements.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-2">Twilio Communications</p>
                        <p className="text-sm text-white/60">When you use SMS features, we receive information from Twilio including: phone number verification status, SMS delivery status and receipts, carrier information, message segment counts, and error notifications. Message content is transmitted through Twilio&apos;s infrastructure for delivery to recipients.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-2">AI Service Providers</p>
                        <p className="text-sm text-white/60">When you use AI-powered features, conversation data may be processed by our AI service providers (including Anthropic) to generate responses. We implement appropriate data processing agreements and security measures with these providers to protect your information.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">2.4 Information from Other Sources</h3>
                    <p>We may also collect information about you from other sources, including publicly available information, information from our business partners, and information from data providers. We may combine information we collect from these sources with information we receive from you.</p>
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
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    We use the information we collect for various purposes, all of which are designed to provide, maintain, and improve our Services, communicate with you, and ensure the security and integrity of our platform. Below is a detailed description of how we use your information:
                  </p>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-3">3.1 To Provide, Operate, and Maintain the Services</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Process account registration, authentication, and account management</li>
                        <li>• Facilitate bookings, reservations, payments, and financial transactions</li>
                        <li>• Enable communication between Business Users and their customers (End Users)</li>
                        <li>• Provide AI-powered automated messaging and response capabilities</li>
                        <li>• Process and fulfill customer service requests and support tickets</li>
                        <li>• Manage vehicle inventory, pricing, and availability information</li>
                        <li>• Generate invoices, receipts, and financial documentation</li>
                        <li>• Synchronize calendars and scheduling across integrated platforms</li>
                        <li>• Deliver SMS messages and other communications on your behalf</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-3">3.2 To Improve, Personalize, and Develop the Services</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Analyze usage patterns, trends, and preferences to improve functionality and user experience</li>
                        <li>• Customize and personalize content, features, and recommendations based on your preferences</li>
                        <li>• Train, improve, and enhance our AI and machine learning models using anonymized and de-identified data</li>
                        <li>• Develop, test, and implement new products, features, and services</li>
                        <li>• Conduct research and analysis to better understand user needs and behaviors</li>
                        <li>• Perform A/B testing and experimentation to optimize the Services</li>
                        <li>• Generate aggregated, anonymized statistics and analytics for internal reporting</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-3">3.3 To Communicate With You</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Send transactional emails, including account confirmations, password resets, and payment receipts</li>
                        <li>• Provide customer support and respond to your inquiries and requests</li>
                        <li>• Send service-related announcements, updates, and notifications</li>
                        <li>• Deliver marketing and promotional communications (where you have consented)</li>
                        <li>• Notify you of changes to our Services, Terms of Service, or this Privacy Policy</li>
                        <li>• Send surveys and request feedback to improve our Services</li>
                        <li>• Communicate about your account status, billing, and subscription information</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-3">3.4 For Security, Fraud Prevention, and Legal Compliance</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Detect, prevent, investigate, and respond to fraud, abuse, and security threats</li>
                        <li>• Protect the security and integrity of our Services, systems, and infrastructure</li>
                        <li>• Enforce our Terms of Service, Acceptable Use Policy, and other agreements</li>
                        <li>• Verify your identity and prevent unauthorized access to your account</li>
                        <li>• Comply with applicable legal obligations, regulations, and industry standards</li>
                        <li>• Respond to lawful requests from law enforcement, government agencies, and courts</li>
                        <li>• Protect the rights, property, and safety of Velocity Labs, our users, and the public</li>
                        <li>• Investigate and resolve disputes and enforce our legal rights</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-3">3.5 Legal Bases for Processing (GDPR)</h3>
                      <p className="text-sm mb-2">For users in the European Economic Area (EEA), we process your personal data based on the following legal bases:</p>
                      <ul className="space-y-1 text-sm">
                        <li>• <strong className="text-white">Contractual Necessity:</strong> Processing necessary to perform our contract with you or take steps at your request before entering into a contract</li>
                        <li>• <strong className="text-white">Legitimate Interests:</strong> Processing necessary for our legitimate business interests, provided those interests do not override your fundamental rights</li>
                        <li>• <strong className="text-white">Legal Obligations:</strong> Processing necessary to comply with our legal obligations</li>
                        <li>• <strong className="text-white">Consent:</strong> Processing based on your specific, informed, and freely given consent</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Instagram Integration */}
              <section id="instagram" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white/60" />
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
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Instagram Business/Creator account ID and username</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Connected Facebook Page information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Direct Message conversations (read and write access)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Basic profile information of users who message the account</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-white/80 text-sm font-medium">
                      We comply with Meta&apos;s Platform Terms. We do not sell Instagram data to third parties or share it with data brokers.
                    </p>
                  </div>
                </div>
              </section>

              {/* SMS Communications */}
              <section id="sms" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">5. SMS/Text Message Communications</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Information Collected for SMS</h3>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Mobile phone number and consent timestamp</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Opt-in/opt-out status and history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Message content and delivery status</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium mb-2">We do not sell your phone number or SMS consent data.</p>
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
                        <span>Contacting us at info@managevelocity.com</span>
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
                  <h2 className="text-xl font-semibold">6. Data Sharing, Disclosure, and Third-Party Transfers</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    We may share, disclose, or transfer your personal information in the circumstances described below. We require all third parties to respect the security of your personal information and to treat it in accordance with applicable law.
                  </p>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">6.1 Service Providers and Vendors</h3>
                    <p className="mb-3">We share your information with third-party service providers who perform services on our behalf. These providers are contractually obligated to use your information only for the purposes we specify and to maintain appropriate security measures:</p>
                    <div className="grid gap-3 mt-4">
                      {[
                        { name: "Supabase", desc: "Database hosting, authentication, and backend infrastructure services" },
                        { name: "Vercel", desc: "Web hosting, content delivery, and serverless function execution" },
                        { name: "Twilio", desc: "SMS messaging, phone number provisioning, and telecommunications services" },
                        { name: "Stripe", desc: "Payment processing, financial transactions, and payout management" },
                        { name: "Anthropic", desc: "AI and machine learning services for automated messaging features" },
                        { name: "Meta Platforms", desc: "Instagram API integration for social media messaging capabilities" },
                      ].map((provider) => (
                        <div key={provider.name} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <span className="text-sm font-medium text-white">{provider.name}</span>
                          <p className="text-xs text-white/50 mt-1">{provider.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">6.2 Business Users and Their Customers</h3>
                    <p>
                      If you are an End User communicating with a Business User through our platform, your messages, contact information, and inquiry details may be shared with that Business User as necessary to facilitate the communication and transaction. Business Users are responsible for their own privacy practices regarding your information.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">6.3 Business Transfers</h3>
                    <p>
                      In the event of a merger, acquisition, reorganization, bankruptcy, dissolution, sale of assets, or other business transaction involving all or a portion of our business, your personal information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">6.4 Legal Requirements and Protection of Rights</h3>
                    <p className="mb-3">
                      We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency). We may also disclose your information when we believe in good faith that disclosure is necessary to:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Comply with a legal obligation, subpoena, court order, or legal process</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Protect and defend the rights, property, or safety of Velocity Labs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Prevent or investigate possible wrongdoing in connection with the Services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Protect the personal safety of users or the public</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Protect against legal liability</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">6.5 With Your Consent</h3>
                    <p>
                      We may share your information for other purposes with your explicit consent or at your direction.
                    </p>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium mb-2">We Do Not Sell Your Personal Information</p>
                    <p className="text-white/60 text-sm">Velocity Labs does not sell, rent, or lease your personal information to third parties for their marketing purposes. We do not share your information with data brokers or for third-party advertising purposes. We do not engage in the &quot;sale&quot; or &quot;sharing&quot; of personal information as those terms are defined under the California Consumer Privacy Act (CCPA/CPRA).</p>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section id="retention" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">7. Data Retention Policies and Schedules</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, contractual, or reporting requirements. When determining the appropriate retention period, we consider the amount, nature, and sensitivity of the information, the potential risk of harm from unauthorized use or disclosure, the purposes for which we process the information, applicable legal requirements, and whether we can achieve those purposes through other means.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">7.1 Retention Schedule by Data Category</h3>
                    <div className="grid gap-3">
                      {[
                        { type: "Account and Profile Data", period: "Duration of account + 7 years", reason: "Legal, tax, and audit requirements under IRS regulations" },
                        { type: "Financial and Transaction Records", period: "7 years from transaction date", reason: "IRS record-keeping requirements and statute of limitations" },
                        { type: "SMS Consent and Opt-In Records", period: "4 years from date of consent", reason: "TCPA compliance and FCC requirements for consent documentation" },
                        { type: "Communication Logs and Messages", period: "2 years or until deletion requested", reason: "Customer service, dispute resolution, and legal compliance" },
                        { type: "Third-Party Access Tokens", period: "Duration of integration connection", reason: "Immediately deleted upon disconnection or revocation" },
                        { type: "Usage Analytics and Logs", period: "24 months from collection", reason: "Service improvement, troubleshooting, and security monitoring" },
                        { type: "Support Tickets and Correspondence", period: "3 years from resolution", reason: "Quality assurance and potential dispute resolution" },
                        { type: "Marketing Preferences", period: "Duration of account + 2 years", reason: "Compliance with marketing consent requirements" },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex-1">
                            <p className="font-medium text-white">{item.type}</p>
                            <p className="text-sm text-white/50">{item.reason}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-sm font-medium text-white/80">{item.period}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">7.2 Data Deletion</h3>
                    <p>
                      When your personal information is no longer needed for the purposes for which it was collected, or when you request deletion of your data, we will securely delete or anonymize it in accordance with our data retention policies. However, we may retain certain information for longer periods where required by law, for legitimate business purposes, or to resolve disputes.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="security" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">8. Data Security Measures and Safeguards</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    Velocity Labs takes the security of your personal information seriously. We have implemented comprehensive technical, administrative, and physical security measures designed to protect your information from unauthorized access, use, alteration, disclosure, or destruction. While no system can guarantee absolute security, we employ industry-standard practices to minimize risks.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.1 Technical Security Measures</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { title: "Encryption in Transit", desc: "All data transmitted between your device and our servers is encrypted using TLS 1.2 or higher protocols with strong cipher suites" },
                        { title: "Encryption at Rest", desc: "Sensitive data stored in our databases is encrypted using AES-256 encryption algorithms" },
                        { title: "Access Controls", desc: "Role-based access controls (RBAC) limit access to personal information on a need-to-know basis" },
                        { title: "Authentication", desc: "Multi-factor authentication (MFA) options, secure password hashing (bcrypt), and session management" },
                        { title: "Network Security", desc: "Firewalls, intrusion detection systems, DDoS protection, and regular vulnerability scanning" },
                        { title: "Secure Infrastructure", desc: "Hosting on SOC 2 Type II compliant infrastructure with geographic redundancy" },
                      ].map((item) => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="font-medium text-white mb-1">{item.title}</p>
                          <p className="text-sm text-white/50">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.2 Administrative Security Measures</h3>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Employee Training:</strong> All employees receive regular training on data protection, privacy regulations, and security best practices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Background Checks:</strong> Employees with access to personal information undergo appropriate background screening</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Security Assessments:</strong> Regular internal and external security audits, penetration testing, and vulnerability assessments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Incident Response:</strong> Documented incident response procedures to quickly address any security events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Vendor Management:</strong> Due diligence and contractual requirements for third-party service providers handling personal information</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.3 Third-Party Security Compliance</h3>
                    <p>
                      Our key service providers maintain industry-standard security certifications and compliance: Stripe maintains PCI-DSS Level 1 compliance for payment processing; Supabase and Vercel maintain SOC 2 Type II compliance for infrastructure; Twilio maintains SOC 2 Type II compliance and is registered with the FCC for telecommunications services.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.4 Data Breach Notification</h3>
                    <p>
                      In the event of a data breach affecting your personal information, we will notify you and relevant regulatory authorities in accordance with applicable laws. We will provide timely information about the nature of the breach, the types of information involved, the steps we are taking to address the breach, and recommendations for you to protect yourself.
                    </p>
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
                  <h2 className="text-xl font-semibold">10. Your Privacy Rights and Choices</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    Depending on your location and applicable law, you may have certain rights regarding your personal information. We are committed to honoring these rights and providing you with control over your personal data.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.1 Your Rights Under Applicable Privacy Laws</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { right: "Right of Access", desc: "Request confirmation of whether we process your personal information and obtain a copy of your data" },
                        { right: "Right to Correction", desc: "Request correction or update of inaccurate or incomplete personal information we hold about you" },
                        { right: "Right to Deletion", desc: "Request deletion of your personal information, subject to certain legal exceptions and retention requirements" },
                        { right: "Right to Data Portability", desc: "Request a copy of your personal information in a structured, commonly used, machine-readable format" },
                        { right: "Right to Restrict Processing", desc: "Request that we limit the processing of your personal information under certain circumstances" },
                        { right: "Right to Object", desc: "Object to processing of your personal information for direct marketing or based on legitimate interests" },
                        { right: "Right to Withdraw Consent", desc: "Withdraw your consent at any time where we rely on consent as the legal basis for processing" },
                        { right: "Right to Non-Discrimination", desc: "Not be discriminated against for exercising any of your privacy rights" },
                      ].map((item) => (
                        <div key={item.right} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="font-medium text-white mb-1">{item.right}</p>
                          <p className="text-sm text-white/50">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-3">10.2 California Residents (CCPA/CPRA)</h3>
                    <p className="text-sm text-white/60 mb-3">
                      If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Right to Know:</strong> The categories and specific pieces of personal information we have collected about you</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Right to Correct:</strong> Request correction of inaccurate personal information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Right to Opt-Out:</strong> Opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information (we do not sell or share your data)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Right to Limit Use:</strong> Limit the use and disclosure of sensitive personal information</span>
                      </li>
                    </ul>
                    <p className="text-sm mt-3"><strong className="text-white">We do not sell or share your personal information as defined under CCPA/CPRA.</strong></p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-3">10.3 Nevada Residents</h3>
                    <p className="text-sm text-white/60">
                      Nevada residents may opt out of the sale of certain covered information. We do not sell your personal information. If you are a Nevada resident and have questions, contact us at info@managevelocity.com.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.4 How to Exercise Your Rights</h3>
                    <p className="mb-3">You can exercise your privacy rights through the following methods:</p>
                    <div className="space-y-2">
                      <p>• <strong className="text-white">Email:</strong> Submit a request to <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      <p>• <strong className="text-white">Online Form:</strong> Use our <Link href="/data-deletion" className="text-white/80 hover:underline">data deletion request form</Link></p>
                      <p>• <strong className="text-white">Account Settings:</strong> Manage certain preferences directly in your dashboard</p>
                    </div>
                    <p className="mt-4 text-sm text-white/50">
                      We will verify your identity before processing your request. For certain requests, we may require you to provide additional information to verify that you are who you claim to be. We will respond to verifiable requests within 45 days (or 30 days for GDPR requests). If we need additional time, we will notify you of the extension and the reason.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.5 Authorized Agents</h3>
                    <p className="text-sm">
                      You may designate an authorized agent to make requests on your behalf. If you use an authorized agent, we may require: (a) signed written permission from you authorizing the agent; (b) verification of your identity; and (c) direct confirmation that you provided the agent permission to submit the request.
                    </p>
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
                    Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at info@managevelocity.com.
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
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Velocity Labs is headquartered in the United States, and our Services are primarily operated, hosted, and managed from the United States. If you access our Services from a location outside the United States, please be aware that your personal information may be transferred to, stored, processed, and maintained in the United States and other countries where our service providers operate.
                  </p>
                  <p>
                    The data protection and privacy laws of the United States and other countries may differ from those of your country of residence. By accessing or using our Services, or by providing us with your personal information, you acknowledge and consent to the transfer, storage, and processing of your information in the United States and other jurisdictions as described in this Privacy Policy.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">12.1 Safeguards for International Transfers</h3>
                    <p className="mb-3">
                      When we transfer personal information from the European Economic Area (EEA), United Kingdom (UK), or Switzerland to countries that have not been deemed to provide an adequate level of data protection, we implement appropriate safeguards, which may include:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Standard Contractual Clauses (SCCs) approved by the European Commission</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Binding Corporate Rules for transfers within our corporate group</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Certification mechanisms or codes of conduct, where applicable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Your explicit consent for specific transfers, where appropriate</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-white/50">
                    For more information about international data transfers or to obtain a copy of the safeguards we use, please contact us at info@managevelocity.com.
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
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We may update, modify, or amend this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or operational needs. When we make changes to this Privacy Policy, we will take the following steps to notify you:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Post the revised Privacy Policy on our website and update the &quot;Last Updated&quot; date at the top of this Policy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>For material changes, send an email notification to the address associated with your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Display a prominent notice within the Services or dashboard when you next log in</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Where required by law, obtain your consent to material changes before they take effect</span>
                    </li>
                  </ul>
                  <p>
                    We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information. Your continued use of the Services after any changes to this Privacy Policy constitutes your acceptance of the updated Policy.
                  </p>
                  <p className="text-sm text-white/50">
                    If you do not agree with any changes to this Privacy Policy, you should discontinue your use of the Services and contact us to delete your account.
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
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    If you have any questions, concerns, comments, or requests regarding this Privacy Policy, our data practices, or your personal information, please do not hesitate to contact us. We are committed to addressing your privacy inquiries in a timely and transparent manner.
                  </p>
                  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="font-semibold text-white text-lg mb-2">Velocity Labs, LLC</p>
                    <p className="text-sm text-white/50 mb-4">Data Controller · A Florida Limited Liability Company</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Privacy Inquiries</p>
                        <p className="text-sm">Email: <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Data Subject Requests</p>
                        <p className="text-sm">Email: <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Website</p>
                        <p className="text-sm"><a href="https://managevelocity.com" className="text-white/80 hover:underline">managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Data Deletion Requests</p>
                        <p className="text-sm"><Link href="/data-deletion" className="text-white/80 hover:underline">managevelocity.com/data-deletion</Link></p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">Response Commitment</h3>
                    <p className="text-sm text-white/60">
                      We aim to respond to all privacy-related inquiries within five (5) business days of receipt. For formal data subject requests (access, deletion, correction), we will respond within the timeframes required by applicable law (typically 30-45 days). Business hours are Monday through Friday, 9:00 AM to 6:00 PM Eastern Time, excluding federal holidays.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">Supervisory Authority</h3>
                    <p className="text-sm text-white/60">
                      If you are located in the European Economic Area (EEA) and believe we have not adequately addressed your concerns, you have the right to lodge a complaint with your local data protection supervisory authority. A list of supervisory authorities is available at: <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" className="text-white/80 hover:underline" target="_blank" rel="noopener noreferrer">European Data Protection Board</a>.
                    </p>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section id="governing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">16. Governing Law and Jurisdiction</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    This Privacy Policy, and any disputes arising out of or relating to this Privacy Policy or our data practices, shall be governed by and construed in accordance with the laws of the State of Florida, United States of America, without giving effect to any principles of conflicts of law that would cause the application of the laws of any other jurisdiction.
                  </p>
                  <p>
                    Any legal action or proceeding arising under this Privacy Policy shall be brought exclusively in the state or federal courts located in Miami-Dade County, Florida, and you hereby irrevocably consent to the personal jurisdiction and venue of such courts.
                  </p>
                  <p className="text-sm text-white/50">
                    Notwithstanding the foregoing, if you are a resident of the European Economic Area (EEA), United Kingdom, or Switzerland, nothing in this Privacy Policy shall deprive you of any mandatory consumer protections or data protection rights granted under the applicable laws of your country of residence, including your right to bring proceedings in your local courts.
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
