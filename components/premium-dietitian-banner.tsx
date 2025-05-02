"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeCheck, Star, Award, Calendar, Clock } from "lucide-react"

export function PremiumDietitianBanner() {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card className="w-full overflow-hidden border-2 border-emerald-100 shadow-lg mb-6 bg-gradient-to-r from-emerald-50 to-white">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
            <Image
              src="/placeholder.svg?height=400&width=300"
              alt="Professional Dietitian"
              width={300}
              height={400}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <Star className="w-3 h-3 mr-1" fill="white" stroke="white" />
              <span>Premium</span>
            </div>
          </div>

          <div className="p-5 md:p-6 flex-1">
            <div className="flex items-center mb-2">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-800">My Personal Dietitian</h3>
              <BadgeCheck className="w-5 h-5 ml-2 text-emerald-500" />
            </div>

            <p className="text-gray-600 mb-4">
              Get personalized nutrition guidance from certified dietitians who specialize in your specific health goals
              and dietary needs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-emerald-600" />
                <span className="text-sm text-gray-700">Certified Professionals</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                <span className="text-sm text-gray-700">Weekly Meal Planning</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                <span className="text-sm text-gray-700">24/7 Support</span>
              </div>
              <div className="flex items-center">
                <BadgeCheck className="w-4 h-4 mr-2 text-emerald-600" />
                <span className="text-sm text-gray-700">Personalized Advice</span>
              </div>
            </div>

            <Button
              onClick={() => router.push("/dashboard/upgrade")}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ${
                isHovered ? "shadow-lg scale-105" : "shadow"
              }`}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
