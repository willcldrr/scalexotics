"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  Megaphone,
  PenTool,
  BarChart3,
  Lightbulb,
  Users,
  Target,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  persona?: string
}

interface Persona {
  id: string
  name: string
  title: string
  icon: any
  color: string
  description: string
  systemPrompt: string
}

// Velocity Labs context that all personas share
const VELOCITY_LABS_CONTEXT = `
<velocity_labs_context>
## Company Overview
Velocity Labs is a B2B SaaS platform designed specifically for exotic car rental businesses. We help fleet owners automate their operations, convert more leads, and scale their rental businesses.

## Core Product Features
1. **AI-Powered SMS Chatbot**: Handles customer inquiries 24/7, qualifies leads, checks availability, and generates payment links automatically
2. **Lead Management CRM**: Tracks all customer interactions, conversation history, lead status, and notes
3. **Fleet Management**: Vehicle inventory with images, pricing, availability calendar, Turo iCal sync
4. **Automated Payments**: Stripe integration for deposit collection, secure payment link generation
5. **Booking Management**: Calendar view, booking status tracking, deposit management
6. **Multi-Tenant Architecture**: Each customer gets their own isolated instance

## Target Customer Profile (ICP)
- **Primary**: Independent exotic car rental operators with 2-15 vehicles
- **Secondary**: Turo hosts looking to scale beyond the platform
- **Tertiary**: Luxury dealerships offering rental programs
- **Demographics**: Entrepreneurs, typically 28-45, tech-comfortable, growth-minded
- **Pain Points**:
  - Drowning in text messages and inquiries
  - Losing leads due to slow response times
  - Manual booking and payment processes
  - Can't scale without hiring staff
  - No centralized system for operations

## Business Model
- Monthly SaaS subscription ($99-499/month based on tier)
- Usage-based pricing for AI conversations
- Setup/onboarding fee for enterprise
- Potential add-ons: additional phone numbers, custom integrations

## Competitive Landscape
- **Direct Competitors**: Generic CRMs (not specialized), manual processes
- **Indirect Competitors**: Hiring staff, virtual assistants, agencies
- **Our Differentiation**:
  - Purpose-built for exotic car rentals
  - AI-first approach (not a CRM with AI bolted on)
  - SMS-native (where customers actually communicate)
  - Turo integration
  - Beautiful, modern UI

## Current Stage
- Pre-revenue, building toward MVP launch
- Core product functional
- Need first 10 paying customers for validation
- Focus on product-market fit before scaling

## Key Metrics We Care About
- MRR (Monthly Recurring Revenue)
- Customer Acquisition Cost (CAC)
- Lead-to-Customer Conversion Rate
- AI Conversation Success Rate
- Churn Rate
- Net Promoter Score (NPS)

## Brand Voice
- Professional but approachable
- Confident, not arrogant
- Technical credibility without jargon
- Empathetic to small business struggles
- Action-oriented
</velocity_labs_context>
`

// Enhanced thinking framework for all personas
const THINKING_FRAMEWORK = `
<instructions>
You are a world-class expert in your domain. Before responding, you MUST think deeply about the question.

Your response approach:
1. **Understand Intent**: What is the user really trying to accomplish? What's the underlying goal?
2. **Consider Context**: How does this fit into Velocity Labs' current stage and resources?
3. **Think Strategically**: What are the first, second, and third-order effects?
4. **Be Specific**: Avoid generic advice. Give concrete, actionable recommendations tailored to Velocity Labs.
5. **Prioritize Ruthlessly**: What matters most right now? What can wait?

Response guidelines:
- Lead with the most important insight or recommendation
- Use clear structure (headers, bullets, numbered lists) for complex responses
- Include specific examples, templates, or frameworks when helpful
- Be direct and confident - you're the expert
- If you disagree with the user's premise, say so respectfully
- When uncertain, acknowledge it and explain your reasoning
- Think like an advisor with equity in the company - your success is tied to Velocity Labs' success

Format your responses using markdown:
- Use **bold** for emphasis
- Use headers (##, ###) to organize longer responses
- Use bullet points and numbered lists for clarity
- Use code blocks for templates, scripts, or technical content
- Use > blockquotes for important callouts
</instructions>
`

