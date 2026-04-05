"use client"

import { useState, useRef, useEffect } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function HeroSection1() {
  const [chatActive, setChatActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState("")

  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Only scroll within the messages container, never the page
    const container = messagesContainerRef.current
    if (container && messages.length > 0) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isTyping])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    setInput("")
    setError("")

    if (!chatActive) setChatActive(true)

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setIsTyping(true)

    try {
      const res = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (res.status === 429) {
        setError("Rate limit reached. Try again in a minute.")
        setIsTyping(false)
        return
      }

      if (!res.ok) throw new Error("Failed")

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch {
      setError("Something went wrong. Try again.")
    }

    setIsTyping(false)
  }

  const resetDemo = () => {
    setChatActive(false)
    setMessages([])
    setError("")
    setTimeout(() => inputRef.current?.focus(), 500)
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-black text-white overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        @keyframes slowDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.98); }
        }
        @keyframes slowDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 20px) scale(1.08); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* ============================================================= */}
      {/* LUXURY BACKGROUND                                              */}
      {/* ============================================================= */}

      {/* Deep base with subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, #0a0a0a 0%, #000000 70%),
            linear-gradient(180deg, #050505 0%, #000000 100%)
          `,
        }}
      />

      {/* Large ambient spotlight — top left */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-30%',
          left: '-20%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'slowDrift 20s ease-in-out infinite',
        }}
      />

      {/* Secondary ambient glow — bottom right */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-30%',
          right: '-20%',
          width: '70%',
          height: '70%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'slowDrift2 25s ease-in-out infinite',
        }}
      />

      {/* Diagonal light streaks — like carbon fiber/lens flare */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(105deg,
              transparent 0%,
              transparent 35%,
              rgba(255,255,255,0.015) 40%,
              rgba(255,255,255,0.025) 50%,
              rgba(255,255,255,0.015) 60%,
              transparent 65%,
              transparent 100%
            )
          `,
          animation: 'shimmer 12s ease-in-out infinite',
        }}
      />

      {/* Perspective grid — like a showroom floor */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(0deg, transparent 48%, rgba(255,255,255,0.025) 49.5%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.025) 50.5%, transparent 52%),
            linear-gradient(0deg, transparent 58%, rgba(255,255,255,0.015) 59.5%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.015) 60.5%, transparent 62%),
            linear-gradient(0deg, transparent 68%, rgba(255,255,255,0.01) 69.5%, rgba(255,255,255,0.015) 70%, rgba(255,255,255,0.01) 70.5%, transparent 72%)
          `,
          maskImage: 'linear-gradient(180deg, transparent 40%, black 55%, black 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 40%, black 55%, black 100%)',
        }}
      />

      {/* Film grain texture via noise SVG */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle vignette edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ============================================================= */}
      {/* MAIN CONTENT — simple flex column                              */}
      {/* ============================================================= */}
      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full px-6 pt-20 pb-8">

        {/* Top area: header + messages */}
        <div className="flex-1 flex flex-col justify-center min-h-0">

          {/* Header — fades out on chat, keeps layout space */}
          <div
            className="text-center flex flex-col items-center"
            style={{
              opacity: chatActive ? 0 : 1,
              transition: "opacity 500ms ease",
              pointerEvents: chatActive ? "none" : "auto",
            }}
          >
            <p
              className="mb-10 text-[11px] font-medium text-white/40 uppercase"
              style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.35em" }}
            >
              Meet Velocity
            </p>

            <h1
              className="text-center text-5xl font-light tracking-tight md:text-8xl"
              style={{
                fontFamily: "var(--font-display)",
                background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.78) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 40px rgba(255,255,255,0.12))",
              }}
            >
              The AI that <span style={{ fontWeight: 600 }}>closes</span> rentals.
            </h1>

            <p
              className="mt-6 text-xl tracking-wide text-white/50"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Responds in seconds. Qualifies leads. Sends payment links.
            </p>
          </div>

          {/* Messages — only rendered when chat is active, normal flow */}
          {chatActive && (
            <div
              ref={messagesContainerRef}
              className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] py-4 mt-4"
              style={{ overscrollBehavior: "contain" }}
            >
              <div className="flex justify-end">
                <button
                  onClick={resetDemo}
                  className="text-[10px] text-white/20 hover:text-white/50 transition-colors tracking-[0.15em] uppercase"
                >
                  Reset demo
                </button>
              </div>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animation: "fadeUp 250ms ease both" }}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 text-[15px] leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-md bg-white text-black"
                        : "rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06] text-white/90 backdrop-blur-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start" style={{ animation: "fadeUp 200ms ease both" }}>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06] px-4 py-3.5 backdrop-blur-sm">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="inline-block h-[5px] w-[5px] rounded-full bg-white/30"
                        style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-center text-sm text-white/30">{error}</p>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chatbox at bottom — normal flow */}
        <div className="shrink-0 w-full">
          <div
            className="relative w-full"
            style={{
              boxShadow: chatActive
                ? "none"
                : "0 0 40px rgba(255,255,255,0.06), 0 0 80px rgba(255,255,255,0.03)",
              borderRadius: "1rem",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendMessage() } }}
              placeholder={isTyping ? "" : chatActive ? "Type a message..." : "Ask about renting a car..."}
              disabled={isTyping}
              className={`w-full rounded-2xl border bg-white/[0.02] px-6 text-[15px] text-white placeholder-white/25 caret-white outline-none transition-all duration-500 disabled:opacity-40 ${
                chatActive
                  ? "py-4 border-white/[0.06] focus:border-white/[0.12]"
                  : "pt-16 pb-4 border-white/[0.10] focus:border-white/[0.18] focus:bg-white/[0.04]"
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className={`absolute right-4 flex items-center justify-center rounded-xl text-white/20 transition-all duration-300 hover:text-white disabled:hover:text-white/20 ${
                chatActive ? "top-1/2 -translate-y-1/2 h-8 w-8" : "bottom-3 h-9 w-9"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {chatActive && messages.length > 0 && (
            <p className="mt-3 text-center text-[11px] text-white/15">
              Live AI demo
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
