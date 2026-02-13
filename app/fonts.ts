import { Outfit, Inter, JetBrains_Mono } from "next/font/google"

// Optimized font loading - only essential weights
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Reduced from 6 to 4 weights
  variable: "--font-outfit",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
})

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"], // Reduced from 4 to 3 weights
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"], // Reduced from 4 to 2 weights
  variable: "--font-mono",
  display: "swap",
  preload: false, // Not critical - load lazily
  fallback: ["monospace"],
})
