import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contacts, columnMapping, importBatchId } = await request.json()

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid contacts data" }, { status: 400 })
    }

    // Validate required field mappings
    const nameCol = Object.entries(columnMapping).find(([_, v]) => v === "name")?.[0]
    const phoneCol = Object.entries(columnMapping).find(([_, v]) => v === "phone")?.[0]
    const emailCol = Object.entries(columnMapping).find(([_, v]) => v === "email")?.[0]

    if (!nameCol) {
      return NextResponse.json(
        { error: "Name column mapping is required" },
        { status: 400 }
      )
    }

    if (!phoneCol && !emailCol) {
      return NextResponse.json(
        { error: "At least one contact method (phone or email) is required" },
        { status: 400 }
      )
    }

    const results = { success: 0, failed: 0, duplicates: 0 }
    const batchId = importBatchId || crypto.randomUUID()

    for (const row of contacts) {
      try {
        // Map columns to contact fields
        const contact: Record<string, any> = {
          user_id: user.id,
          import_source: "csv_import",
          import_batch_id: batchId,
          status: "active",
          sms_opted_in: true,
          email_opted_in: true,
        }

        // Process each mapped column
        Object.entries(columnMapping).forEach(([colIndex, field]) => {
          if (field && row[parseInt(colIndex)]) {
            let value = String(row[parseInt(colIndex)]).trim()

            switch (field) {
              case "name":
                contact.name = value
                break
              case "email":
                contact.email = value.toLowerCase()
                break
              case "phone":
                // Normalize phone number
                contact.phone = normalizePhone(value)
                break
              case "total_spend":
                value = value.replace(/[$,]/g, "")
                contact.total_spend = parseFloat(value) || 0
                break
              case "rental_count":
                contact.rental_count = parseInt(value) || 0
                break
              case "last_rental_date":
              case "birthday":
                const date = parseDate(value)
                if (date) {
                  contact[field] = date
                }
                break
              case "preferred_vehicle_type":
                contact.preferred_vehicle_type = value
                break
              case "notes":
                contact.notes = value
                break
            }
          }
        })

        // Skip if no name
        if (!contact.name) {
          results.failed++
          continue
        }

        // Check for duplicates by phone or email
        if (contact.phone || contact.email) {
          let duplicateQuery = supabase
            .from("reactivation_contacts")
            .select("id")
            .eq("user_id", user.id)

          if (contact.phone && contact.email) {
            duplicateQuery = duplicateQuery.or(`phone.eq.${contact.phone},email.eq.${contact.email}`)
          } else if (contact.phone) {
            duplicateQuery = duplicateQuery.eq("phone", contact.phone)
          } else {
            duplicateQuery = duplicateQuery.eq("email", contact.email)
          }

          const { data: existing } = await duplicateQuery.maybeSingle()

          if (existing) {
            results.duplicates++
            continue
          }
        }

        // Insert contact
        const { error } = await supabase.from("reactivation_contacts").insert(contact)

        if (error) {
          console.error("Insert error:", error)
          results.failed++
        } else {
          results.success++
        }
      } catch (error) {
        console.error("Row processing error:", error)
        results.failed++
      }
    }

    return NextResponse.json({ results, batchId })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "")

  // If it starts with 1 and is 11 digits, it's likely a US number with country code
  if (normalized.startsWith("1") && normalized.length === 11) {
    normalized = "+" + normalized
  }
  // If it's 10 digits, assume US and add +1
  else if (normalized.length === 10) {
    normalized = "+1" + normalized
  }
  // If it already starts with +, keep as is
  else if (!normalized.startsWith("+") && normalized.length > 10) {
    normalized = "+" + normalized
  }

  return normalized
}

function parseDate(value: string): string | null {
  // Try various date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}$/,
    // US format MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // US format MM-DD-YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,
  ]

  for (const format of formats) {
    if (format.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]
      }
    }
  }

  // Try native Date parsing as fallback
  const date = new Date(value)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]
  }

  return null
}
