"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/use-auth"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CalendarDays, Clock, Video, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ConsultationBookingModal } from "@/components/consultation-booking-modal"

interface Consultation {
  id: string
  consultationType: string
  consultationName: string
  date: any
  time: string
  duration: string
  price: string
  concerns: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  meetingLink?: string
  notes?: string
  createdAt: any
}

export default function ConsultationsPage() {
  const { user, userData } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "consultations"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const consultationData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Consultation[]

      setConsultations(consultationData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Consultations</h2>
          <p className="text-muted-foreground">Manage your nutrition consultations with Shubhanshu</p>
        </div>
        <Button onClick={() => setShowBookingModal(true)} className="button-orange">
          Book New Consultation
        </Button>
      </div>

      {consultations.length === 0 ? (
        <Card className="card-gradient">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Book your first consultation with our certified dietitian to get personalized nutrition guidance.
            </p>
            <Button onClick={() => setShowBookingModal(true)} className="button-orange">
              Book Your First Consultation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {consultations.map((consultation) => (
            <Card key={consultation.id} className="card-gradient">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {consultation.consultationName}
                      <Badge className={getStatusColor(consultation.status)}>
                        {getStatusIcon(consultation.status)}
                        {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Consultation with Shubhanshu Vishwakarma</CardDescription>
                  </div>
                  <Badge variant="outline">{consultation.price}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {consultation.date?.toDate ? consultation.date.toDate().toLocaleDateString() : "Date pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {consultation.time} ({consultation.duration})
                      </span>
                    </div>
                    {consultation.meetingLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={consultation.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {consultation.concerns && (
                      <div>
                        <p className="text-sm font-medium">Your Concerns:</p>
                        <p className="text-sm text-muted-foreground">{consultation.concerns}</p>
                      </div>
                    )}
                    {consultation.notes && (
                      <div>
                        <p className="text-sm font-medium">Dietitian Notes:</p>
                        <p className="text-sm text-muted-foreground">{consultation.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConsultationBookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        isPremium={userData?.subscriptionStatus === "premium"}
      />
    </div>
  )
}
