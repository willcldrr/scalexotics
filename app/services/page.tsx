'use client'

import { bebasNeue } from "../fonts"

export default function Services() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-8 md:h-10 w-auto" />
        </a>
        <div className="flex items-center gap-6">
          <a href="/about" className="text-sm text-white/60 hover:text-white transition hidden md:block">
            About
          </a>
          <a href="/" className="text-sm text-white/60 hover:text-white transition">
            ← Back to Home
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${bebasNeue.className} text-5xl md:text-7xl lg:text-8xl text-white mb-6`}>
            OUR SERVICES
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Everything you need to scale your exotic rental business — from booking systems to growth strategy.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="px-6 md:px-8 py-16 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8">
            
            {/* Lead Magnet */}
            <div className="bg-white/[0.03] rounded-2xl p-8 md:p-12 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-[#375DEE]/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-4`}>LEAD MAGNET</h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    Build nonstop inbound demand. This system pulls high intent renters toward your fleet using targeted acquisition loops, automated funnels, and content that attracts people already ready to book.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Targeted acquisition systems
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Automated inbound capture
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      High-intent traffic funnels
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conversion System */}
            <div className="bg-white/[0.03] rounded-2xl p-8 md:p-12 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-[#375DEE]/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-4`}>CONVERSION SYSTEM</h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    Convert every inquiry into revenue. This circuit handles responses instantly, qualifies prospects, and moves them through a frictionless booking path built specifically for exotic and luxury rentals.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Instant response + follow-ups
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      AI-driven qualification
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Booking flow optimization
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Insight Engine */}
            <div className="bg-white/[0.03] rounded-2xl p-8 md:p-12 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-[#375DEE]/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-4`}>INSIGHT ENGINE</h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    See the entire business with absolute clarity. This engine tracks performance, forecasts demand, and exposes revenue opportunities before your competitors even notice.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Live performance dashboards
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Revenue + demand forecasting
                    </li>
                    <li className="flex items-center gap-3 text-white/50 text-sm">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Actionable insights and alerts
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-8 py-20 bg-gradient-to-b from-transparent to-[#375DEE]/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white mb-6`}>
            READY TO GET STARTED?
          </h2>
          <p className="text-white/60 mb-8">
            Book a call to discuss how Scale Exotics can help your fleet reach $50k/month+.
          </p>
          <a 
            href="/"
            className={`${bebasNeue.className} inline-block px-12 py-4 text-white text-xl tracking-wider rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(55,93,238,0.5)] shadow-2xl bg-gradient-to-r from-[#375DEE] to-[#5B7FFF] border border-white/25`}
          >
            WORK WITH US
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-8 py-16 bg-black border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-6 md:h-7 w-auto opacity-60" />
            <div className="text-xs md:text-sm text-white/40 space-y-1">
              <p>932 SW 1st Ave, Miami, FL 33130</p>
              <p>
                <a href="mailto:info@scalexotics.com" className="hover:text-white/60 transition-colors">
                  info@scalexotics.com
                </a>
              </p>
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex justify-center gap-6 text-xs text-white/30">
            <a href="/about" className="hover:text-white/50 transition-colors">About</a>
            <span className="text-white/10">•</span>
            <a href="/services" className="hover:text-white/50 transition-colors">Services</a>
            <span className="text-white/10">•</span>
            <a href="/tos" className="hover:text-white/50 transition-colors">Terms of Service</a>
            <span className="text-white/10">•</span>
            <a href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy Policy</a>
          </div>

          <p className="text-[10px] text-white/20 text-center">
            © {new Date().getFullYear()} Scale Exotics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

