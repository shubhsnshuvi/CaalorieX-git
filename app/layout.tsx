import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CalorieX - AI-Powered Personalized Nutrition & Diet Planning",
  description:
    "Transform your health with CalorieX's AI-powered meal planning tailored to your unique body, goals, and preferences. Get personalized diet plans with advanced calorie calculation.",
  keywords:
    "meal planning, diet plan, nutrition app, personalized diet, calorie calculator, weight loss, muscle building, AI nutrition, healthy eating",
  authors: [{ name: "CalorieX Team" }],
  openGraph: {
    title: "CalorieX - AI-Powered Personalized Nutrition & Diet Planning",
    description:
      "Transform your health with CalorieX's AI-powered meal planning tailored to your unique body, goals, and preferences.",
    url: "https://caloriex.com",
    siteName: "CalorieX",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CalorieX - Personalized Nutrition",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CalorieX - AI-Powered Personalized Nutrition & Diet Planning",
    description:
      "Transform your health with CalorieX's AI-powered meal planning tailored to your unique body, goals, and preferences.",
    images: ["/twitter-image.jpg"],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
