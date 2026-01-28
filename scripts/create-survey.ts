import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// Load env from .env.local
const envPath = resolve(process.cwd(), ".env.local")
const envContent = readFileSync(envPath, "utf-8")
const env: Record<string, string> = {}
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/)
  if (match) env[match[1]] = match[2]
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSurvey() {
  console.log("Fetching users...")

  // Get the first user (admin/owner)
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_name")
    .limit(1)
    .single()

  if (profileError || !profiles) {
    console.error("No users found:", profileError)
    return
  }

  const userId = profiles.id
  console.log("Found user:", userId, profiles.company_name)

  // Check if API key exists for user
  const { data: apiKey, error: apiKeyError } = await supabase
    .from("api_keys")
    .select("id, key")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single()

  if (!apiKey) {
    console.log("No API key found. Creating one...")
    const newKey = `sk_live_${crypto.randomUUID().replace(/-/g, "")}`
    const { error: createKeyError } = await supabase
      .from("api_keys")
      .insert({
        user_id: userId,
        key: newKey,
        name: "Lead Capture API Key",
        is_active: true,
      })

    if (createKeyError) {
      console.error("Failed to create API key:", createKeyError)
      return
    }
    console.log("Created API key:", newKey)
  } else {
    console.log("API key exists:", apiKey.key.substring(0, 20) + "...")
  }

  // Check if survey already exists
  const { data: existingSurvey } = await supabase
    .from("survey_config")
    .select("id")
    .eq("slug", "miami-exotics")
    .single()

  if (existingSurvey) {
    console.log("Survey already exists, updating...")
    const { error: updateError } = await supabase
      .from("survey_config")
      .update({
        business_name: "Miami Exotic Rentals",
        is_active: true,
      })
      .eq("id", existingSurvey.id)

    if (updateError) {
      console.error("Failed to update survey:", updateError)
    } else {
      console.log("Survey updated successfully!")
      console.log("URL: https://scalexotics.com/lead/miami-exotics")
    }
    return
  }

  // Create the survey
  const surveyData = {
    user_id: userId,
    slug: "miami-exotics",
    business_name: "Miami Exotic Rentals",
    logo_url: null,
    primary_color: "#375DEE",
    background_color: "#0a0a0a",
    collect_name: true,
    collect_email: false,
    collect_phone: true,
    collect_age: true,
    collect_dates: true,
    collect_vehicle: true,
    minimum_age: 25,
    require_email: false,
    welcome_title: "Find Your Dream Ride",
    welcome_subtitle: "Answer a few quick questions to check availability",
    success_title: "Thanks! We'll text you shortly.",
    success_subtitle: "Check your phone for a message from us.",
    vehicle_ids: null,
    is_active: true,
  }

  const { error: insertError } = await supabase
    .from("survey_config")
    .insert(surveyData)

  if (insertError) {
    console.error("Failed to create survey:", insertError)
    return
  }

  console.log("Survey created successfully!")
  console.log("URL: https://scalexotics.com/lead/miami-exotics")
  console.log("Local: http://localhost:3000/lead/miami-exotics")
}

createSurvey()
