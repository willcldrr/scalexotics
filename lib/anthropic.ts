import Anthropic from "@anthropic-ai/sdk"

// Lazy-initialized Anthropic client (initialized on first use, not at build time)
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set")
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// Model configurations with pricing
export const MODELS = {
  "claude-3-5-haiku-20241022": {
    name: "Claude 3.5 Haiku",
    description: "Fast and cost-effective for routine conversations",
    inputCost: 0.80, // per 1M tokens
    outputCost: 4.00,
    maxTokens: 8192,
    recommended: true,
  },
  "claude-3-5-sonnet-20241022": {
    name: "Claude 3.5 Sonnet",
    description: "Most capable, best for complex situations",
    inputCost: 3.0,
    outputCost: 15.0,
    maxTokens: 8192,
    recommended: false,
  },
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    description: "Previous gen flagship, very capable",
    inputCost: 15.0,
    outputCost: 75.0,
    maxTokens: 4096,
    recommended: false,
  },
} as const

export type ModelId = keyof typeof MODELS

// Escalation triggers - phrases/patterns that should use Sonnet
const ESCALATION_TRIGGERS = [
  // Complaints and issues
  /complain|complaint|unhappy|disappointed|angry|furious|terrible|worst|horrible/i,
  /refund|money back|cancel|sue|lawyer|legal/i,
  /manager|supervisor|owner|speak to someone/i,

  // Complex requests
  /custom|special request|exception|negotiate|deal/i,
  /insurance|damage|accident|incident/i,
  /multiple vehicles|fleet|corporate|business account/i,
  /long[\s-]?term|month|weekly rate/i,

  // Edge cases
  /international|foreign|out of state|delivery/i,
  /wedding|event|photoshoot|commercial/i,
  /modify|change|reschedule|extend/i,
]

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface GenerateOptions {
  model?: ModelId
  maxTokens?: number
  temperature?: number
  usePromptCaching?: boolean
  forceModel?: boolean // If true, don't auto-escalate
}

export interface GenerateResult {
  content: string
  model: ModelId
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  cost: {
    inputCost: number
    outputCost: number
    totalCost: number
    cacheSavings?: number
  }
  escalated: boolean
  escalationReason?: string
}

/**
 * Check if a message should trigger escalation to Sonnet
 */
export function shouldEscalate(message: string, conversationHistory: ChatMessage[] = []): {
  shouldEscalate: boolean
  reason?: string
} {
  // Check current message
  for (const pattern of ESCALATION_TRIGGERS) {
    if (pattern.test(message)) {
      return {
        shouldEscalate: true,
        reason: `Detected escalation trigger: ${pattern.source.split("|")[0]}`
      }
    }
  }

  // Check conversation sentiment (multiple frustrated messages)
  const recentMessages = conversationHistory.slice(-4)
  const frustrationIndicators = recentMessages.filter(m =>
    m.role === "user" && /\?{2,}|!{2,}|wtf|seriously|still|again|already/i.test(m.content)
  )

  if (frustrationIndicators.length >= 2) {
    return {
      shouldEscalate: true,
      reason: "Customer showing signs of frustration (multiple emphatic messages)"
    }
  }

  // Check conversation length (long conversations may need smarter handling)
  if (conversationHistory.length > 15) {
    return {
      shouldEscalate: true,
      reason: "Extended conversation - escalating for better resolution"
    }
  }

  return { shouldEscalate: false }
}

/**
 * Calculate cost for a request
 */
function calculateCost(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number = 0,
  cacheReadTokens: number = 0
): { inputCost: number; outputCost: number; totalCost: number; cacheSavings: number } {
  const modelConfig = MODELS[model]

  // Cache creation costs 25% more than regular input
  // Cache reads cost 90% less than regular input
  const regularInputTokens = inputTokens - cacheCreationTokens - cacheReadTokens

  const regularInputCost = (regularInputTokens / 1_000_000) * modelConfig.inputCost
  const cacheCreationCost = (cacheCreationTokens / 1_000_000) * modelConfig.inputCost * 1.25
  const cacheReadCost = (cacheReadTokens / 1_000_000) * modelConfig.inputCost * 0.1

  const inputCost = regularInputCost + cacheCreationCost + cacheReadCost
  const outputCost = (outputTokens / 1_000_000) * modelConfig.outputCost

  // Calculate savings from cache reads
  const cacheSavings = (cacheReadTokens / 1_000_000) * modelConfig.inputCost * 0.9

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    cacheSavings,
  }
}

/**
 * Generate a response using Anthropic API with prompt caching and hybrid model selection
 */
export async function generateResponse(
  systemPrompt: string,
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const {
    model: requestedModel = "claude-3-5-haiku-20241022",
    maxTokens = 500,
    temperature = 0.7,
    usePromptCaching = true,
    forceModel = false,
  } = options

  // Check for escalation (unless forced to use specific model)
  let finalModel: ModelId = requestedModel
  let escalated = false
  let escalationReason: string | undefined

  if (!forceModel && requestedModel === "claude-3-5-haiku-20241022") {
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || ""
    const escalationCheck = shouldEscalate(lastUserMessage, messages)

    if (escalationCheck.shouldEscalate) {
      finalModel = "claude-3-5-sonnet-20241022"
      escalated = true
      escalationReason = escalationCheck.reason
    }
  }

  // Build messages array for Anthropic
  const anthropicMessages = messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }))

  // Build system prompt with caching
  const systemContent = usePromptCaching
    ? [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ]
    : systemPrompt

  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: finalModel,
      max_tokens: maxTokens,
      temperature,
      system: systemContent,
      messages: anthropicMessages,
    })

    const content = response.content[0].type === "text"
      ? response.content[0].text
      : ""

    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens: (response.usage as any).cache_creation_input_tokens || 0,
      cacheReadInputTokens: (response.usage as any).cache_read_input_tokens || 0,
    }

    const cost = calculateCost(
      finalModel,
      usage.inputTokens,
      usage.outputTokens,
      usage.cacheCreationInputTokens,
      usage.cacheReadInputTokens
    )

    return {
      content,
      model: finalModel,
      usage,
      cost,
      escalated,
      escalationReason,
    }
  } catch (error: any) {
    console.error("Anthropic API error:", error)
    throw new Error(`Anthropic API error: ${error.message}`)
  }
}

/**
 * Estimate tokens in a string (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}

/**
 * Get model info
 */
export function getModelInfo(model: ModelId) {
  return MODELS[model]
}

/**
 * List available models
 */
export function listModels() {
  return Object.entries(MODELS).map(([id, info]) => ({
    id,
    ...info,
  }))
}

export default getAnthropicClient
