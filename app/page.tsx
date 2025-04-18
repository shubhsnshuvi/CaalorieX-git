import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Features } from "@/components/features"
import { About } from "@/components/about"
import { Testimonials } from "@/components/testimonials"
import { HowItWorks } from "@/components/how-it-works"
import { ArrowRight, Check } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 dark:from-green-950 dark:via-blue-950 dark:to-green-950 overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <span className="font-medium">New: Advanced Calorie Calculator</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Your <span className="text-green-600 dark:text-green-500">Personalized</span> Nutrition Journey
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  AI-powered meal planning tailored to your body, preferences, and goals. Achieve your ideal weight with
                  science-backed nutrition.
                </p>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                    >
                      Start Your Free Plan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
                    >
                      Explore Features
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Personalized Plans</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Expert Guidance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>AI-Powered</span>
                  </div>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl blur-xl opacity-70"></div>
                <div className="relative">
                  <Image
                    alt="CalorieX Dashboard Preview"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center shadow-2xl"
                    height="550"
                    width="800"
                    src="/placeholder.svg?height=550&width=800"
                    priority
                  />
                  <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600 dark:text-green-400"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Advanced Calorie Calculation</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Scientifically optimized for your goals
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brands/Trust Section */}
        <section className="w-full py-8 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">TRUSTED BY HEALTH PROFESSIONALS</p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16 grayscale opacity-70">
                <Image
                  src="/placeholder.svg?height=40&width=120"
                  alt="Partner Logo 1"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
                <Image
                  src="/placeholder.svg?height=40&width=120"
                  alt="Partner Logo 2"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
                <Image
                  src="/placeholder.svg?height=40&width=120"
                  alt="Partner Logo 3"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
                <Image
                  src="/placeholder.svg?height=40&width=120"
                  alt="Partner Logo 4"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <About />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Features Section */}
        <Features />

        {/* Testimonials Section */}
        <Testimonials />

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-green-600 dark:bg-green-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Ready to Transform Your Nutrition?
                </h2>
                <p className="mx-auto max-w-[700px] text-white/80 md:text-xl/relaxed">
                  Join thousands who have already discovered the power of personalized nutrition with CalorieX.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    Get Started for Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
