// Sidebar settings types and utilities

export type SidebarDisplayMode = "hover" | "collapsed" | "full"

export interface SidebarSettings {
  displayMode: SidebarDisplayMode
  // Individual item visibility
  overview?: boolean
  leads?: boolean
  vehicles?: boolean
  "ai-assistant"?: boolean
  settings?: boolean
  [key: string]: boolean | SidebarDisplayMode | undefined
}

const SIDEBAR_SETTINGS_KEY = "velocity_labs_sidebar_settings"

export function getDefaultSidebarSettings(): SidebarSettings {
  return {
    displayMode: "hover",
    // All items visible by default
    overview: true,
    leads: true,
    vehicles: true,
    "ai-assistant": true,
    settings: true,
  }
}

export function getSidebarSettings(): SidebarSettings {
  if (typeof window === "undefined") {
    return getDefaultSidebarSettings()
  }

  try {
    const stored = localStorage.getItem(SIDEBAR_SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...getDefaultSidebarSettings(),
        ...parsed,
      }
    }
  } catch (e) {
    console.error("Error reading sidebar settings:", e)
  }

  return getDefaultSidebarSettings()
}

export function saveSidebarSettings(settings: SidebarSettings): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(SIDEBAR_SETTINGS_KEY, JSON.stringify(settings))
    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("sidebarSettingsChanged", { detail: settings })
    )
  } catch (e) {
    console.error("Error saving sidebar settings:", e)
  }
}
