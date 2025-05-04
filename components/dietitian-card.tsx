import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function DietitianCard({ isPremium = false }: { isPremium?: boolean }) {
  return (
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
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "As a premium member, you have direct access to personalized diet plans created by Shubhanshu. Your health goals are our priority!"
            : "Upgrade to premium for personalized diet plans created specifically for you by Shubhanshu, based on your unique health profile and goals."}
        </p>
      </CardContent>
    </Card>
  )
}
