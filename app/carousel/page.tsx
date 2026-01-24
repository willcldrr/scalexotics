"use client";

import { useState, useRef } from "react";
import { Inter, Syne } from "next/font/google";
import Image from "next/image";
import { domToPng } from "modern-screenshot";

const syne = Syne({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

// SVG Icons
const icons = {
  megaphone: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
    </svg>
  ),
  target: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  refresh: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  play: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  check: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  download: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

// Background images (only for first and last slide)
const bgImages = {
  title: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200",
  convert: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
};

// Lead Funnel Carousel Cards
const leadFunnelCards = [
  {
    id: 1,
    type: "title",
    headline: "Stop Chasing Leads.",
    subheadline: "Start Closing Deals.",
    description: "The automated funnel system built for car rental fleets.",
    bgImage: bgImages.title,
  },
  {
    id: 2,
    type: "funnel-stage",
    stage: "01",
    stageName: "Awareness",
    headline: "Precision Targeting",
    points: [
      "Reach high intent renters in your market",
      "Data driven audience segments",
      "Luxury lifestyle positioning",
    ],
    icon: "megaphone",
    description: "Your fleet appears in front of buyers ready to book, not just scroll.",
  },
  {
    id: 3,
    type: "funnel-stage",
    stage: "02",
    stageName: "Capture",
    headline: "Zero Lead Leakage",
    points: [
      "Instant qualification on entry",
      "Automated scoring & routing",
      "CRM sync in real time",
    ],
    icon: "target",
    description: "Every inquiry captured. Every lead qualified. Nothing falls through.",
  },
  {
    id: 4,
    type: "video-example",
    stage: "03",
    headline: "Ads That Convert",
    description: "High performing creative that stops the scroll.",
    videoSrc: "/adexample.mp4",
  },
  {
    id: 5,
    type: "funnel-stage",
    stage: "04",
    stageName: "Nurture",
    headlineLine1: "Automated",
    headlineLine2: "Follow Up",
    points: [
      "AI powered SMS sequences",
      "Behavior triggered emails",
      "Intelligent retargeting",
    ],
    icon: "refresh",
    description: "80% of bookings come from follow up. We handle it automatically.",
  },
  {
    id: 6,
    type: "conversion",
    stage: "05",
    stageName: "Convert",
    headline: "Bookings on Autopilot",
    stats: [
      { value: "3-5x", label: "Return on Ad Spend" },
      { value: "48h", label: "Lead to Booking" },
      { value: "90%", label: "Show Rate" },
    ],
    cta: "Link in Bio",
    bgImage: bgImages.convert,
  },
];

// Consistent design tokens - 1.3x text scale
const design = {
  padding: "p-7",
  paddingX: "px-7",
  paddingY: "py-7",
  logoSize: "w-11 h-11",
  headingSize: "text-4xl",
  subheadingSize: "text-base",
  bodySize: "text-xl",
  stageNumberSize: "text-9xl",
  iconSize: "w-14 h-14",
  gap: "gap-4",
};

// Card Component
function CarouselCard({ card, index }: { card: typeof leadFunnelCards[0]; index: number }) {
  // Title Card - Slide 1
  if (card.type === "title") {
    return (
      <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
        {/* Background Image with darker overlay */}
        <div className="absolute inset-0">
          <Image
            src={card.bgImage!}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" />
        </div>

        {/* Glow effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#375DEE]/20 rounded-full blur-[100px]" />

        {/* Logo */}
        <div className={`relative z-10 ${design.padding}`}>
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className={`${design.logoSize} object-contain`}
          />
        </div>

        {/* Content */}
        <div className={`relative z-10 flex-1 flex flex-col justify-center ${design.paddingX} -mt-8`}>
          <h1
            className={`${syne.className} text-white text-6xl font-bold leading-[1.05] mb-1`}
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
          >
            {card.headline}
          </h1>
          <h2
            className={`${syne.className} text-6xl font-bold leading-[1.05] mb-6`}
            style={{
              background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 20px rgba(55, 93, 238, 0.4))'
            }}
          >
            {card.subheadline}
          </h2>
          <p className={`${inter.className} text-white/50 ${design.bodySize} leading-relaxed max-w-[90%]`}>
            {card.description}
          </p>
        </div>
      </div>
    );
  }

  // Funnel Stage Card - Slides 2, 3, 5
  if (card.type === "funnel-stage") {
    const IconComponent = icons[card.icon as keyof typeof icons];
    const isSlide5 = index === 4;

    return (
      <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
        {/* Consistent gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/10 via-black to-black" />
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#375DEE]/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-20 -left-10 w-48 h-48 bg-[#375DEE]/10 rounded-full blur-[60px]" />
        </div>

        {/* Header */}
        <div className={`relative z-10 ${design.padding} flex items-start justify-between`}>
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className={`${design.logoSize} object-contain`}
          />

          {/* Stage number */}
          <div
            className={`${syne.className} ${design.stageNumberSize} font-bold leading-none -mt-2`}
            style={{
              background: 'linear-gradient(180deg, rgba(55,93,238,0.35) 0%, rgba(55,93,238,0.05) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {card.stage}
          </div>
        </div>

        {/* Content */}
        <div className={`relative z-10 flex-1 flex flex-col ${design.paddingX}`}>
          {/* Stage label with line */}
          <div className="flex items-center gap-3 mb-4">
            <p
              className={`${inter.className} text-[#375DEE] ${design.subheadingSize} font-semibold tracking-[0.2em] uppercase`}
              style={{ textShadow: '0 0 20px rgba(55, 93, 238, 0.4)' }}
            >
              {card.stageName}
            </p>
            <div className="flex-1 h-px bg-gradient-to-r from-[#375DEE]/40 to-transparent" />
          </div>

          {/* Icon + Headline */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`${design.iconSize} rounded-xl bg-gradient-to-br from-[#375DEE]/25 to-[#375DEE]/10 border border-[#375DEE]/30 p-2.5 text-[#375DEE] shadow-[0_0_20px_rgba(55,93,238,0.2)]`}>
              {IconComponent}
            </div>
            {isSlide5 ? (
              <div>
                <h2
                  className={`${syne.className} text-white ${design.headingSize} font-bold leading-tight`}
                  style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}
                >
                  {card.headlineLine1}
                </h2>
                <h2
                  className={`${syne.className} text-white ${design.headingSize} font-bold leading-tight`}
                  style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}
                >
                  {card.headlineLine2}
                </h2>
              </div>
            ) : (
              <h2
                className={`${syne.className} text-white ${design.headingSize} font-bold leading-tight`}
                style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}
              >
                {card.headline}
              </h2>
            )}
          </div>

          {/* Points */}
          <div className="space-y-4 mb-6">
            {card.points?.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#375DEE]/35 to-[#375DEE]/15 border border-[#375DEE]/40 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-4 h-4 text-[#375DEE]">{icons.check}</div>
                </div>
                <p className={`${inter.className} text-white/80 ${design.bodySize} leading-relaxed`}>
                  {point}
                </p>
              </div>
            ))}
          </div>

          {/* Description at bottom */}
          <p className={`${inter.className} text-white/40 ${design.bodySize} leading-relaxed mt-auto pb-7`}>
            {card.description}
          </p>
        </div>
      </div>
    );
  }

  // Video Example Card - Slide 4 - Video as background
  if (card.type === "video-example") {
    return (
      <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            src={card.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Extremely dim overlay */}
          <div className="absolute inset-0 bg-black/85" />
          {/* Subtle blue glow */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#375DEE]/10 rounded-full blur-[80px]" />
        </div>

        {/* Header - matching other slides */}
        <div className={`relative z-10 ${design.padding} flex items-start justify-between`}>
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className={`${design.logoSize} object-contain`}
          />

          {/* Stage number */}
          <div
            className={`${syne.className} ${design.stageNumberSize} font-bold leading-none -mt-2`}
            style={{
              background: 'linear-gradient(180deg, rgba(55,93,238,0.35) 0%, rgba(55,93,238,0.05) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {card.stage}
          </div>
        </div>

        {/* Content - centered */}
        <div className={`relative z-10 flex-1 flex flex-col items-center justify-center ${design.paddingX} text-center`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-px bg-gradient-to-l from-[#375DEE]/40 to-transparent" />
            <p
              className={`${inter.className} text-[#375DEE] ${design.subheadingSize} font-semibold tracking-[0.2em] uppercase`}
              style={{ textShadow: '0 0 20px rgba(55, 93, 238, 0.4)' }}
            >
              Creative
            </p>
            <div className="w-16 h-px bg-gradient-to-r from-[#375DEE]/40 to-transparent" />
          </div>

          <h2
            className={`${syne.className} text-white ${design.headingSize} font-bold leading-tight mb-2`}
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}
          >
            {card.headline}
          </h2>
          <p className={`${inter.className} text-white/50 ${design.bodySize} max-w-[85%]`}>
            {card.description}
          </p>
        </div>
      </div>
    );
  }

  // Conversion/CTA Card - Slide 6
  if (card.type === "conversion") {
    return (
      <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
        {/* Background Image with dark overlay */}
        <div className="absolute inset-0">
          <Image
            src={card.bgImage!}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/75 to-black/90" />
        </div>

        {/* Glow effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#375DEE]/20 rounded-full blur-[80px]" />

        {/* Header */}
        <div className={`relative z-10 ${design.padding} flex items-start justify-between`}>
          <Image
            src="/scalexoticslogo.png"
            alt="Scale Exotics"
            width={44}
            height={44}
            className={`${design.logoSize} object-contain`}
          />

          {/* Stage number */}
          <div
            className={`${syne.className} ${design.stageNumberSize} font-bold leading-none -mt-2`}
            style={{
              background: 'linear-gradient(180deg, rgba(55,93,238,0.35) 0%, rgba(55,93,238,0.05) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {card.stage}
          </div>
        </div>

        {/* Content - moved up */}
        <div className={`relative z-10 flex-1 flex flex-col items-center ${design.paddingX} text-center pt-2`}>
          <p
            className={`${inter.className} text-[#375DEE] ${design.subheadingSize} font-semibold tracking-[0.2em] uppercase mb-3`}
            style={{ textShadow: '0 0 20px rgba(55, 93, 238, 0.4)' }}
          >
            {card.stageName}
          </p>

          <h2
            className={`${syne.className} text-white ${design.headingSize} font-bold mb-6`}
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
          >
            {card.headline}
          </h2>

          {/* Stats */}
          <div className="w-full space-y-2.5 mb-6">
            {card.stats?.map((stat, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <p className={`${inter.className} text-white/60 ${design.bodySize}`}>
                  {stat.label}
                </p>
                <p
                  className={`${syne.className} text-2xl font-bold`}
                  style={{
                    background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 8px rgba(55, 93, 238, 0.3))'
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* CTA - Link in Bio */}
          <div className="flex items-center gap-2">
            <span
              className={`${syne.className} text-[#375DEE] text-xl font-bold`}
              style={{ textShadow: '0 0 20px rgba(55, 93, 238, 0.4)' }}
            >
              {card.cta}
            </span>
            <div className="text-[#375DEE]">{icons.arrowRight}</div>
          </div>
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

  const isVideoSlide = leadFunnelCards[currentCard].type === "video-example";

  const goToPrev = () => {
    setCurrentCard(Math.max(0, currentCard - 1));
  };

  const goToNext = () => {
    setCurrentCard(Math.min(leadFunnelCards.length - 1, currentCard + 1));
  };

  const downloadVideoSlide = async () => {
    if (!cardRef.current) return;

    setDownloadProgress("Preparing video capture...");

    const video = cardRef.current.querySelector('video') as HTMLVideoElement;
    if (!video) {
      alert('Video not found');
      return;
    }

    // Get the INNER card dimensions
    const innerCard = cardRef.current.querySelector('.rounded-2xl') as HTMLElement;
    const innerRect = innerCard.getBoundingClientRect();
    const cardWidth = Math.round(innerRect.width);
    const cardHeight = Math.round(innerRect.height);

    // Add padding for the glow effect (p-3 = 12px on each side)
    const glowPadding = 12;
    const totalWidth = cardWidth + (glowPadding * 2);
    const totalHeight = cardHeight + (glowPadding * 2);

    // Create canvas for compositing at 2x scale
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d')!;

    // Constants for card positioning within canvas
    const cardX = glowPadding * scale;
    const cardY = glowPadding * scale;
    const cardW = cardWidth * scale;
    const cardH = cardHeight * scale;
    const borderRadius = 16 * scale; // rounded-2xl = 16px

    // Load the logo image
    setDownloadProgress("Loading assets...");
    const logoImg = new window.Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
      logoImg.src = '/scalexoticslogo.png';
    });

    // Load fonts
    await document.fonts.ready;

    // Get the current card data
    const cardData = leadFunnelCards[currentCard];

    // Set up MediaRecorder
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    // Record for the duration of the video (max 10 seconds)
    const recordDuration = Math.min(video.duration || 5, 10) * 1000;

    setDownloadProgress("Recording video...");

    // Start recording
    mediaRecorder.start();
    video.currentTime = 0;
    video.play();

    const startTime = Date.now();

    // Helper function to draw a rounded rectangle path
    const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    // Render loop
    const renderFrame = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < recordDuration && mediaRecorder.state === 'recording') {
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw outer glow shadow (shadow-[0_0_80px_rgba(55,93,238,0.3)])
        ctx.save();
        ctx.shadowColor = 'rgba(55, 93, 238, 0.35)';
        ctx.shadowBlur = 80 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        roundedRectPath(cardX, cardY, cardW, cardH, borderRadius);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.restore();

        // Create clipping path for rounded corners
        ctx.save();
        roundedRectPath(cardX, cardY, cardW, cardH, borderRadius);
        ctx.clip();

        // Draw video frame scaled to fill the card area (cover behavior)
        const videoAspect = video.videoWidth / video.videoHeight;
        const cardAspect = cardW / cardH;

        let drawWidth, drawHeight, drawX, drawY;

        if (videoAspect > cardAspect) {
          drawHeight = cardH;
          drawWidth = drawHeight * videoAspect;
          drawX = cardX + (cardW - drawWidth) / 2;
          drawY = cardY;
        } else {
          drawWidth = cardW;
          drawHeight = drawWidth / videoAspect;
          drawX = cardX;
          drawY = cardY + (cardH - drawHeight) / 2;
        }

        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        // Apply dark overlay (reduced from 85% to 75% for more vibrant colors)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Draw subtle blue glow (top right) within card
        const glowGradient = ctx.createRadialGradient(
          cardX + cardW - 40 * scale, cardY - 40 * scale, 0,
          cardX + cardW - 40 * scale, cardY - 40 * scale, 256 * scale
        );
        glowGradient.addColorStop(0, 'rgba(55, 93, 238, 0.15)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(cardX, cardY, cardW, cardH);

        ctx.restore(); // Restore from clip

        // Draw the text overlay (adjusted for card offset)
        ctx.save();
        ctx.translate(cardX, cardY);
        // Temporarily adjust drawTextOverlay to work within translated context
        const padding = 28 * scale; // p-7 = 28px

        // === HEADER SECTION ===
        // Draw logo (top left) - w-11 h-11 = 44px
        const logoSize = 44 * scale;
        ctx.drawImage(logoImg, padding, padding, logoSize, logoSize);

        // Draw stage number (top right) - text-9xl = 128px, with -mt-2 offset
        const stageNumSize = 128 * scale;
        ctx.font = `700 ${stageNumSize}px "Syne", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const stageGradient = ctx.createLinearGradient(
          cardW - padding,
          padding - (8 * scale),
          cardW - padding,
          padding - (8 * scale) + stageNumSize
        );
        stageGradient.addColorStop(0, 'rgba(55, 93, 238, 0.35)');
        stageGradient.addColorStop(1, 'rgba(55, 93, 238, 0.05)');
        ctx.fillStyle = stageGradient;
        ctx.fillText(cardData.stage || '03', cardW - padding, padding - (8 * scale));

        // === CENTERED CONTENT SECTION ===
        const centerY = cardH / 2;
        const creativeSize = 16 * scale;
        const headlineSize = 36 * scale;
        const descSize = 20 * scale;
        const gap1 = 16 * scale;
        const gap2 = 8 * scale;

        const contentHeight = creativeSize + gap1 + headlineSize + gap2 + descSize;
        const startY = centerY - contentHeight / 2;

        // Draw "Creative" label
        const creativeY = startY + creativeSize / 2;
        ctx.font = `600 ${creativeSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#375DEE';
        const creativeText = 'CREATIVE';
        const letterSpacing = 0.2 * creativeSize;
        let totalTextWidth = 0;
        for (let i = 0; i < creativeText.length; i++) {
          totalTextWidth += ctx.measureText(creativeText[i]).width + (i < creativeText.length - 1 ? letterSpacing : 0);
        }
        let xPos = cardW / 2 - totalTextWidth / 2;
        ctx.shadowColor = 'rgba(55, 93, 238, 0.4)';
        ctx.shadowBlur = 20 * scale;
        for (let i = 0; i < creativeText.length; i++) {
          ctx.fillText(creativeText[i], xPos + ctx.measureText(creativeText[i]).width / 2, creativeY);
          xPos += ctx.measureText(creativeText[i]).width + letterSpacing;
        }
        ctx.shadowBlur = 0;

        // Draw lines on either side
        const lineWidth = 64 * scale;
        const lineGap = 12 * scale;

        const leftLineStart = cardW / 2 - totalTextWidth / 2 - lineGap - lineWidth;
        const leftLineEnd = cardW / 2 - totalTextWidth / 2 - lineGap;
        const leftGradient = ctx.createLinearGradient(leftLineStart, 0, leftLineEnd, 0);
        leftGradient.addColorStop(0, 'transparent');
        leftGradient.addColorStop(1, 'rgba(55, 93, 238, 0.4)');
        ctx.strokeStyle = leftGradient;
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(leftLineStart, creativeY);
        ctx.lineTo(leftLineEnd, creativeY);
        ctx.stroke();

        const rightLineStart = cardW / 2 + totalTextWidth / 2 + lineGap;
        const rightLineEnd = cardW / 2 + totalTextWidth / 2 + lineGap + lineWidth;
        const rightGradient = ctx.createLinearGradient(rightLineStart, 0, rightLineEnd, 0);
        rightGradient.addColorStop(0, 'rgba(55, 93, 238, 0.4)');
        rightGradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = rightGradient;
        ctx.beginPath();
        ctx.moveTo(rightLineStart, creativeY);
        ctx.lineTo(rightLineEnd, creativeY);
        ctx.stroke();

        // Draw headline
        const headlineY = creativeY + creativeSize / 2 + gap1 + headlineSize / 2;
        ctx.font = `700 ${headlineSize}px "Syne", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 15 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillText(cardData.headline || 'Ads That Convert', cardW / 2, headlineY);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw description
        const descY = headlineY + headlineSize / 2 + gap2 + descSize / 2;
        ctx.font = `400 ${descSize}px "Inter", sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(cardData.description || 'High performing creative that stops the scroll.', cardW / 2, descY);

        ctx.restore(); // Restore from translate

        // Draw border (border-white/20) on top
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2 * scale;
        roundedRectPath(cardX, cardY, cardW, cardH, borderRadius);
        ctx.stroke();

        // Update progress
        const progress = Math.round((elapsed / recordDuration) * 100);
        setDownloadProgress(`Recording: ${progress}%`);

        requestAnimationFrame(renderFrame);
      } else {
        // Stop recording
        mediaRecorder.stop();
        video.pause();
      }
    };

    requestAnimationFrame(renderFrame);

    // Wait for recording to finish
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

    setDownloadProgress("Processing video...");

    // Create blob and download
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scale-exotics-slide-${currentCard + 1}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCard = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress("Capturing slide...");

    try {
      if (isVideoSlide) {
        await downloadVideoSlide();
        setIsDownloading(false);
        setDownloadProgress("");
        return;
      }

      // Wait for any animations/fonts to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      const dataUrl = await domToPng(cardRef.current, {
        scale: 2,
        backgroundColor: '#000000',
        // Use fetch for external resources
        fetch: {
          requestInit: {
            mode: 'cors',
            cache: 'force-cache',
          },
        },
        // Inline all styles to preserve exact rendering
        onCloneNode: (node: Node) => {
          if (node instanceof HTMLElement) {
            // Get computed styles and inline them
            const computed = window.getComputedStyle(node);

            // Preserve flex layouts explicitly
            if (computed.display === 'flex') {
              node.style.display = 'flex';
              node.style.flexDirection = computed.flexDirection;
              node.style.justifyContent = computed.justifyContent;
              node.style.alignItems = computed.alignItems;
              node.style.gap = computed.gap;
            }

            // Preserve margins (including negative ones)
            node.style.marginTop = computed.marginTop;
            node.style.marginBottom = computed.marginBottom;
            node.style.marginLeft = computed.marginLeft;
            node.style.marginRight = computed.marginRight;

            // Preserve padding
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
      link.download = `scale-exotics-slide-${currentCard + 1}.png`;
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
    <div className={`${inter.className} h-screen bg-black text-white flex items-center justify-center p-6`}>
      {/* Card Container - Fixed 3:4 aspect ratio */}
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
            {currentCard + 1} / {leadFunnelCards.length}
          </span>
          <button
            onClick={goToNext}
            className="flex items-center gap-2 hover:text-white transition-colors disabled:opacity-30 px-4 py-2 rounded-lg hover:bg-white/10"
            disabled={currentCard === leadFunnelCards.length - 1}
          >
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Card wrapper with padding for glow capture */}
        <div
          ref={cardRef}
          className="p-3 bg-black"
        >
          {/* Card - 3:4 aspect ratio (width:height = 3:4) */}
          <div
            className="rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_80px_rgba(55,93,238,0.3)]"
            style={{
              height: 'calc(90vh - 84px)',
              width: 'calc((90vh - 84px) * 0.75)',
              maxWidth: '540px',
              maxHeight: '720px',
            }}
          >
            <CarouselCard card={leadFunnelCards[currentCard]} index={currentCard} />
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
            : isVideoSlide ? 'Download Video' : 'Download PNG'
          }
        </button>
      </div>
    </div>
  );
}
