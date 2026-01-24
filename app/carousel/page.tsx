"use client";

import { useState, useRef } from "react";
import { Inter, Syne } from "next/font/google";
import Image from "next/image";
import { domToPng } from "modern-screenshot";

const syne = Syne({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

// SVG Icons
const icons = {
  download: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

// AI Follow-Up Carousel Cards
const carouselCards = [
  {
    id: 1,
    type: "cover",
    headline: "Why Your Leads Are",
    highlight: "Ghosting You",
  },
  {
    id: 2,
    type: "hook",
  },
  {
    id: 3,
    type: "problem-stat",
    stat: "5 min",
    label: "That's all you have.",
    description: "After 5 minutes, your chance of converting a lead drops by 80%.",
  },
  {
    id: 4,
    type: "transition",
    topLine: "You can't reply instantly",
    bottomLine: "24/7.",
    connector: "But AI can.",
  },
  {
    id: 5,
    type: "solution",
    headline: "AI That Never Sleeps",
    features: [
      "Instant response when leads inquire",
      "Personalized follow-up messages",
      "Sends deposit link automatically",
      "Books while you sleep",
    ],
  },
  {
    id: 6,
    type: "dashboard-detailed",
    headline: "Your Command Center",
  },
  {
    id: 7,
    type: "cta-specific",
    stat: "24/7",
    headline: "Your AI closes deals while you sleep.",
    subtext: "Wake up to deposits, not missed opportunities.",
    cta: "Link in Bio",
  },
];

// Card Component
function CarouselCard({ card, index }: { card: typeof carouselCards[0]; index: number }) {

  // Slide 1 - Professional Cover
  if (card.type === "cover") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#8B5CF6]/15 rounded-full blur-[120px]" />
        </div>

        {/* Decorative lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute top-[80%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute top-0 left-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        </div>

        {/* Corner accents */}
        <div className="absolute top-6 left-6 w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#375DEE] to-transparent" />
          <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#375DEE] to-transparent" />
        </div>
        <div className="absolute bottom-6 right-6 w-16 h-16">
          <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#375DEE] to-transparent" />
          <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-[#375DEE] to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-8">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={52}
            height={52}
            className="w-13 h-13 object-contain"
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
          {/* Badge */}
          <div className="mb-6">
            <span
              className={`${inter.className} text-xs font-semibold tracking-[0.2em] uppercase px-4 py-2 rounded-full border border-[#375DEE]/30`}
              style={{
                background: 'linear-gradient(135deg, rgba(55, 93, 238, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                color: '#6B8CFF'
              }}
            >
              The Silent Revenue Killer
            </span>
          </div>

          {/* Headline */}
          <h2 className={`${syne.className} text-white/70 text-4xl font-bold text-center mb-2`}>
            {card.headline}
          </h2>
          <h1
            className={`${syne.className} text-6xl font-bold text-center`}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(239, 68, 68, 0.6))'
            }}
          >
            {card.highlight}
          </h1>

          {/* Swipe indicator */}
          <div className="mt-12 flex items-center gap-2 text-white/30">
            <span className={`${inter.className} text-sm`}>Swipe to learn more</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 px-8 pb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-1 rounded-full bg-[#375DEE]" />
            <div className="w-2 h-1 rounded-full bg-white/20" />
            <div className="w-2 h-1 rounded-full bg-white/20" />
            <div className="w-2 h-1 rounded-full bg-white/20" />
            <div className="w-2 h-1 rounded-full bg-white/20" />
            <div className="w-2 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  // Slide 2 - Hook (Phone Conversation)
  if (card.type === "hook") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Dramatic background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ef4444]/15 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#ef4444]/5 via-transparent to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-7 pb-4">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
          {/* Phone notification mockup */}
          <div className="relative mb-6">
            {/* Phone outline */}
            <div
              className="relative w-full max-w-[340px] rounded-3xl border border-white/10 p-5 pb-7"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              }}
            >
              {/* Notification bubbles */}
              <div className="space-y-4">
                {/* Message 1 */}
                <div className="flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-full bg-[#375DEE]/30 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                      <p className={`${inter.className} text-white/90 text-lg font-medium`}>Hey, is the Lambo available this weekend?</p>
                    </div>
                    <p className={`${inter.className} text-white/30 text-sm mt-1.5 ml-2`}>2 hours ago</p>
                  </div>
                </div>

                {/* Message 2 */}
                <div className="flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-full bg-[#375DEE]/30 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                      <p className={`${inter.className} text-white/90 text-lg font-medium`}>Hello? Still interested...</p>
                    </div>
                    <p className={`${inter.className} text-white/30 text-sm mt-1.5 ml-2`}>45 min ago</p>
                  </div>
                </div>

                {/* Message 3 - Went elsewhere */}
                <div className="flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-full bg-[#ef4444]/30 flex-shrink-0" />
                  <div className="flex-1">
                    <div
                      className="bg-[#ef4444]/10 rounded-2xl rounded-tl-sm px-4 py-3 border border-[#ef4444]/20"
                    >
                      <p className={`${inter.className} text-white/90 text-lg font-medium`}>Nvm, booked somewhere else.</p>
                    </div>
                    <p className={`${inter.className} text-[#ef4444]/70 text-sm mt-1.5 ml-2`}>Just now</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Red X overlay */}
            <div
              className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)'
              }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <h1
            className={`${syne.className} text-3xl font-bold text-center leading-tight`}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            This is costing you
          </h1>
          <h2
            className={`${syne.className} text-5xl font-bold text-center mt-1`}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.4))'
            }}
          >
            thousands.
          </h2>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ef4444]/50 to-transparent" />
      </div>
    );
  }

  // Slide 2 - Problem Stat
  if (card.type === "problem-stat") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Clock/timer visual element */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[300px] h-[300px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-[#ef4444]/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-[#ef4444]/10 blur-[40px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-7">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 -mt-6">
          {/* Timer icon */}
          <div className="mb-6">
            <svg className="w-16 h-16 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Giant stat */}
          <h1
            className={`${syne.className} text-8xl font-bold leading-none mb-4`}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.3))'
            }}
          >
            {card.stat}
          </h1>

          {/* Label */}
          <p className={`${syne.className} text-white text-2xl font-bold text-center mb-4`}>
            {card.label}
          </p>

          {/* Description */}
          <p className={`${inter.className} text-white/40 text-base text-center max-w-[300px] leading-relaxed`}>
            {card.description}
          </p>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ef4444]/40 to-transparent" />
      </div>
    );
  }

  // Slide 4 - Transition
  if (card.type === "transition") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Background - subtle blue glow */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#375DEE]/15 rounded-full blur-[120px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-7">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
          {/* Top line - the problem */}
          <p
            className={`${syne.className} text-3xl font-bold text-center text-white/40 mb-2`}
          >
            {card.topLine}
          </p>
          <p
            className={`${syne.className} text-3xl font-bold text-center text-white/40 mb-12`}
          >
            {card.bottomLine}
          </p>

          {/* Simple divider line */}
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#375DEE]/50 to-transparent mb-12" />

          {/* Bottom line - the solution teaser */}
          <h2
            className={`${syne.className} text-5xl font-bold text-center`}
            style={{
              background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 50%, #93B4FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(55, 93, 238, 0.5))'
            }}
          >
            {card.connector}
          </h2>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#375DEE]/60 to-transparent" />
      </div>
    );
  }

  // Slide 5 - Solution
  if (card.type === "solution") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Glowing orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="relative z-10 p-7">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-8">
          {/* Headline */}
          <div className="text-center mb-5">
            <h2
              className={`${syne.className} text-4xl font-bold`}
              style={{
                background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(55, 93, 238, 0.4))'
              }}
            >
              {card.headline}
            </h2>
          </div>

          {/* Features list */}
          <div className="flex-1 flex flex-col justify-start gap-4 pt-8">
            {card.features?.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm"
                style={{
                  boxShadow: '0 0 20px rgba(55, 93, 238, 0.1)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(55, 93, 238, 0.3) 0%, rgba(55, 93, 238, 0.1) 100%)',
                    boxShadow: '0 0 20px rgba(55, 93, 238, 0.3)'
                  }}
                >
                  <svg className="w-5 h-5 text-[#6B8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className={`${inter.className} text-white text-lg font-medium`}>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Slide 6 - Detailed Dashboard
  if (card.type === "dashboard-detailed") {
    const dashboardFeatures = [
      { icon: "zap", label: "Instant Auto-Reply", detail: "Responds in under 30 seconds" },
      { icon: "link", label: "Auto Deposit Links", detail: "One-tap payment collection" },
      { icon: "message", label: "Custom Scripts", detail: "Your voice, automated" },
      { icon: "sliders", label: "100% Customizable", detail: "Your brand, your rules" },
    ];

    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#375DEE]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-[#8B5CF6]/10 rounded-full blur-[80px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-7">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col px-5 pb-6">
          {/* Headline */}
          <div className="text-center mb-6">
            <p className={`${inter.className} text-[#375DEE] text-sm font-semibold tracking-widest uppercase mb-2`}>
              Your Dashboard
            </p>
            <h2 className={`${syne.className} text-white text-4xl font-bold`}>
              {card.headline}
            </h2>
          </div>

          {/* Feature grid - 2x2 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {dashboardFeatures.map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/10"
                style={{
                  background: 'linear-gradient(180deg, rgba(55, 93, 238, 0.08) 0%, rgba(55, 93, 238, 0.02) 100%)'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(55, 93, 238, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                    boxShadow: '0 0 20px rgba(55, 93, 238, 0.2)'
                  }}
                >
                  {feature.icon === "message" && (
                    <svg className="w-7 h-7 text-[#6B8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                  {feature.icon === "zap" && (
                    <svg className="w-7 h-7 text-[#6B8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {feature.icon === "link" && (
                    <svg className="w-7 h-7 text-[#6B8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                  {feature.icon === "sliders" && (
                    <svg className="w-7 h-7 text-[#6B8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  )}
                </div>
                <h3 className={`${syne.className} text-white text-lg font-bold text-center mb-1`}>
                  {feature.label}
                </h3>
                <p className={`${inter.className} text-white/50 text-sm text-center`}>
                  {feature.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Slide 5 - Specific CTA
  if (card.type === "cta-specific") {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#375DEE]/10 via-transparent to-[#375DEE]/5" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="relative z-10 p-7">
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 -mt-6">
          {/* Big stat */}
          <div className="mb-4">
            <h1
              className={`${syne.className} text-7xl font-bold`}
              style={{
                background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 50%, #93B4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(55, 93, 238, 0.5))'
              }}
            >
              {card.stat}
            </h1>
          </div>

          <h2 className={`${syne.className} text-white text-2xl font-bold text-center mb-3 leading-snug`}>
            {card.headline}
          </h2>

          <p className={`${inter.className} text-white/50 text-base text-center mb-10 max-w-[280px]`}>
            {card.subtext}
          </p>

          {/* CTA Button */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#375DEE] rounded-full blur-xl opacity-50" />
            <div className="relative flex items-center gap-3 px-10 py-4 rounded-full bg-[#375DEE] border border-white/20 shadow-[0_0_40px_rgba(55,93,238,0.4)]">
              <span className={`${syne.className} text-white text-xl font-bold`}>
                {card.cta}
              </span>
              {icons.arrowRight}
            </div>
          </div>

          {/* Bottom tagline */}
          <p className={`${inter.className} text-white/30 text-sm mt-6`}>
            Only pay when you get results
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function CarouselPage() {
  const [currentCard, setCurrentCard] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const goToPrev = () => {
    setCurrentCard(Math.max(0, currentCard - 1));
  };

  const goToNext = () => {
    setCurrentCard(Math.min(carouselCards.length - 1, currentCard + 1));
  };

  const downloadCard = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress("Capturing slide...");

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const dataUrl = await domToPng(cardRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0f',
        fetch: {
          requestInit: {
            mode: 'cors',
            cache: 'force-cache',
          },
        },
        onCloneNode: (node: Node) => {
          if (node instanceof HTMLElement) {
            const computed = window.getComputedStyle(node);
            if (computed.display === 'flex') {
              node.style.display = 'flex';
              node.style.flexDirection = computed.flexDirection;
              node.style.justifyContent = computed.justifyContent;
              node.style.alignItems = computed.alignItems;
              node.style.gap = computed.gap;
            }
            if (computed.display === 'grid') {
              node.style.display = 'grid';
              node.style.gridTemplateColumns = computed.gridTemplateColumns;
              node.style.gap = computed.gap;
            }
            node.style.marginTop = computed.marginTop;
            node.style.marginBottom = computed.marginBottom;
            node.style.marginLeft = computed.marginLeft;
            node.style.marginRight = computed.marginRight;
            node.style.paddingTop = computed.paddingTop;
            node.style.paddingBottom = computed.paddingBottom;
            node.style.paddingLeft = computed.paddingLeft;
            node.style.paddingRight = computed.paddingRight;
          }
          return node;
        },
      });

      setDownloadProgress("Downloading...");

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `scale-exotics-ai-followup-${currentCard + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
      setDownloadProgress("");

    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Download failed. Please try again.');
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

  return (
    <div className={`${inter.className} h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6`}>
      {/* Card Container */}
      <div className="relative h-full max-h-[90vh] flex flex-col items-center justify-center">
        {/* Navigation */}
        <div className="absolute -top-2 left-0 right-0 flex items-center justify-between text-white/60 z-10" style={{ width: 'calc(90vh * 0.75)', maxWidth: '540px', margin: '0 auto' }}>
          <button
            onClick={goToPrev}
            className="flex items-center gap-2 hover:text-white transition-colors disabled:opacity-30 px-4 py-2 rounded-lg hover:bg-white/10"
            disabled={currentCard === 0}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <span className="text-sm font-medium">
            {currentCard + 1} / {carouselCards.length}
          </span>
          <button
            onClick={goToNext}
            className="flex items-center gap-2 hover:text-white transition-colors disabled:opacity-30 px-4 py-2 rounded-lg hover:bg-white/10"
            disabled={currentCard === carouselCards.length - 1}
          >
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Card wrapper */}
        <div
          ref={cardRef}
          className="p-3 bg-[#0a0a0f]"
        >
          <div
            className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(55,93,238,0.2)]"
            style={{
              height: 'calc(90vh - 84px)',
              width: 'calc((90vh - 84px) * 0.75)',
              maxWidth: '540px',
              maxHeight: '720px',
            }}
          >
            <CarouselCard card={carouselCards[currentCard]} index={currentCard} />
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={downloadCard}
          disabled={isDownloading}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(55,93,238,0.4)]"
        >
          {icons.download}
          {isDownloading
            ? (downloadProgress || 'Downloading...')
            : 'Download PNG'
          }
        </button>
      </div>
    </div>
  );
}
