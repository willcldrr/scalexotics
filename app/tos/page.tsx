"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, FileText, BookOpen, UserCheck, Shield, CreditCard, Link2, FileCode, Sparkles, Copyright, AlertTriangle, Scale, XCircle, Gavel, MapPin, LogOut, Settings, RefreshCw, Mail, ChevronUp, ChevronDown } from "lucide-react"

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
                    These Terms of Service (&quot;Terms,&quot; &quot;Agreement,&quot; or &quot;Terms of Service&quot;) constitute a legally binding agreement between you, whether personally or on behalf of an entity (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;), and Velocity Labs, LLC, a Florida limited liability company (&quot;Velocity Labs,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), concerning your access to and use of the Velocity Labs software-as-a-service platform, the website located at managevelocity.com, any associated mobile applications, application programming interfaces (APIs), and all related services, features, content, and functionality offered by Velocity Labs (collectively, the &quot;Services&quot; or &quot;Platform&quot;).
                  </p>
                  <p>
                    This Agreement sets forth the legally binding terms and conditions that govern your use of the Services. By accessing, browsing, or using the Services in any manner, including but not limited to visiting or browsing the website, registering for an account, subscribing to any paid plan, connecting third-party integrations, or contributing content or other materials to the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. These Terms apply to all users of the Services, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                  </p>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium">
                      BY ACCESSING OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY. IF YOU DO NOT AGREE TO ALL OF THESE TERMS, YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND MUST DISCONTINUE USE IMMEDIATELY.
                    </p>
                  </div>
                  <p>
                    If you are entering into this Agreement on behalf of a business, organization, or other legal entity, you represent and warrant that you have the authority to bind such entity and its affiliates to these Terms, in which case the terms &quot;you&quot; and &quot;your&quot; shall refer to such entity and its affiliates. If you do not have such authority, or if you do not agree with these Terms, you must not accept this Agreement and may not use the Services.
                  </p>
                  <p>
                    Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms at any time and for any reason. We will alert you about any changes by updating the &quot;Last Updated&quot; date of these Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms to stay informed of updates.
                  </p>
                </div>
              </section>

              {/* Definitions */}
              <section id="definitions" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">2. Definitions and Interpretation</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    For the purposes of this Agreement, the following definitions shall apply. These definitions shall have the same meaning regardless of whether they appear in singular or in plural form. Terms not defined herein shall have the meaning ascribed to them in common legal usage or industry practice.
                  </p>
                </div>
                <div className="grid gap-3 mt-6">
                  {[
                    { term: "Affiliate", def: "Any entity that directly or indirectly controls, is controlled by, or is under common control with a party, where 'control' means ownership of 50% or more of the shares, equity interest, or voting rights." },
                    { term: "Business User", def: "A business entity, sole proprietorship, partnership, corporation, limited liability company, or individual acting in a commercial capacity that subscribes to our Services to manage their vehicle rental operations, customer relationships, and business communications." },
                    { term: "Confidential Information", def: "All non-public information disclosed by either party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure." },
                    { term: "End User", def: "An individual, whether acting personally or on behalf of an entity, who interacts with a Business User through our platform, including but not limited to rental inquiries, booking requests, customer service communications, and transactional interactions." },
                    { term: "Intellectual Property Rights", def: "All patent rights, copyright rights, mask work rights, moral rights, rights of publicity, trademark, trade dress and service mark rights, goodwill, trade secret rights, and other intellectual property rights as may now exist or hereafter come into existence." },
                    { term: "Personal Data", def: "Any information relating to an identified or identifiable natural person, as defined by applicable data protection laws including but not limited to the California Consumer Privacy Act (CCPA) and the General Data Protection Regulation (GDPR)." },
                    { term: "User Content", def: "Any data, text, graphics, images, photographs, audio, video, messages, or other materials that you submit, upload, post, transmit, or otherwise make available through the Services, including but not limited to vehicle listings, customer communications, and business information." },
                    { term: "Third-Party Services", def: "External platforms, applications, websites, and services integrated with or accessible through our Services, including but not limited to Meta Platforms (Instagram/Facebook), Stripe Inc., Twilio Inc., and any other third-party providers." },
                    { term: "Subscription Period", def: "The period during which you have agreed to subscribe to the Services, as specified in your subscription plan, which may be monthly, annually, or as otherwise agreed in writing." },
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
                  <h2 className="text-xl font-semibold">3. User Eligibility and Representations</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    The Services are intended solely for users who are at least eighteen (18) years of age. All users who are minors in the jurisdiction in which they reside (generally under the age of 18) are expressly prohibited from using the Services. By using the Services, you represent and warrant that you meet all of the following eligibility requirements:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "You are at least 18 years of age and have reached the age of majority in your jurisdiction",
                      "You have the legal capacity and authority to enter into a binding contractual agreement",
                      "You are not located in a country subject to a U.S. government embargo or designated as a 'terrorist supporting' country",
                      "You are not listed on any U.S. government list of prohibited or restricted parties",
                      "You will provide accurate, current, and complete registration information",
                      "You will maintain the accuracy of such information and promptly update it as necessary",
                      "You will comply with all applicable federal, state, local, and international laws and regulations",
                      "You have not been previously suspended or removed from using our Services",
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                        <span className="text-sm">{req}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4">
                    If you are accessing or using the Services on behalf of a company, organization, or other legal entity, you further represent and warrant that: (a) you are duly authorized to represent and bind such entity to these Terms; (b) you have obtained all necessary corporate authorizations and approvals; and (c) these Terms shall be binding upon such entity. Any violation of this Section shall render your right to use the Services voidable at our sole discretion.
                  </p>
                </div>
              </section>

              {/* Account Security */}
              <section id="account" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">4. Account Registration, Security, and Authentication</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">4.1 Account Creation and Registration</h3>
                    <p className="mb-3">To access certain features and functionalities of the Services, you are required to create a user account. During the registration process, you agree to:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Provide accurate, truthful, current, and complete information as prompted by the registration form</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Maintain and promptly update your registration information to keep it accurate, current, and complete</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Use only one account per individual or business entity unless expressly authorized otherwise</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Provide a valid email address that you have access to for account verification and communications</span>
                      </li>
                    </ul>
                    <p className="mt-3">
                      We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate, not current, incomplete, or otherwise in violation of these Terms.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">4.2 Account Security and Confidentiality</h3>
                    <p className="mb-3">You are solely responsible for maintaining the confidentiality and security of your account credentials, including your username, password, and any authentication tokens. You expressly agree to:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Create and maintain a strong, unique password that is not used for any other online accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Never share your account credentials with any third party, including employees, contractors, or agents</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Immediately notify us at info@managevelocity.com of any unauthorized access to or use of your account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Log out of your account at the end of each session, particularly when using shared or public devices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Enable multi-factor authentication (MFA) when available to enhance account security</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Regularly review your account activity and report any suspicious activity immediately</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">4.3 Account Responsibility and Liability</h3>
                    <p>
                      You acknowledge and agree that you are fully responsible for all activities that occur under your account, whether or not you have authorized such activities. Velocity Labs shall not be liable for any loss, damage, or other consequences arising from your failure to comply with the security requirements set forth in this Section. You agree to indemnify and hold harmless Velocity Labs from any claims, losses, or damages resulting from any unauthorized use of your account.
                    </p>
                  </div>
                </div>
              </section>

              {/* Description of Services */}
              <section id="services" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">5. Description of Services and Platform Features</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    Velocity Labs provides a comprehensive software-as-a-service (SaaS) platform specifically designed and engineered for exotic and luxury car rental businesses. Our platform offers an integrated suite of tools and features that enable Business Users to streamline operations, enhance customer engagement, and optimize business performance. The Services include, but are not limited to, the following core functionalities:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "Lead management and customer relationship management (CRM) tools with automated lead scoring",
                      "AI-powered automated messaging and intelligent response systems",
                      "Booking and reservation management with real-time availability tracking",
                      "Secure payment processing integration via Stripe Connect",
                      "Vehicle inventory management with detailed specifications and media galleries",
                      "Calendar synchronization with major calendar platforms and scheduling systems",
                      "Analytics, reporting, and business intelligence dashboards",
                      "Instagram and social media integration for direct message automation",
                      "SMS and text messaging capabilities via Twilio integration",
                      "Customer communication history and conversation threading",
                      "Multi-user access with role-based permissions and team collaboration tools",
                      "Customizable business profiles and branded customer-facing interfaces",
                    ].map((service, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-2 h-2 rounded-full bg-white/40 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">5.1 Service Availability and Performance</h3>
                    <p>
                      While Velocity Labs strives to maintain continuous availability of the Services, we do not guarantee uninterrupted access. The Services may be subject to scheduled maintenance, updates, and occasional downtime. We will make reasonable efforts to provide advance notice of planned maintenance windows through email notification or in-platform announcements. We target a service availability of 99.5% uptime, measured on a monthly basis, excluding scheduled maintenance periods.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">5.2 Modifications to Services</h3>
                    <p>
                      Velocity Labs reserves the right, in its sole discretion, to modify, update, enhance, suspend, or discontinue any aspect of the Services, including any features, functionalities, or content, at any time with or without notice. Such modifications may include, but are not limited to, adding new features, removing existing features, changing the user interface, updating third-party integrations, or adjusting system requirements. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Services.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">5.3 Beta Features and Early Access</h3>
                    <p>
                      From time to time, Velocity Labs may offer beta features, early access programs, or experimental functionalities (&quot;Beta Features&quot;). Beta Features are provided &quot;as is&quot; and &quot;as available&quot; without any warranty, and may be modified or discontinued at any time without notice. Your use of Beta Features is entirely voluntary and at your own risk.
                    </p>
                  </div>
                </div>
              </section>

              {/* Subscription & Payment */}
              <section id="billing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">6. Subscription, Billing, and Payment Terms</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    Access to certain features and functionalities of the Services requires a paid subscription. By subscribing to a paid plan, you agree to pay all applicable fees in accordance with the billing terms presented to you at the time of purchase and as described in this Section.
                  </p>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.1 Subscription Plans and Fees</h3>
                      <p className="text-sm mb-2">Velocity Labs offers various subscription plans with different features and pricing tiers. The specific features, limitations, and pricing for each plan are described on our website and may be updated from time to time. By selecting a subscription plan, you agree to pay the applicable subscription fees for your selected plan. All fees are quoted and payable in United States Dollars (USD) unless otherwise specified.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.2 Billing Authorization</h3>
                      <p className="text-sm mb-2">By providing a payment method and subscribing to the Services, you expressly authorize Velocity Labs and our third-party payment processor (Stripe, Inc.) to charge your designated payment method for: (a) the initial subscription fee at the time of purchase; (b) all recurring subscription fees at the beginning of each billing cycle (monthly or annually, as selected); and (c) any additional fees, including overage charges, add-on services, or usage-based fees that may apply to your account.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.3 Automatic Renewal</h3>
                      <p className="text-sm mb-2">YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW at the end of each billing period unless you cancel your subscription before the renewal date. The renewal charge will be equal to the then-current subscription fee for your plan. You may cancel your subscription at any time through your account settings in the dashboard or by contacting us at info@managevelocity.com. Cancellation will be effective at the end of your current billing period, and you will retain access to the Services until that time.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.4 Payment Methods and Security</h3>
                      <p className="text-sm mb-2">You agree to provide valid and current payment information. We accept major credit cards, debit cards, and other payment methods as specified during checkout. You are responsible for keeping your payment information up to date. If your payment method fails or your account is past due, we may suspend or terminate your access to the Services. All payment information is processed securely through our PCI-DSS compliant payment processor, Stripe, Inc.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.5 Refund Policy</h3>
                      <p className="text-sm mb-2">All subscription fees are non-refundable except as expressly provided in this Agreement or as required by applicable law. No refunds or credits will be provided for partial subscription periods, unused features, or early termination. We do not provide pro-rated refunds for any reason. In limited circumstances, refund requests may be considered on a case-by-case basis at our sole discretion. To request a refund, contact info@managevelocity.com with details of your request.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.6 Price Changes</h3>
                      <p className="text-sm mb-2">Velocity Labs reserves the right to change subscription fees at any time. For existing subscribers, price changes will be communicated at least thirty (30) days in advance via email or in-platform notification. Price changes will take effect at the beginning of your next billing cycle following the notice period. Your continued use of the Services after the price change constitutes your acceptance of the new pricing.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">6.7 Taxes</h3>
                      <p className="text-sm mb-2">All fees are exclusive of applicable taxes, levies, or duties imposed by taxing authorities. You are responsible for paying all such taxes, levies, or duties, excluding only taxes based on Velocity Labs&apos; net income. If we are required to collect or pay taxes on your behalf, such amounts will be added to your invoice.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Third-Party Integrations */}
              <section id="integrations" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">7. Third-Party Services, Integrations, and APIs</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    The Services integrate with various third-party platforms, services, and applications to provide enhanced functionality. Your use of these third-party integrations is subject to this Section and the respective terms and policies of each third-party provider.
                  </p>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">7.1 Instagram and Meta Platform Integration</h3>
                      <p className="text-sm text-white/60 mb-2">Our Services integrate with Instagram and the Meta platform to enable automated direct messaging and customer engagement capabilities. By connecting your Instagram Business or Creator account to our Services, you:</p>
                      <ul className="space-y-1 text-sm text-white/60 ml-4">
                        <li>• Authorize Velocity Labs to access your Instagram account information, including account ID, username, and profile data</li>
                        <li>• Grant permission to read and send Direct Messages on your behalf through the Instagram Messaging API</li>
                        <li>• Agree to comply with Meta&apos;s Platform Terms, Instagram Terms of Use, and Community Guidelines</li>
                        <li>• Accept full responsibility for all content, messages, and communications sent through your connected account</li>
                        <li>• Acknowledge that Meta may revoke access or impose restrictions at any time</li>
                        <li>• Agree that we may store message content and conversation history to provide the Services</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">7.2 Payment Processing (Stripe Connect)</h3>
                      <p className="text-sm text-white/60 mb-2">Payment processing services are provided by Stripe, Inc. and are subject to the Stripe Connected Account Agreement, which includes the Stripe Terms of Service. By enabling payment features within our Services, you agree to:</p>
                      <ul className="space-y-1 text-sm text-white/60 ml-4">
                        <li>• Be bound by the Stripe Connected Account Agreement, as may be modified from time to time</li>
                        <li>• Provide accurate and complete information required for payment processing and identity verification</li>
                        <li>• Authorize Stripe to share information with Velocity Labs as necessary to provide the Services</li>
                        <li>• Comply with all applicable payment card industry (PCI) standards and requirements</li>
                        <li>• Accept Stripe&apos;s fees and payout schedules as disclosed during onboarding</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">7.3 SMS and Messaging Services (Twilio)</h3>
                      <p className="text-sm text-white/60 mb-2">SMS and text messaging capabilities are provided through Twilio, Inc. By using SMS features within our Services, you expressly agree to:</p>
                      <ul className="space-y-1 text-sm text-white/60 ml-4">
                        <li>• Comply with all applicable telecommunications laws, including the Telephone Consumer Protection Act (TCPA)</li>
                        <li>• Obtain proper consent from recipients before sending any SMS messages</li>
                        <li>• Honor all opt-out requests promptly (within 24 hours of receipt)</li>
                        <li>• Include appropriate opt-out instructions in marketing messages</li>
                        <li>• Refrain from sending unsolicited messages, spam, or content that violates Twilio&apos;s Acceptable Use Policy</li>
                        <li>• Maintain accurate records of consent for all SMS recipients</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">7.4 AI and Machine Learning Services</h3>
                      <p className="text-sm text-white/60">Our AI-powered features utilize third-party artificial intelligence and machine learning services, including Anthropic&apos;s Claude. Conversations and data processed through AI features may be subject to the respective provider&apos;s terms and privacy policies. We implement appropriate safeguards to protect your data when using these services.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">7.5 Third-Party Disclaimer</h3>
                      <p className="text-sm text-white/60">Velocity Labs does not control, endorse, or assume any responsibility for the content, privacy policies, or practices of any third-party services. We are not liable for any harm, loss, or damage arising from your use of third-party integrations. You acknowledge that your use of third-party services is at your own risk and subject to the terms and conditions of those services.</p>
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
                  <h2 className="text-xl font-semibold">8. User Content, Conduct, and Acceptable Use</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.1 User Content Ownership and Rights</h3>
                    <p className="mb-3">You retain all ownership rights and intellectual property rights in and to any content that you submit, upload, post, transmit, or otherwise make available through the Services (&quot;User Content&quot;). By submitting User Content to the Services, you hereby grant Velocity Labs a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, perform, and display such User Content in connection with:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Operating, providing, and improving the Services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Developing new products, features, and services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Training and improving our AI and machine learning systems (using anonymized or de-identified data)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Complying with legal obligations and enforcing our policies</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.2 User Content Representations and Warranties</h3>
                    <p className="mb-3">You represent and warrant that:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>You own or have all necessary rights, licenses, and permissions to submit the User Content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Your User Content does not infringe, misappropriate, or violate any third-party intellectual property rights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Your User Content is accurate and not misleading</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Your User Content complies with all applicable laws, rules, and regulations</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.3 Prohibited Conduct and Acceptable Use</h3>
                    <p className="mb-3">You agree that you will not use the Services to engage in any of the following prohibited conduct. Violation of this acceptable use policy may result in immediate suspension or termination of your account:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        "Use Services for any unlawful, fraudulent, or malicious purpose",
                        "Send unsolicited commercial communications (spam) or bulk messages",
                        "Harass, threaten, intimidate, or abuse any person",
                        "Impersonate any person, business, or entity, or falsely claim affiliation",
                        "Interfere with, disrupt, or impose an unreasonable burden on the Services",
                        "Attempt to gain unauthorized access to any systems or networks",
                        "Reverse engineer, decompile, disassemble, or otherwise attempt to derive source code",
                        "Transmit any viruses, malware, worms, or other malicious code",
                        "Scrape, harvest, or collect data from the Services without authorization",
                        "Use automated systems (bots, scrapers) except as permitted",
                        "Violate any applicable laws, regulations, or third-party rights",
                        "Circumvent any security measures or access controls",
                        "Sublicense, sell, resell, or transfer your rights to the Services",
                        "Use the Services in a manner that could damage our reputation",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                          <XCircle className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">8.4 Content Moderation and Removal</h3>
                    <p>
                      Velocity Labs reserves the right, but has no obligation, to monitor, review, screen, edit, or remove any User Content in our sole discretion. We may remove or disable access to any User Content that we determine, in our sole discretion, violates these Terms, our policies, or applicable law, or is otherwise objectionable. We are not responsible for monitoring or policing User Content and will not be liable for any User Content.
                    </p>
                  </div>
                </div>
              </section>

              {/* AI-Powered Features */}
              <section id="ai" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">9. Artificial Intelligence and Automated Features</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    Our Services incorporate artificial intelligence (&quot;AI&quot;) and machine learning technologies to provide automated messaging, intelligent responses, and other AI-powered features. By using these features, you acknowledge and agree to the following terms and conditions:
                  </p>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">9.1 Nature of AI Services</h3>
                    <p className="mb-3">Our AI features utilize advanced language models and machine learning algorithms to generate automated responses and assist with customer communications. You understand and acknowledge that:</p>
                    <div className="grid gap-3 mt-4">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-sm">AI-generated content is created algorithmically and may not always be accurate, complete, or appropriate for every situation or context</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-sm">AI responses are based on patterns in training data and may occasionally produce unexpected, incorrect, or inappropriate outputs</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-sm">AI technology has inherent limitations and should not be relied upon for critical decisions without human oversight</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-sm">The quality and accuracy of AI outputs may vary based on input quality, context, and system conditions</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">9.2 Your Responsibilities</h3>
                    <p className="mb-3">When using AI-powered features, you are solely responsible for:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Configuring AI settings, prompts, and parameters appropriately for your specific business needs and use cases</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Reviewing, monitoring, and supervising all AI-generated content before it is sent to customers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Ensuring that AI-generated communications comply with all applicable laws and regulations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Training your staff on proper use and oversight of AI features</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Implementing appropriate human review processes for high-stakes or sensitive communications</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">9.3 AI Disclaimer</h3>
                    <p>
                      AI FEATURES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND. VELOCITY LABS EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF ACCURACY, RELIABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT AI FEATURES WILL BE ERROR-FREE, UNINTERRUPTED, OR THAT OUTPUTS WILL BE ACCURATE OR SUITABLE FOR YOUR PURPOSES.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">9.4 Data Usage for AI Improvement</h3>
                    <p>
                      We may use anonymized and aggregated data from your interactions with AI features to improve our AI models and Services. This data is processed in accordance with our Privacy Policy and applicable data protection laws. You may opt out of AI model training by contacting us at info@managevelocity.com.
                    </p>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="ip" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Copyright className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">10. Intellectual Property Rights and Licenses</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.1 Velocity Labs Intellectual Property</h3>
                    <p>
                      The Services, including but not limited to all software, source code, object code, algorithms, databases, data structures, documentation, designs, user interfaces, graphics, text, images, photographs, audio, video, logos, trademarks, service marks, trade dress, trade names, domain names, and all other intellectual property and proprietary rights therein (collectively, &quot;Velocity Labs IP&quot;), are owned by or licensed to Velocity Labs and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.2 Limited License Grant</h3>
                    <p className="mb-3">Subject to your compliance with these Terms, Velocity Labs grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Services solely for your internal business purposes during the Subscription Period. This license expressly excludes the following rights:</p>
                    <div className="grid gap-3">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <h4 className="font-medium text-white mb-1">Modification and Derivative Works</h4>
                        <p className="text-sm text-white/50">You may not modify, adapt, translate, reverse engineer, decompile, disassemble, or create derivative works based on the Services or any portion thereof</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <h4 className="font-medium text-white mb-1">Commercial Exploitation</h4>
                        <p className="text-sm text-white/50">You may not sell, resell, rent, lease, license, sublicense, distribute, or otherwise transfer or make available the Services to any third party</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <h4 className="font-medium text-white mb-1">Competitive Use</h4>
                        <p className="text-sm text-white/50">You may not use the Services to build, improve, or train a competing product or service, or to benchmark against competitive products</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <h4 className="font-medium text-white mb-1">Proprietary Notices</h4>
                        <p className="text-sm text-white/50">You may not remove, obscure, or alter any proprietary notices, labels, trademarks, or copyright notices on or within the Services</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.3 Reservation of Rights</h3>
                    <p>
                      All rights not expressly granted to you in these Terms are reserved by Velocity Labs. Nothing in these Terms shall be construed as granting any license or right to use any trademark, logo, or service mark displayed on the Services without our prior written consent or the consent of any applicable third-party owner.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.4 Feedback</h3>
                    <p>
                      If you provide us with any feedback, suggestions, ideas, or recommendations regarding the Services (&quot;Feedback&quot;), you hereby assign to Velocity Labs all rights, title, and interest in and to such Feedback. We shall be free to use, disclose, reproduce, license, and otherwise exploit the Feedback without any obligation to you, and you waive any moral rights in such Feedback.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">10.5 DMCA and Copyright Infringement</h3>
                    <p>
                      We respect the intellectual property rights of others and expect our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 (&quot;DMCA&quot;), we will respond expeditiously to claims of copyright infringement that are reported to our designated copyright agent. If you believe that your work has been copied in a way that constitutes copyright infringement, please contact us at info@managevelocity.com with the information required under the DMCA.
                    </p>
                  </div>
                </div>
              </section>

              {/* Disclaimers */}
              <section id="disclaimers" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">11. Disclaimers of Warranties</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 font-medium uppercase text-sm mb-3">
                      THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
                    </p>
                    <p className="text-red-300 text-sm">
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VELOCITY LABS EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                    </p>
                  </div>
                  <p>Without limiting the generality of the foregoing, Velocity Labs makes no warranty or representation that:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>The Services will meet your specific requirements or expectations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>The Services will be uninterrupted, timely, secure, error-free, or free from viruses or other harmful components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>The results obtained from the use of the Services will be accurate, reliable, or complete</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>The quality of any products, services, information, or other material obtained through the Services will meet your expectations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>Any errors in the Services will be corrected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span>The Services will be compatible with any particular hardware or software</span>
                    </li>
                  </ul>
                  <p>
                    Any material downloaded or otherwise obtained through the use of the Services is accessed at your own discretion and risk, and you will be solely responsible for any damage to your computer system or loss of data that results from the download of any such material.
                  </p>
                  <p>
                    No advice or information, whether oral or written, obtained by you from Velocity Labs or through the Services shall create any warranty not expressly stated in these Terms. Some jurisdictions do not allow the exclusion of certain warranties, so some of the above exclusions may not apply to you.
                  </p>
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
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p className="font-medium text-white uppercase">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE FOLLOWING LIMITATIONS OF LIABILITY SHALL APPLY:</p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">12.1 Exclusion of Consequential Damages</h3>
                      <p className="text-sm">IN NO EVENT SHALL VELOCITY LABS, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES (EVEN IF VELOCITY LABS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), ARISING OUT OF OR IN CONNECTION WITH THE SERVICES OR THESE TERMS.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">12.2 Aggregate Liability Cap</h3>
                      <p className="text-sm">NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, THE TOTAL AGGREGATE LIABILITY OF VELOCITY LABS AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS, ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICES, SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL AMOUNTS PAID BY YOU TO VELOCITY LABS IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) ONE HUNDRED UNITED STATES DOLLARS ($100.00).</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">12.3 Basis of the Bargain</h3>
                      <p className="text-sm">THE LIMITATIONS OF LIABILITY SET FORTH IN THIS SECTION SHALL APPLY: (I) REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL OR EQUITABLE THEORY; (II) EVEN IF VELOCITY LABS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES; AND (III) EVEN IF ANY LIMITED REMEDY PROVIDED HEREIN FAILS OF ITS ESSENTIAL PURPOSE. THE PARTIES ACKNOWLEDGE THAT THESE LIMITATIONS REFLECT A REASONABLE ALLOCATION OF RISK AND ARE A FUNDAMENTAL ELEMENT OF THE BASIS OF THE BARGAIN BETWEEN THE PARTIES.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="font-medium text-white mb-2">12.4 Exceptions</h3>
                      <p className="text-sm">Nothing in these Terms shall limit or exclude liability for: (a) death or personal injury caused by negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that cannot be limited or excluded by applicable law; or (d) your breach of Section 8 (User Content and Conduct) or Section 10 (Intellectual Property Rights).</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/50">
                    Some jurisdictions do not allow the limitation or exclusion of liability for incidental or consequential damages, so the above limitations or exclusions may not apply to you. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.
                  </p>
                </div>
              </section>

              {/* Indemnification */}
              <section id="indemnification" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">13. Indemnification and Defense</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">13.1 Your Indemnification Obligations</h3>
                    <p className="mb-4">You agree to indemnify, defend, and hold harmless Velocity Labs, its parent company, subsidiaries, affiliates, officers, directors, employees, agents, suppliers, licensors, and successors and assigns (collectively, the &quot;Indemnified Parties&quot;) from and against any and all claims, demands, actions, suits, proceedings, liabilities, damages, losses, costs, and expenses (including but not limited to reasonable attorneys&apos; fees and court costs) arising out of or relating to:</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        "Your access to or use of the Services",
                        "Your User Content or any content you provide",
                        "Your violation of any provision of these Terms",
                        "Your violation of any applicable law, rule, or regulation",
                        "Your violation of any third-party rights, including intellectual property rights",
                        "Any claim that your User Content caused damage to a third party",
                        "Your use of third-party integrations connected through the Services",
                        "Any negligent or wrongful act or omission by you",
                        "Your failure to comply with your tax or legal obligations",
                        "Any misrepresentation made by you",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium flex-shrink-0">{i + 1}</div>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">13.2 Indemnification Procedures</h3>
                    <p className="mb-3">The Indemnified Parties shall:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Promptly notify you in writing of any claim for which indemnification is sought (provided that failure to provide such notice shall not relieve you of your obligations except to the extent you are materially prejudiced)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Provide you with reasonable cooperation and assistance in the defense of such claim at your expense</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Grant you sole control of the defense and settlement of the claim (provided that you may not settle any claim without our prior written consent if such settlement would impose any obligation or liability on us)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">13.3 Survival</h3>
                    <p>
                      Your indemnification obligations shall survive the termination or expiration of these Terms and your use of the Services for a period of three (3) years following such termination or expiration.
                    </p>
                  </div>
                </div>
              </section>

              {/* Dispute Resolution */}
              <section id="disputes" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">14. Dispute Resolution and Arbitration</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT AND TO HAVE A JURY HEAR YOUR CLAIMS.
                  </p>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">14.1 Informal Dispute Resolution</h3>
                    <p className="text-sm mb-2">Before initiating any formal dispute resolution proceeding, the parties agree to first attempt to resolve any dispute, claim, or controversy arising out of or relating to these Terms or the Services (&quot;Dispute&quot;) through good faith negotiation. To initiate this process, you must send a written notice to info@managevelocity.com describing the nature of the Dispute, the relief sought, and your contact information (&quot;Dispute Notice&quot;).</p>
                    <p className="text-sm">The parties shall engage in good faith negotiations for a period of at least sixty (60) days following receipt of the Dispute Notice. During this period, the parties shall attempt to resolve the Dispute through direct communication and negotiation. If the Dispute is not resolved within sixty (60) days, either party may proceed with formal dispute resolution as provided below.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">14.2 Binding Arbitration Agreement</h3>
                    <p className="text-sm mb-2">If the parties are unable to resolve a Dispute through informal negotiation, the Dispute shall be finally resolved by binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) in accordance with its Commercial Arbitration Rules and Mediation Procedures (&quot;AAA Rules&quot;), as modified by these Terms.</p>
                    <ul className="space-y-1 text-sm text-white/60 ml-4 mt-2">
                      <li>• The arbitration shall be conducted by a single arbitrator selected in accordance with the AAA Rules</li>
                      <li>• The seat of arbitration shall be Miami-Dade County, Florida</li>
                      <li>• The arbitration shall be conducted in the English language</li>
                      <li>• The arbitrator&apos;s decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction</li>
                      <li>• Each party shall bear its own costs and attorneys&apos; fees, unless the arbitrator determines otherwise</li>
                      <li>• The arbitrator may award any relief that a court of competent jurisdiction could award</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">14.3 Exceptions to Arbitration</h3>
                    <p className="text-sm">Notwithstanding the foregoing, either party may: (a) bring an action in a court of competent jurisdiction to seek injunctive or other equitable relief to prevent the actual or threatened infringement, misappropriation, or violation of a party&apos;s intellectual property rights; (b) seek relief in small claims court for disputes within that court&apos;s jurisdiction; or (c) bring claims that are expressly excluded from arbitration by law.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="font-medium text-red-300 mb-2">14.4 Class Action and Jury Trial Waiver</h3>
                    <p className="text-sm text-white/70 mb-2">YOU AND VELOCITY LABS AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE ACTION OR PROCEEDING.</p>
                    <p className="text-sm text-white/70 mb-2">THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON&apos;S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY AWARD RELIEF ONLY IN FAVOR OF THE INDIVIDUAL PARTY SEEKING RELIEF AND ONLY TO THE EXTENT NECESSARY TO PROVIDE RELIEF WARRANTED BY THAT PARTY&apos;S INDIVIDUAL CLAIM.</p>
                    <p className="text-sm text-white/70">YOU HEREBY WAIVE ANY RIGHT TO A JURY TRIAL IN CONNECTION WITH ANY DISPUTE ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">14.5 Opt-Out Right</h3>
                    <p className="text-sm">You may opt out of this arbitration agreement by sending written notice of your decision to opt out to info@managevelocity.com within thirty (30) days of first accepting these Terms. Your notice must include your name, address, and a clear statement that you wish to opt out of arbitration. If you opt out, you may pursue claims in court, but you and Velocity Labs still waive the right to participate in a class action.</p>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section id="governing" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">15. Governing Law, Jurisdiction, and Venue</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">15.1 Governing Law</h3>
                    <p>
                      These Terms, and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims), shall be governed by and construed in accordance with the laws of the State of Florida, United States of America, without giving effect to any choice or conflict of law provision or rule that would cause the application of the laws of any other jurisdiction. The United Nations Convention on Contracts for the International Sale of Goods shall not apply to these Terms.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">15.2 Jurisdiction and Venue</h3>
                    <p>
                      For any disputes not subject to binding arbitration as set forth in Section 14, you irrevocably consent and submit to the exclusive jurisdiction and venue of the state courts located in Miami-Dade County, Florida, and the United States District Court for the Southern District of Florida. You hereby waive any objection to the laying of venue in such courts, including any objection based on the doctrine of forum non conveniens.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">15.3 Service of Process</h3>
                    <p>
                      You agree that service of process may be made by first-class mail (with return receipt requested) to the address you have provided in your account registration, or by any other method permitted by applicable law.
                    </p>
                  </div>
                </div>
              </section>

              {/* Termination */}
              <section id="termination" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">16. Term, Termination, and Suspension</h2>
                </div>
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.1 Term</h3>
                    <p className="text-sm">These Terms shall commence on the date you first access or use the Services and shall continue in full force and effect until terminated in accordance with this Section. If you have a paid subscription, your subscription shall continue for the Subscription Period specified in your plan, subject to automatic renewal as described in Section 6.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.2 Termination by You</h3>
                    <p className="text-sm mb-2">You may terminate your account and these Terms at any time by:</p>
                    <ul className="space-y-1 text-sm text-white/60 ml-4">
                      <li>• Canceling your subscription through your account settings in the dashboard</li>
                      <li>• Contacting our support team at info@managevelocity.com</li>
                      <li>• Providing written notice of termination</li>
                    </ul>
                    <p className="text-sm mt-2">Termination will be effective at the end of your current billing period. You will retain access to the Services until the termination effective date. No refunds or credits will be provided for any remaining portion of your Subscription Period.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.3 Termination by Velocity Labs</h3>
                    <p className="text-sm mb-2">We reserve the right to suspend or terminate your access to the Services, in whole or in part, at any time and for any reason, including but not limited to:</p>
                    <ul className="space-y-1 text-sm text-white/60 ml-4">
                      <li>• Your breach of any provision of these Terms</li>
                      <li>• Your failure to pay applicable fees when due</li>
                      <li>• Fraudulent, abusive, or unlawful activity</li>
                      <li>• Non-payment or chargebacks</li>
                      <li>• Extended periods of inactivity</li>
                      <li>• Requests by law enforcement or government agencies</li>
                      <li>• Unexpected technical or security issues</li>
                      <li>• Discontinuation of the Services</li>
                    </ul>
                    <p className="text-sm mt-2">We may provide notice of termination where practicable, but immediate termination without notice may be necessary in certain circumstances.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.4 Effect of Termination</h3>
                    <p className="text-sm mb-2">Upon termination of your account or these Terms:</p>
                    <ul className="space-y-1 text-sm text-white/60 ml-4">
                      <li>• Your right to access and use the Services shall immediately cease</li>
                      <li>• All licenses granted to you under these Terms shall terminate</li>
                      <li>• We may delete or retain your User Content in accordance with our data retention policies</li>
                      <li>• Any outstanding fees or charges shall become immediately due and payable</li>
                      <li>• You must cease all use of our trademarks, logos, and intellectual property</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.5 Data Export and Retention</h3>
                    <p className="text-sm">Prior to termination, you may export your data through the dashboard or by contacting us. Following termination, we may retain certain data as required by law, for legitimate business purposes, or to resolve disputes. We will delete your personal data in accordance with our Privacy Policy and applicable data protection laws.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="font-medium text-white mb-2">16.6 Survival</h3>
                    <p className="text-sm">The following Sections shall survive termination of these Terms: Section 2 (Definitions), Section 8 (User Content), Section 10 (Intellectual Property), Section 11 (Disclaimers), Section 12 (Limitation of Liability), Section 13 (Indemnification), Section 14 (Dispute Resolution), Section 15 (Governing Law), and this Section 16, as well as any other provisions that by their nature should survive.</p>
                  </div>
                </div>
              </section>

              {/* General Provisions */}
              <section id="general" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">17. General Provisions and Miscellaneous</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    The following general provisions apply to these Terms and your use of the Services:
                  </p>
                  <div className="grid gap-4">
                    {[
                      { title: "17.1 Entire Agreement", desc: "These Terms, together with our Privacy Policy and any other policies or agreements referenced herein, constitute the entire agreement between you and Velocity Labs regarding the subject matter hereof and supersede all prior or contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the subject matter. Any terms and conditions contained in any purchase order or other document submitted by you shall be of no force or effect and are hereby rejected." },
                      { title: "17.2 Severability", desc: "If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid, legal, and enforceable while preserving the original intent. If modification is not possible, the provision shall be severed, and the remaining provisions of these Terms shall remain in full force and effect. The invalidity of any provision shall not affect the validity of any other provision." },
                      { title: "17.3 Waiver", desc: "No waiver of any term, provision, or condition of these Terms, whether by conduct or otherwise, in any one or more instances, shall be deemed to be or construed as a further or continuing waiver of any such term, provision, or condition, or of any other term, provision, or condition. Our failure to exercise or enforce any right or provision of these Terms shall not operate as a waiver of such right or provision." },
                      { title: "17.4 Assignment and Transfer", desc: "You may not assign, transfer, delegate, or sublicense any of your rights or obligations under these Terms without our prior written consent. Any attempted assignment, transfer, delegation, or sublicense in violation of this Section shall be null and void. Velocity Labs may freely assign, transfer, or delegate these Terms or any of its rights and obligations hereunder without your consent. These Terms shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns." },
                      { title: "17.5 Force Majeure", desc: "Velocity Labs shall not be liable for any delay or failure to perform any obligation under these Terms where the delay or failure results from any cause beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, labor disputes, shortage of transportation, facilities, fuel, energy, labor, or materials, failure of telecommunications or information systems, pandemics, or government actions." },
                      { title: "17.6 Notices", desc: "We may provide notices to you by email to the address associated with your account, by posting on the Services, or by other means reasonably calculated to provide actual notice. You are responsible for keeping your contact information current. Notices to Velocity Labs must be sent by email to info@managevelocity.com or by certified mail to our registered business address. Notices shall be deemed given upon receipt or, for email, upon transmission without receiving an error message." },
                      { title: "17.7 Independent Contractors", desc: "The relationship between you and Velocity Labs is that of independent contractors. Nothing in these Terms shall be construed to create a partnership, joint venture, employment, agency, or franchise relationship between the parties. Neither party has the authority to bind the other or incur any obligation on behalf of the other." },
                      { title: "17.8 No Third-Party Beneficiaries", desc: "These Terms are for the sole benefit of the parties and their respective successors and permitted assigns. Nothing in these Terms, express or implied, is intended to or shall confer upon any third party any legal or equitable right, benefit, or remedy of any nature whatsoever under or by reason of these Terms, except as expressly provided herein." },
                      { title: "17.9 Headings", desc: "The headings and section titles in these Terms are for convenience only and shall not affect the interpretation of these Terms. The use of the words 'include,' 'includes,' and 'including' shall be deemed to be followed by the words 'without limitation.' References to 'days' means calendar days unless otherwise specified." },
                      { title: "17.10 Electronic Signatures", desc: "You agree that your electronic acceptance of these Terms, whether by clicking 'I Agree,' creating an account, or otherwise indicating your acceptance, constitutes your legally binding electronic signature and consent to be bound by these Terms. This agreement satisfies all requirements for a 'writing' under applicable law." },
                    ].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-medium text-white mb-2">{item.title}</p>
                        <p className="text-sm text-white/50">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Changes to Terms */}
              <section id="changes" className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white/60" />
                  </div>
                  <h2 className="text-xl font-semibold">18. Modifications to These Terms</h2>
                </div>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">18.1 Right to Modify</h3>
                    <p>
                      Velocity Labs reserves the right, in its sole discretion, to modify, amend, update, or replace any provision of these Terms at any time. We may make such modifications for various reasons, including but not limited to: changes in our Services, legal or regulatory requirements, security concerns, or to clarify existing provisions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">18.2 Notice of Changes</h3>
                    <p className="mb-3">
                      We will provide notice of material changes to these Terms through one or more of the following methods:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Posting the updated Terms on our website and updating the &quot;Last Updated&quot; date</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Sending an email notification to the address associated with your account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Displaying a prominent notice within the Services or dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                        <span>Requiring acknowledgment or re-acceptance of the updated Terms</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">18.3 Acceptance of Changes</h3>
                    <p>
                      For material changes, we will provide at least thirty (30) days&apos; notice before the changes become effective, unless the changes are required by law or necessary to address an immediate security or fraud concern. Your continued access to or use of the Services after the effective date of the updated Terms constitutes your acceptance of and agreement to be bound by the updated Terms. If you do not agree to the updated Terms, you must stop using the Services and terminate your account before the changes take effect.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">18.4 Your Responsibility</h3>
                    <p>
                      It is your responsibility to review these Terms periodically for changes. We encourage you to review the Terms each time you access the Services. The &quot;Last Updated&quot; date at the top of these Terms indicates when the most recent changes were made.
                    </p>
                  </div>
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
                <div className="space-y-6 text-white/70 leading-relaxed">
                  <p>
                    If you have any questions, concerns, or comments regarding these Terms of Service, our Services, or your account, please do not hesitate to contact us. We are committed to addressing your inquiries in a timely and professional manner.
                  </p>
                  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="font-semibold text-white text-lg mb-4">Velocity Labs, LLC</p>
                    <p className="text-sm text-white/50 mb-4">A Florida Limited Liability Company</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-white mb-2">General Inquiries</p>
                        <p className="text-sm">Email: <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Legal Department</p>
                        <p className="text-sm">Email: <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Privacy Inquiries</p>
                        <p className="text-sm">Email: <a href="mailto:info@managevelocity.com" className="text-white/80 hover:underline">info@managevelocity.com</a></p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Website</p>
                        <p className="text-sm"><a href="https://managevelocity.com" className="text-white/80 hover:underline">managevelocity.com</a></p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-white/60">
                      <strong className="text-white">Response Time:</strong> We endeavor to respond to all inquiries within two (2) business days. For urgent matters, please indicate the nature of the urgency in your subject line. Business hours are Monday through Friday, 9:00 AM to 6:00 PM Eastern Time, excluding federal holidays.
                    </p>
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