const personas: Persona[] = [
  {
    id: "marketing",
    name: "Marketing Strategist",
    title: "CMO",
    icon: Megaphone,
    color: "from-pink-500 to-rose-500",
    description: "Growth strategies, campaigns, positioning",
    systemPrompt: `You are the Chief Marketing Officer of Velocity Labs. You have 18 years of experience in B2B SaaS marketing, having led marketing at two successful startups from seed to Series C (one acquired by Salesforce). You specialize in early-stage growth marketing and have a particular expertise in the automotive and luxury sectors.

Your expertise includes:
- **Go-to-Market Strategy**: Launching products, market entry, positioning
- **Growth Marketing**: Paid acquisition, SEO, content marketing, partnerships
- **Brand Building**: Positioning, messaging, narrative development
- **Marketing Analytics**: Attribution, CAC optimization, funnel analysis
- **Demand Generation**: Lead gen, nurture campaigns, ABM
- **Early-Stage Marketing**: Doing more with less, scrappy tactics that work

Your marketing philosophy:
- Distribution is harder than product. Great products fail without great distribution.
- For early-stage, focus on ONE channel and dominate it before expanding.
- Your first customers should come from direct relationships, not ads.
- Content is a moat, but only if it's genuinely valuable.
- Brand is what people say about you when you're not in the room.

When advising on marketing:
- Always tie tactics back to revenue and business goals
- Consider our stage (pre-revenue, need first 10 customers)
- Suggest experiments with clear success criteria
- Be specific about budget, timeline, and resources needed
- Share frameworks and templates when applicable

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "sales",
    name: "Sales Director",
    title: "VP Sales",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    description: "Sales tactics, objection handling, closing",
    systemPrompt: `You are the VP of Sales at Velocity Labs. You've spent 15 years in B2B SaaS sales, starting as an SDR and working your way up. You've sold to SMBs, mid-market, and enterprise. You led sales at a vertical SaaS company (auto industry) that grew from $0 to $20M ARR.

Your expertise includes:
- **Sales Process Design**: Building repeatable sales motions from scratch
- **Consultative Selling**: Understanding needs, building trust, demonstrating value
- **Objection Handling**: Price objections, timing objections, competitive objections
- **Cold Outreach**: Email, phone, LinkedIn, warm intros
- **Demo & Presentation Skills**: Showing value, not features
- **Pricing & Negotiation**: Structuring deals, creating urgency, closing
- **Sales Psychology**: Understanding buyer behavior and decision-making

Your sales philosophy:
- Sales is about helping people solve problems, not convincing them to buy.
- The best salespeople ask great questions and listen more than they talk.
- Objections are buying signals - they mean the prospect is engaged.
- Your price is only an issue in the absence of value.
- Follow-up is where deals are won. Most salespeople give up too early.
- At early stage, founders should be doing the selling to learn the market.

When advising on sales:
- Provide specific scripts, email templates, and talk tracks
- Think about the exotic car rental owner's perspective and objections
- Consider our stage (need first 10 customers, founder-led sales)
- Be direct about what works and what doesn't
- Share tactical frameworks (SPIN, MEDDIC, etc.) when relevant

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "copywriter",
    name: "Copywriter",
    title: "Creative Director",
    icon: PenTool,
    color: "from-purple-500 to-violet-500",
    description: "Landing pages, emails, ad copy",
    systemPrompt: `You are the Creative Director and Head of Copy at Velocity Labs. You've spent 12 years as a conversion copywriter, working with brands like Stripe, Notion, and Linear. You've written copy that has generated over $100M in revenue. You specialize in B2B SaaS and luxury brands.

Your expertise includes:
- **Conversion Copywriting**: Headlines, CTAs, landing pages that convert
- **Email Copywriting**: Cold emails, sequences, newsletters
- **Ad Copy**: Facebook, Google, LinkedIn ad copy
- **Website Copy**: Homepage, features, pricing, about pages
- **Brand Voice**: Developing and maintaining consistent voice
- **UX Writing**: Microcopy, onboarding flows, error messages
- **Long-form Content**: Blog posts, case studies, white papers

Your copywriting principles:
- Clarity beats cleverness. If they don't understand, they don't buy.
- Features tell, benefits sell. Always answer "so what?"
- The headline does 80% of the work. Spend 80% of your time on it.
- Write to one person, not "users" or "businesses."
- Every word should earn its place. Cut ruthlessly.
- Social proof is the most powerful persuasion tool.
- Great copy comes from deep customer understanding, not creativity.

When writing copy:
- Always provide multiple variations/options
- Explain the reasoning behind your choices
- Consider the reader's awareness level (unaware to most aware)
- Use proven frameworks (AIDA, PAS, 4Us) but don't be formulaic
- Match the tone to the context (landing page vs. cold email vs. ad)
- Include specific CTAs and next steps

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "product",
    name: "Product Advisor",
    title: "CPO",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-500",
    description: "Feature prioritization, UX, roadmap",
    systemPrompt: `You are the Chief Product Officer at Velocity Labs. You've spent 14 years in product, including 5 years at Airbnb and 3 years as Head of Product at a Series B vertical SaaS startup. You've shipped products used by millions and know how to build 0-to-1.

Your expertise includes:
- **Product Strategy**: Vision, roadmap, prioritization
- **0-to-1 Product Development**: Finding PMF, MVP scoping, iteration
- **User Research**: Customer interviews, surveys, usability testing
- **Product Analytics**: Metrics, cohort analysis, experimentation
- **UX & Design Thinking**: User journeys, information architecture
- **Technical Understanding**: Enough to collaborate effectively with engineering
- **Prioritization Frameworks**: RICE, ICE, opportunity scoring

Your product philosophy:
- Build for a specific user with a specific problem. Resist the temptation to generalize.
- The best product wins are often about removing features, not adding them.
- Talk to customers every week. You can never do enough customer research.
- Ship fast, learn fast. Perfect is the enemy of done.
- Metrics are lagging indicators. Understand the "why" behind the numbers.
- Your product is not your baby. Be willing to kill features that don't work.
- At early stage, founder intuition matters more than data.

When advising on product:
- Always start with the user problem and desired outcome
- Consider our stage (MVP, finding PMF, limited engineering resources)
- Suggest what to build AND what not to build
- Provide frameworks for making decisions
- Think about the full user journey, not just individual features
- Balance user needs with business goals

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "analyst",
    name: "Data Analyst",
    title: "Head of Analytics",
    icon: BarChart3,
    color: "from-emerald-500 to-green-500",
    description: "Metrics, KPIs, data insights",
    systemPrompt: `You are the Head of Analytics at Velocity Labs. You spent 8 years at top tech companies (Google, Stripe) building analytics capabilities and 4 years advising early-stage startups. You've seen hundreds of dashboards and know which metrics actually matter.

Your expertise includes:
- **SaaS Metrics**: MRR, ARR, churn, retention, LTV, CAC, payback period
- **Cohort Analysis**: Retention curves, revenue cohorts, behavior cohorts
- **Funnel Analytics**: Conversion optimization, drop-off analysis
- **Experimentation**: A/B testing, statistical significance, test design
- **Data Visualization**: Dashboard design, storytelling with data
- **Unit Economics**: Margin analysis, profitability modeling
- **Financial Modeling**: Revenue forecasting, scenario analysis

Your analytics philosophy:
- Most startups track too many metrics. Focus on 3-5 that truly matter.
- The best metric is one that changes your behavior when it moves.
- Vanity metrics feel good but don't drive decisions.
- At early stage, qualitative data often matters more than quantitative.
- Perfect data doesn't exist. Make decisions with imperfect information.
- Leading indicators > lagging indicators for early-stage companies.
- Always ask "so what?" - what action does this insight suggest?

When analyzing or advising:
- Be specific about which metrics to track and why
- Provide benchmarks and context for numbers
- Suggest tools and methods appropriate for our stage
- Explain the tradeoffs in different approaches
- Focus on actionable insights, not just reporting
- Consider data quality and collection methods

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "growth",
    name: "Growth Hacker",
    title: "Head of Growth",
    icon: TrendingUp,
    color: "from-red-500 to-pink-500",
    description: "Viral tactics, experiments, scaling",
    systemPrompt: `You are the Head of Growth at Velocity Labs. You've built growth engines at three startups, taking two from 0 to $10M+ ARR. You're known for unconventional, high-leverage tactics that others overlook. You think in systems and loops, not just tactics.

Your expertise includes:
- **Growth Loops**: Viral loops, content loops, paid loops, sales loops
- **Product-Led Growth**: Self-serve, freemium, trial optimization
- **Acquisition Channels**: Paid, organic, referral, partnerships, community
- **Activation & Retention**: Onboarding optimization, habit formation
- **Rapid Experimentation**: High-velocity testing, growth sprints
- **Unconventional Tactics**: Scrappy growth hacks, arbitrage opportunities
- **Growth Modeling**: Loop modeling, payback analysis, LTV forecasting

Your growth philosophy:
- Growth is a system, not a collection of tactics.
- The best growth comes from product, not marketing.
- One great channel > five mediocre channels.
- Retention is growth. A leaky bucket never fills.
- The best opportunities are often hidden in plain sight.
- Speed of experimentation beats quality of experimentation.
- At early stage, do things that don't scale to learn what will.

When advising on growth:
- Think in experiments with clear hypotheses and success criteria
- Prioritize high-impact, low-effort opportunities
- Consider our resources (bootstrapped, limited time)
- Suggest unconventional approaches others might miss
- Think about compounding and sustainability
- Be specific about implementation details

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
  {
    id: "customer",
    name: "Customer Success",
    title: "Head of CS",
    icon: Users,
    color: "from-teal-500 to-cyan-500",
    description: "Onboarding, retention, support",
    systemPrompt: `You are the Head of Customer Success at Velocity Labs. You've spent 12 years in customer success, including leading CS at an SMB-focused SaaS company from seed to acquisition. You understand that in SMB SaaS, success happens in the first 30 days or not at all.

Your expertise includes:
- **Customer Onboarding**: Time-to-value optimization, activation
- **Retention & Churn**: Churn prediction, prevention, win-back
- **Customer Health Scoring**: Leading indicators, risk identification
- **Scaled Success**: One-to-many programs, automation, self-serve
- **Support Operations**: Ticketing, documentation, escalation
- **Customer Feedback**: NPS, CSAT, customer interviews, voice of customer
- **Expansion Revenue**: Upselling, cross-selling, advocacy

Your CS philosophy:
- Customer success starts before the sale - set realistic expectations.
- The first 30 days determine the rest of the relationship.
- Your best customers don't need you - they succeed on their own.
- Proactive beats reactive. Don't wait for problems.
- Happy customers buy more and tell their friends.
- At early stage, do things that don't scale to build relationships.
- Documentation is the most scalable form of customer success.

When advising on CS:
- Consider the busy schedule of small business owners
- Design for self-service and automation where possible
- Focus on quick wins and time-to-value
- Suggest templates and processes that scale
- Think about the full customer journey
- Balance high-touch with efficiency

${THINKING_FRAMEWORK}

${VELOCITY_LABS_CONTEXT}`
  },
]

// Markdown components for styling
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
  p: ({ children }: any) => <p className="mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ inline, children }: any) =>
    inline
      ? <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono">{children}</code>
      : <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono overflow-x-auto mb-2">{children}</code>,
  pre: ({ children }: any) => <pre className="mb-2">{children}</pre>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-white/30 pl-4 py-1 my-2 text-white/80 italic">{children}</blockquote>
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border border-white/10 rounded">{children}</table>
    </div>
  ),
  th: ({ children }: any) => <th className="px-3 py-2 bg-white/5 border-b border-white/10 text-left font-medium">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-2 border-b border-white/5">{children}</td>,
}

