'use client'

import { bebasNeue } from "../fonts"

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/10">
        <a href="/" className="flex items-center">
          <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-8 md:h-10 w-auto" />
        </a>
        <div className="flex items-center gap-6">
          <a href="/services" className="text-sm text-white/60 hover:text-white transition hidden md:block">
            Services
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
            ABOUT SCALE EXOTICS
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            We help exotic and luxury car rental businesses scale to $50k/month+ with proven systems and dedicated support.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-6 md:px-8 py-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-[#375DEE] mb-4`}>
                OUR MISSION
              </h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Scale Exotics was founded with a single mission: to help exotic car rental owners stop leaving money on the table and start building real, scalable businesses.
              </p>
              <p className="text-white/70 leading-relaxed">
                We've seen too many talented fleet owners struggle with inconsistent bookings, poor systems, and lack of support. That's why we built a comprehensive growth partner program that addresses every aspect of scaling a rental business.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="space-y-6">
                <div>
                  <span className={`${bebasNeue.className} text-4xl text-[#375DEE]`}>$2.4M+</span>
                  <p className="text-white/50 text-sm mt-1">Revenue generated for partners</p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <span className={`${bebasNeue.className} text-4xl text-[#375DEE]`}>50+</span>
                  <p className="text-white/50 text-sm mt-1">Fleet partners nationwide</p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <span className={`${bebasNeue.className} text-4xl text-[#375DEE]`}>3X</span>
                  <p className="text-white/50 text-sm mt-1">Average revenue growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="px-6 md:px-8 py-16 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center mb-12`}>
            WHAT SETS US APART
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-xl text-white mb-2`}>INDUSTRY EXPERTISE</h3>
              <p className="text-white/50 text-sm">
                We specialize exclusively in exotic and luxury rentals. We understand your market, your customers, and your challenges.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-xl text-white mb-2`}>PROVEN SYSTEMS</h3>
              <p className="text-white/50 text-sm">
                Our booking engines, profit stacks, and growth frameworks have been tested and refined across 50+ fleet partners.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-xl text-white mb-2`}>24/7 SUPPORT</h3>
              <p className="text-white/50 text-sm">
                Round-the-clock support means you're never alone. Questions, issues, strategy calls — we're always here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="px-6 md:px-8 py-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-4`}>
            BASED IN MIAMI
          </h2>
          <p className="text-white/60 mb-8">
            Operating from the heart of the exotic car rental industry
          </p>
          <p className="text-white/40 text-sm">
            932 SW 1st Ave, Miami, FL 33130
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-8 py-20 bg-gradient-to-b from-transparent to-[#375DEE]/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white mb-6`}>
            READY TO SCALE?
          </h2>
          <p className="text-white/60 mb-8">
            Join the top exotic rental businesses already growing with Scale Exotics.
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

