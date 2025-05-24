"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Video, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/use-auth"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ConsultationBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPremium?: boolean
}

export function ConsultationBookingModal({ open, onOpenChange, isPremium = false }: ConsultationBookingModalProps) {
  const { user, userData } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [consultationType, setConsultationType] = useState("")
  const [concerns, setConcerns] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBooked, setIsBooked] = useState(false)

  const consultationTypes = [
    {
      id: "nutrition-plan",
      name: "Nutrition Plan Consultation",
      duration: "45 minutes",
      price: isPremium ? "Free" : "₹999",
      description: "Comprehensive nutrition assessment and personalized meal planning",
    },
    {
      id: "weight-management",
      name: "Weight Management Session",
      duration: "30 minutes",
      price: isPremium ? "Free" : "₹699",
      description: "Focused session on weight loss/gain strategies",
    },
    {
      id: "medical-nutrition",
      name: "Medical Nutrition Therapy",
      duration: "60 minutes",
      price: isPremium ? "Free" : "₹1299",
      description: "Specialized nutrition therapy for medical conditions",
    },
    {
      id: "follow-up",
      name: "Follow-up Session",
      duration: "20 minutes",
      price: isPremium ? "Free" : "₹499",
      description: "Progress review and plan adjustments",
    },
  ]

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
  ]

  const handleBooking = async () => {
    if (!user || !selectedDate || !selectedTime || !consultationType) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const selectedConsultation = consultationTypes.find((type) => type.id === consultationType)

      await addDoc(collection(db, "consultations"), {
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.fullName || "User",
        dietitianId: "shubhanshu-vishwakarma",
        consultationType: consultationType,
        consultationName: selectedConsultation?.name,
        date: selectedDate,
        time: selectedTime,
        duration: selectedConsultation?.duration,
        price: selectedConsultation?.price,
        concerns: concerns,
        status: "pending",
        isPremiumUser: isPremium,
        createdAt: serverTimestamp(),
        meetingLink: "", // Will be added by dietitian
        notes: "",
      })

      setIsBooked(true)
    } catch (error) {
      console.error("Error booking consultation:", error)
      alert("Failed to book consultation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedDate(undefined)
    setSelectedTime("")
    setConsultationType("")
    setConcerns("")
    setIsBooked(false)
    onOpenChange(false)
  }

  if (isBooked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Consultation Booked!
            </DialogTitle>
            <DialogDescription>Your consultation has been successfully scheduled</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="font-medium">Booking Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive a confirmation email with meeting details within 24 hours.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Shubhanshu will contact you to confirm the appointment and provide the meeting link.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Button onClick={resetForm} className="w-full">
              Book Another Consultation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Consultation with Shubhanshu Vishwakarma</DialogTitle>
          <DialogDescription>
            Schedule a personalized nutrition consultation with our certified dietitian
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Consultation Types */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select Consultation Type</Label>
              <div className="grid gap-3 mt-2">
                {consultationTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      consultationType === type.id
                        ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setConsultationType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{type.name}</h4>
                        <Badge variant={isPremium ? "secondary" : "outline"}>{type.price}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {type.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video Call
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="concerns">Health Concerns & Goals (Optional)</Label>
              <Textarea
                id="concerns"
                placeholder="Describe your health goals, dietary concerns, or specific areas you'd like to focus on..."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          {/* Right Column - Date & Time Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates and Sundays
                className="rounded-md border mt-2"
              />
            </div>

            {selectedDate && (
              <div>
                <Label className="text-base font-medium">Select Time</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className={selectedTime === time ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && consultationType && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Date:</strong> {selectedDate.toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedTime}
                    </p>
                    <p>
                      <strong>Type:</strong> {consultationTypes.find((t) => t.id === consultationType)?.name}
                    </p>
                    <p>
                      <strong>Duration:</strong> {consultationTypes.find((t) => t.id === consultationType)?.duration}
                    </p>
                    <p>
                      <strong>Price:</strong> {consultationTypes.find((t) => t.id === consultationType)?.price}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || !consultationType || isSubmitting}
            className="button-orange flex-1"
          >
            {isSubmitting ? "Booking..." : "Book Consultation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
