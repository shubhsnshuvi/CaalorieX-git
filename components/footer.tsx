import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer id="contact" className="w-full border-t bg-background">
      <div className="container px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                CalorieX
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered meal planning tailored to your preferences. Get personalized diet plans for a healthier you
              with our advanced calorie calculator and flexible diet periods.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-500 hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-primary">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-primary">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:gap-12 lg:col-span-2">
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#about" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    GDPR Compliance
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Subscribe to our newsletter
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get the latest updates, tips, and special offers delivered directly to your inbox.
              </p>
              <form className="flex w-full max-w-sm items-center space-x-2">
                <Input className="max-w-lg flex-1" placeholder="Enter your email" type="email" />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-none"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} CalorieX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
