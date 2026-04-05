import { describe, it, expect } from "vitest"
import {
  PERSONALITIES,
  buildPersonalityBlock,
  getPersonalityName,
  type PersonalityTone,
} from "@/lib/ai/personalities"

/**
 * Smoke tests for the personality module. These are deliberately lightweight
 * — they exist to prove the test harness is wired up end-to-end (import via
 * path alias, run under vitest, assert from a pure module) and to guard a
 * few invariants that later red-team work depends on.
 */

describe("personalities", () => {
  const tones: PersonalityTone[] = ["friendly", "professional", "luxury", "enthusiast"]

  it("defines all four canonical tones", () => {
    for (const tone of tones) {
      expect(PERSONALITIES[tone]).toBeDefined()
      expect(PERSONALITIES[tone].name).toBeTruthy()
      expect(PERSONALITIES[tone].voiceGuide).toBeTruthy()
      expect(PERSONALITIES[tone].examples.length).toBeGreaterThan(0)
    }
  })

  it("each voice is distinct", () => {
    const guides = tones.map((t) => PERSONALITIES[t].voiceGuide)
    const unique = new Set(guides)
    expect(unique.size).toBe(tones.length)
  })

  it("buildPersonalityBlock includes shared cadence rules", () => {
    const block = buildPersonalityBlock("friendly")
    expect(block).toContain("SHARED CADENCE")
    expect(block).toContain("complete sentences")
    expect(block).toContain("Never use urgency")
  })

  it("buildPersonalityBlock falls back to friendly for unknown tones", () => {
    const block = buildPersonalityBlock("nonsense" as PersonalityTone)
    expect(block).toContain(PERSONALITIES.friendly.name)
  })

  it("getPersonalityName is case-insensitive", () => {
    expect(getPersonalityName("Luxury")).toBe("Luxury")
    expect(getPersonalityName("LUXURY")).toBe("Luxury")
    expect(getPersonalityName("luxury")).toBe("Luxury")
  })
})
