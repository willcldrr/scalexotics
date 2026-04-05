/**
 * Auth resolver for widget / hosted-survey endpoints.
 *
 * Public widget endpoints (leads/capture, vehicles/public, availability) need
 * to identify which business a request belongs to. Historically this was done
 * via an `X-API-Key` header, and the hosted-survey page fetched that api_key
 * from /api/survey-config/[slug] and sent it from the browser — which leaked
 * a full-access API key to anyone who loaded the survey URL.
 *
 * This helper replaces that pattern. Callers accept EITHER:
 *   1. `X-API-Key: <key>` — the legacy path, used by third-party widgets the
 *      customer embeds on their own site. Still requires a real api_keys row.
 *   2. `X-Survey-Slug: <slug>` — the new path, used by our own hosted survey
 *      page at /lead/[slug]. Resolves user_id from the survey_config table
 *      without exposing any secret to the browser.
 *
 * Survey-slug auth is scoped: it only authenticates the submission, it does
 * not grant any broader API key privileges. Callers that need a real api_key
 * id (e.g., to record which key a lead came from) should fall back gracefully
 * when `apiKeyId` is null.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

export interface SurveyAuthResult {
  userId: string
  source: "api_key" | "survey_slug"
  /** Present only when source === "api_key". */
  apiKeyId: string | null
  /** Present only when source === "api_key" — the domain the key was issued for. */
  apiKeyDomain: string | null
}

export type SurveyAuthError =
  | { ok: false; status: 401; error: "Missing credentials" }
  | { ok: false; status: 401; error: "Invalid API key" }
  | { ok: false; status: 401; error: "API key is inactive" }
  | { ok: false; status: 401; error: "Invalid survey slug" }

export async function resolveSurveyOrApiKey(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<{ ok: true; auth: SurveyAuthResult } | SurveyAuthError> {
  const surveySlug = request.headers.get("X-Survey-Slug")
  const apiKey = request.headers.get("X-API-Key")

  // Prefer survey-slug when both are present; it's the safer path and avoids
  // the caller needing to fall through on a stale key.
  if (surveySlug) {
    const { data: config, error } = await supabase
      .from("survey_config")
      .select("user_id")
      .eq("slug", surveySlug)
      .eq("is_active", true)
      .single()

    if (error || !config) {
      return { ok: false, status: 401, error: "Invalid survey slug" }
    }

    return {
      ok: true,
      auth: {
        userId: config.user_id as string,
        source: "survey_slug",
        apiKeyId: null,
        apiKeyDomain: null,
      },
    }
  }

  if (apiKey) {
    const { data: keyData, error } = await supabase
      .from("api_keys")
      .select("id, user_id, is_active, domain")
      .eq("key", apiKey)
      .single()

    if (error || !keyData) {
      return { ok: false, status: 401, error: "Invalid API key" }
    }
    if (!keyData.is_active) {
      return { ok: false, status: 401, error: "API key is inactive" }
    }

    return {
      ok: true,
      auth: {
        userId: keyData.user_id as string,
        source: "api_key",
        apiKeyId: keyData.id as string,
        apiKeyDomain: (keyData.domain as string) ?? null,
      },
    }
  }

  return { ok: false, status: 401, error: "Missing credentials" }
}
