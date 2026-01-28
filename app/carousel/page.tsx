"use client";

import { useState, useRef } from "react";
import { Inter, DM_Serif_Display } from "next/font/google";
import Image from "next/image";
import { domToPng } from "modern-screenshot";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"] });
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

// Signs You've Outgrown Instagram DMs
const carouselCards = [
  {
    id: 1,
    type: "cover",
  },
  {
    id: 2,
    type: "fact",
    statement: "You're finding leads 3 days late.",
    detail: "By then, they've already booked somewhere else.",
  },
  {
    id: 3,
    type: "fact",
    statement: "When someone goes quiet, they're gone.",
    detail: "No reminders. No follow-up. No second chance.",
  },
  {
    id: 4,
    type: "fact",
    statement: "You have no idea what's actually working.",
    detail: "Which posts convert? Which don't? You're guessing.",
  },
  {
    id: 5,
    type: "cta",
    headline: "DMs got you here.",
    headline2: "A system gets you further.",
    cta: "Link in Bio",
  },
];

// Card Component
function CarouselCard({ card, index }: { card: typeof carouselCards[0]; index: number }) {

  // Shared grain texture
  const grainOverlay = (
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }} />
  );

  // Slide 1 - Cover (Editorial professional style)
  if (card.type === "cover") {
    return (
      <div className="relative w-full h-full bg-[#06060a] flex flex-col overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#375DEE]/18 rounded-full blur-[200px]" />

        {grainOverlay}

        {/* Top bar */}
        <div className="relative z-10 px-10 pt-10 flex items-center justify-between">
          <Image src="/scalexoticslogo.png" alt="Scale Exotics" width={52} height={52} className="w-13 h-13 object-contain" />
          <span className={`${inter.className} text-white/40 text-xs font-medium tracking-[0.25em] uppercase`}>
            @scaleexotics
          </span>
        </div>

        {/* Main content - centered and large */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
          <h1 className={`${serif.className} text-white text-[4.5rem] leading-[1.05]`}>
            Signs You've
          </h1>
          <h1 className={`${serif.className} text-white text-[4.5rem] leading-[1.05]`}>
            Outgrown
          </h1>
          <h1
            className={`${serif.className} text-[5.5rem] leading-[1] mt-2`}
            style={{
              color: '#375DEE',
              filter: 'drop-shadow(0 0 80px rgba(55, 93, 238, 0.7))'
            }}
          >
            Instagram
          </h1>
          <h1
            className={`${serif.className} text-[5.5rem] leading-[1]`}
            style={{
              color: '#375DEE',
              filter: 'drop-shadow(0 0 80px rgba(55, 93, 238, 0.7))'
            }}
          >
            DMs
          </h1>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10 flex justify-center pb-10">
          <div className="w-24 h-[3px] bg-[#375DEE]" />
        </div>
      </div>
    );
  }

  // Fact slides - Bold statements
  if (card.type === "fact") {
    return (
      <div className="relative w-full h-full bg-[#06060a] flex flex-col overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#375DEE]/15 rounded-full blur-[180px]" />

        {grainOverlay}

        {/* Vertical line accent */}
        <div className="absolute left-8 top-24 bottom-24 w-[2px] bg-gradient-to-b from-[#375DEE] via-[#375DEE]/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-8 pl-14 pt-12">
          <Image src="/scalexoticslogo.png" alt="Scale Exotics" width={44} height={44} className="w-11 h-11 object-contain opacity-70" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pl-14 pr-10">
          {/* Statement */}
          <h1
            className={`${serif.className} text-[2.75rem] leading-[1.15] mb-8`}
            style={{
              color: 'white',
              textShadow: '0 0 80px rgba(55, 93, 238, 0.2)'
            }}
          >
            {card.statement}
          </h1>

          {/* Detail */}
          <p className={`${inter.className} text-white/45 text-[1.6rem] leading-relaxed`}>
            {card.detail}
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-8 pl-14 pb-12">
          <div className="w-12 h-[3px] bg-[#375DEE]/60" />
        </div>
      </div>
    );
  }

  // CTA slide
  if (card.type === "cta") {
    return (
      <div className="relative w-full h-full bg-[#06060a] flex flex-col overflow-hidden">
        {/* Centered glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#375DEE]/20 rounded-full blur-[200px]" />

        {grainOverlay}

        {/* Vertical line accent */}
        <div className="absolute left-8 top-24 bottom-24 w-[2px] bg-gradient-to-b from-[#375DEE] via-[#375DEE]/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-8 pl-14 pt-12">
          <Image src="/scalexoticslogo.png" alt="Scale Exotics" width={44} height={44} className="w-11 h-11 object-contain opacity-80" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pl-14">
          <h1 className={`${serif.className} text-[2.75rem] text-white/60 leading-[1.2] mb-2`}>
            {card.headline}
          </h1>
          <h1
            className={`${serif.className} text-[2.75rem] leading-[1.2] mb-12`}
            style={{
              color: 'white',
              textShadow: '0 0 60px rgba(55, 93, 238, 0.3)'
            }}
          >
            {card.headline2}
          </h1>

          {/* CTA Button */}
          <div className="relative inline-flex self-start">
            <div className="absolute inset-0 bg-[#375DEE] rounded-full blur-3xl opacity-40" />
            <div
              className="relative flex items-center gap-4 px-10 py-5 rounded-full border border-white/10"
              style={{
                background: 'linear-gradient(135deg, #375DEE 0%, #2a4bc7 100%)',
                boxShadow: '0 0 60px rgba(55, 93, 238, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <span className={`${inter.className} text-white text-2xl font-medium tracking-wide`}>
                {card.cta}
              </span>
              <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-8 pl-14 pb-12">
          <div className="w-20 h-[3px] bg-[#375DEE]" />
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
        backgroundColor: '#0c0c14',
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
      link.download = `scale-exotics-outgrown-dms-${currentCard + 1}.png`;
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

  const downloadAll = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    for (let i = 0; i < carouselCards.length; i++) {
      setCurrentCard(i);
      setDownloadProgress(`Downloading ${i + 1}/${carouselCards.length}...`);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (!cardRef.current) continue;

      try {
        const dataUrl = await domToPng(cardRef.current, {
          scale: 2,
          backgroundColor: '#0c0c14',
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

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `scale-exotics-outgrown-dms-${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`Error downloading card ${i + 1}:`, error);
      }
    }

    setIsDownloading(false);
    setDownloadProgress("");
  };

  return (
    <div className={`${inter.className} h-screen bg-[#0c0c14] text-white flex items-center justify-center p-6`}>
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
          className="p-3 bg-[#0c0c14]"
        >
          <div
            className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(91,127,255,0.25)]"
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

        {/* Download buttons */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={downloadCard}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(55,93,238,0.4)]"
          >
            {icons.download}
            {isDownloading && downloadProgress.includes(`/${carouselCards.length}`)
              ? downloadProgress
              : 'Download PNG'
            }
          </button>
          <button
            onClick={downloadAll}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          >
            {isDownloading ? downloadProgress : 'Download All'}
          </button>
        </div>
      </div>
    </div>
  );
}
