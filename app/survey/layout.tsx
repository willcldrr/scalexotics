import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Answer a few questions to see if Scale Exotics is right for your exotic car rental fleet. Get pre-qualified renters and fill your weekday gaps.",
  alternates: {
    canonical: "/survey",
  },
  openGraph: {
    title: "Get Started | Scale Exotics",
    description:
      "Answer a few questions to see if Scale Exotics is right for your exotic car rental fleet. Get pre-qualified renters and fill your weekday gaps.",
    url: "/survey",
  },
}

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
