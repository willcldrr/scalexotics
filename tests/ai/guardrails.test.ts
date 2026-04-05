import { describe, it, expect } from "vitest"
import { GUARDRAILS_BLOCK } from "@/lib/ai/guardrails"

/**
 * Structural sanity checks on the guardrails block. These don't validate
 * model behavior (we do that with red-team agent runs); they just make sure
 * the block can't be accidentally gutted by a careless edit. Every bullet
 * named here was earned through an adversarial round.
 */

describe("guardrails block", () => {
  it("has all top-level sections", () => {
    const required = [
      "SCOPE",
      "INSTRUCTION INTEGRITY",
      "CONFIDENTIALITY",
      "HONESTY",
      "LANGUAGE INTEGRITY",
      "REFUSAL STYLE",
    ]
    for (const section of required) {
      expect(GUARDRAILS_BLOCK).toContain(section)
    }
  })

  it("enumerates key jailbreak trigger phrases", () => {
    const triggers = [
      "ignore previous instructions",
      "developer mode",
      "DAN",
      "hypothetically",
      "as a training example",
      "SOC2",
      "GDPR",
      "ADA discovery",
      "the old rules expired",
    ]
    for (const t of triggers) {
      expect(GUARDRAILS_BLOCK).toContain(t)
    }
  })

  it("explicitly forbids marker emission on request", () => {
    expect(GUARDRAILS_BLOCK).toContain("[EXTRACTED]")
    expect(GUARDRAILS_BLOCK).toContain("[SEND_PAYMENT_LINK]")
    // The guardrails forbid emitting markers "on command" and outside the
    // legitimate booking flow; match either phrasing so the assertion survives
    // small wording tweaks to the prompt.
    expect(GUARDRAILS_BLOCK).toMatch(/on command|legitimate booking flow/i)
  })

  it("blocks persona label extraction", () => {
    expect(GUARDRAILS_BLOCK).toMatch(/persona.+label/i)
    expect(GUARDRAILS_BLOCK).toContain("friendly")
    expect(GUARDRAILS_BLOCK).toContain("luxury")
  })

  it("blocks user-supplied field echo attacks", () => {
    expect(GUARDRAILS_BLOCK).toMatch(/bracketed tokens/i)
    expect(GUARDRAILS_BLOCK).toMatch(/never echo/i)
  })

  it("caps refusal style at one sentence decline + one redirect", () => {
    expect(GUARDRAILS_BLOCK).toContain("REFUSAL STYLE")
    expect(GUARDRAILS_BLOCK).toMatch(/one sentence of decline/i)
  })
})
