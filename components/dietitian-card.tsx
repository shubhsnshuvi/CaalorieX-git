import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MessageSquare, Award, Star } from "lucide-react"
import Link from "next/link"

export function DietitianCard({ isPremium = false }: { isPremium?: boolean }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="relative h-32 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=800')] opacity-10 bg-cover bg-center"></div>
      </div>
      <div className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
          <Avatar className="h-24 w-24 border-4 border-gray-800 shadow-xl">
            <AvatarImage src="/images/dietitian.jpg" alt="Dietitian" />
            <AvatarFallback className="bg-orange-500 text-white text-xl">SV</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">Shubhanshu Vishwakarma</h2>
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                Certified Dietitian
              </Badge>
            </div>
            <p className="text-gray-400">MSc Nutrition, 8+ years experience</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Certified Expert</p>
              <p className="text-xs text-gray-400">ACSM & NASM Certified</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">8+ Years Experience</p>
              <p className="text-xs text-gray-400">Helping 1000+ clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">4.9/5 Rating</p>
              <p className="text-xs text-gray-400">Based on 500+ reviews</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm">
            {isPremium
              ? "As a premium member, you have direct access to personalized diet plans created by Shubhanshu. Your health goals are our priority with customized nutrition guidance tailored to your unique needs."
              : "Upgrade to premium for personalized diet plans created specifically for you by Shubhanshu, based on your unique health profile and goals. Get expert guidance to achieve lasting results."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {isPremium ? (
              <>
                <Button className="bg-orange-500 hover:bg-orange-600 flex-1">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Dietitian
                </Button>
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10 flex-1">
                  Schedule Consultation
                </Button>
              </>
            ) : (
              <Link href="/dashboard/upgrade" className="w-full">
                <Button className="bg-orange-500 hover:bg-orange-600 w-full">Upgrade to Premium</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
