"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConsultationBookingModal } from "./consultation-booking-modal"

export function DietitianCard({ isPremium = false }: { isPremium?: boolean }) {
  const [showBookingModal, setShowBookingModal] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-16 w-16 border-2 border-green-500">
            <AvatarImage src="/images/dietitian.jpg" alt="Dietitian" />
            <AvatarFallback>SV</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2">
              Shubhanshu Vishwakarma
              <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                Certified Dietitian
              </Badge>
            </CardTitle>
            <CardDescription>Personal Nutrition Expert</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {isPremium
              ? "As a premium member, you have direct access to personalized diet plans created by Shubhanshu. Your health goals are our priority!"
              : "Upgrade to premium for personalized diet plans created specifically for you by Shubhanshu, based on your unique health profile and goals."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="button-orange flex-1" onClick={() => setShowBookingModal(true)}>
              Book Consultation
            </Button>
            {!isPremium && (
              <Button variant="outline" className="flex-1">
                Upgrade for Direct Access
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConsultationBookingModal open={showBookingModal} onOpenChange={setShowBookingModal} isPremium={isPremium} />
    </>
  )
}