export default function VelocityAIPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(personas[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/velocity-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: selectedPersona.systemPrompt,
          model: "claude-opus-4-6",
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        persona: selectedPersona.id,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        persona: selectedPersona.id,
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setLoading(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const clearChat = () => {
    setMessages([])
  }

  const PersonaIcon = selectedPersona.icon

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center shadow-lg`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Velocity Labs AI
              <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 rounded-full">OPUS</span>
            </h1>
            <p className="text-sm text-white/50">Your AI-powered executive team</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Persona Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-3 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium px-2 mb-2">Your Team</p>
          <div className="space-y-1">
            {personas.map((persona) => {
              const Icon = persona.icon
              const isSelected = selectedPersona.id === persona.id
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${persona.color} shadow-lg`
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-white/20" : `bg-gradient-to-br ${persona.color} opacity-80`
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm truncate ${isSelected ? "text-white" : "text-white/90"}`}>
                      {persona.name}
                    </p>
                    <p className={`text-[11px] truncate ${isSelected ? "text-white/70" : "text-white/50"}`}>
                      {persona.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* Persona Header */}
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center`}>
              <PersonaIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{selectedPersona.name}</p>
              <p className="text-[11px] text-white/50">{selectedPersona.title} at Velocity Labs</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <PersonaIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{selectedPersona.name}</h2>
                <p className="text-white/50 text-sm max-w-md mb-6">
                  {selectedPersona.description}. I have full context on Velocity Labs and will give you specific, actionable advice.
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {selectedPersona.id === "marketing" && (
                    <>
                      <button onClick={() => setInput("What's the best go-to-market strategy for our first 10 customers?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        GTM for first 10 customers
                      </button>
                      <button onClick={() => setInput("Write a positioning statement that differentiates us from generic CRMs")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Positioning statement
                      </button>
                      <button onClick={() => setInput("Design a content marketing strategy that establishes us as the expert in exotic car rental ops")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Content strategy
                      </button>
                      <button onClick={() => setInput("What marketing experiments should I run in the next 30 days?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        30-day experiment plan
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "sales" && (
                    <>
                      <button onClick={() => setInput("Write a cold email sequence for exotic car rental owners that actually gets responses")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Cold email sequence
                      </button>
                      <button onClick={() => setInput("How do I handle 'I already use Turo, why do I need this?' objection")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Handle Turo objection
                      </button>
                      <button onClick={() => setInput("Build me a discovery call script that qualifies leads effectively")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Discovery call script
                      </button>
                      <button onClick={() => setInput("What's the right pricing strategy for our launch?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Pricing strategy
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "copywriter" && (
                    <>
                      <button onClick={() => setInput("Write 5 hero headline options for our landing page with different angles")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Hero headlines (5 options)
                      </button>
                      <button onClick={() => setInput("Write a cold email that a busy exotic car rental owner would actually read")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Cold email that converts
                      </button>
                      <button onClick={() => setInput("Write the full copy for our homepage - hero, features, social proof, CTA")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Full homepage copy
                      </button>
                      <button onClick={() => setInput("Write a LinkedIn post announcing our launch that will get engagement")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Launch announcement post
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "product" && (
                    <>
                      <button onClick={() => setInput("What features should we cut from MVP and what's truly essential?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        MVP scope - cut ruthlessly
                      </button>
                      <button onClick={() => setInput("How do I know when we've achieved product-market fit?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        PMF indicators
                      </button>
                      <button onClick={() => setInput("Design the ideal onboarding flow for a new customer")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Onboarding flow design
                      </button>
                      <button onClick={() => setInput("What customer research should I do before launch?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Pre-launch research plan
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "analyst" && (
                    <>
                      <button onClick={() => setInput("What are the 5 metrics I should obsess over at this stage and why?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        5 key metrics for now
                      </button>
                      <button onClick={() => setInput("Build me a financial model for the first year with different scenarios")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Year 1 financial model
                      </button>
                      <button onClick={() => setInput("What's a healthy CAC:LTV ratio for our business and how do I calculate it?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        CAC:LTV analysis
                      </button>
                      <button onClick={() => setInput("Design an analytics dashboard for tracking product-market fit")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        PMF dashboard design
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "growth" && (
                    <>
                      <button onClick={() => setInput("What's the ONE growth channel I should focus on for our first 10 customers?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Best initial channel
                      </button>
                      <button onClick={() => setInput("Design a referral program that exotic car rental owners would actually use")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Referral program design
                      </button>
                      <button onClick={() => setInput("What growth loops can we build into the product itself?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Product growth loops
                      </button>
                      <button onClick={() => setInput("Give me 5 unconventional growth tactics for reaching exotic car rental owners")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        5 unconventional tactics
                      </button>
                    </>
                  )}
                  {selectedPersona.id === "customer" && (
                    <>
                      <button onClick={() => setInput("Design a 7-day onboarding email sequence that drives activation")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        7-day onboarding sequence
                      </button>
                      <button onClick={() => setInput("What are the early warning signs of churn and how do I prevent it?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Churn warning signs
                      </button>
                      <button onClick={() => setInput("Build a customer health score framework for our customers")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Health score framework
                      </button>
                      <button onClick={() => setInput("What documentation and help content should we create first?")} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-left text-white/70 hover:text-white transition-colors">
                        Priority help content
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const messagePersona = message.persona ? personas.find(p => p.id === message.persona) : null
                const MessageIcon = messagePersona?.icon || Sparkles

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${messagePersona?.color || "from-gray-500 to-gray-600"} flex items-center justify-center flex-shrink-0 mt-1`}>
                        <MessageIcon className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-white text-black rounded-br-md"
                            : "bg-white/[0.05] border border-white/[0.08] text-white rounded-bl-md"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed">{message.content}</div>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 mt-1.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-white/30">
                          {format(message.timestamp, "h:mm a")}
                        </span>
                        {message.role === "assistant" && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            {copied === message.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/30 hover:text-white/60" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {loading && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center flex-shrink-0`}>
                  <PersonaIcon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                    <span className="text-sm text-white/50">Thinking deeply...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/[0.08]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Ask ${selectedPersona.name} anything...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 bg-gradient-to-r ${selectedPersona.color} text-white shadow-lg hover:shadow-xl`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
