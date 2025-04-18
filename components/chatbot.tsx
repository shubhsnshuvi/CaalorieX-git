"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { Send, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  isPremiumPrompt?: boolean
}

// Function to generate relevant nutrition and diet responses
const getBotResponse = async (message: string, userData: any) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase()

  // Check if message contains premium-only keywords
  const premiumKeywords = [
    "personalized",
    "custom",
    "specific",
    "expert",
    "dietitian",
    "consultation",
    "shubhanshu",
    "personal",
    "one-on-one",
    "tailored",
    "individual",
    "professional advice",
    "medical advice",
    "professional",
    "expert advice",
    "specific plan",
    "my condition",
    "my specific",
    "my personal",
    "my individual",
    "my unique",
    "my special",
    "my custom",
    "my tailored",
    "my personalized",
    "my medical",
    "my health",
    "my diet",
    "my nutrition",
    "my meal plan",
    "my food",
    "my eating",
    "my weight",
    "my body",
    "my fitness",
    "my workout",
    "my exercise",
    "my training",
    "my health goals",
    "my diet goals",
    "my fitness goals",
    "my weight goals",
    "my body goals",
    "my nutrition goals",
    "my meal goals",
    "my food goals",
    "my eating goals",
    "my workout goals",
    "my exercise goals",
    "my training goals",
  ]

  // Check if message contains any premium keywords
  const isPremiumQuery = premiumKeywords.some((keyword) => lowerMessage.includes(keyword))

  // If it's a premium query and user is not premium, return a premium prompt
  if (isPremiumQuery && userData?.subscription !== "premium") {
    return {
      text: `For personalized advice specific to your situation, I recommend upgrading to our Premium plan. This will give you direct access to our certified dietitian Shubhanshu Vishwakarma, who can provide expert guidance tailored to your unique needs.\n\nIn the meantime, I can provide general information about nutrition and healthy eating. Would you like to know more about general nutrition principles?`,
      isPremiumPrompt: true,
    }
  }

  // Diet-specific responses
  if (lowerMessage.includes("keto") || lowerMessage.includes("ketogenic")) {
    return {
      text: "The ketogenic diet is a high-fat, low-carb diet that can help with weight loss. It typically limits carbs to 20-50g per day, focusing on fats and proteins. Foods to eat include meats, fatty fish, eggs, butter, cream, cheese, nuts, healthy oils, avocados, and low-carb vegetables. Remember to stay hydrated and consider electrolyte supplements.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("vegetarian") || lowerMessage.includes("vegan")) {
    return {
      text: "Plant-based diets like vegetarian and vegan can be very healthy when properly planned. Focus on getting complete proteins through combinations of legumes, grains, nuts, and seeds. Key nutrients to monitor include vitamin B12, iron, zinc, calcium, and omega-3 fatty acids. Consider fortified foods or supplements if needed.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("intermittent fasting") || lowerMessage.includes("fasting")) {
    return {
      text: "Intermittent fasting involves cycling between periods of eating and fasting. Common methods include 16/8 (16 hours fasting, 8 hours eating), 5:2 (eating normally 5 days, restricting calories 2 days), and eat-stop-eat (24-hour fasts). During fasting periods, stay hydrated with water, black coffee, or tea. Break your fast with moderate portions of balanced foods.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("hindu fasting") || lowerMessage.includes("vrat")) {
    return {
      text: "Hindu fasting (vrat) typically involves avoiding certain foods like grains, legumes, and sometimes salt. Permitted foods often include fruits, dairy, nuts, and specific grains like amaranth and buckwheat. Stay hydrated and ensure adequate nutrition by including a variety of permitted foods. Break your fast gently with easily digestible foods.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("jain diet") || lowerMessage.includes("jainism")) {
    return {
      text: "The Jain diet avoids root vegetables (potatoes, onions, garlic), and foods that may harm living beings. It emphasizes plant foods, dairy, and certain grains and legumes. To ensure adequate nutrition, focus on diverse protein sources like legumes and dairy, and include a variety of permitted fruits and vegetables. Consider vitamin B12 and iron supplements if needed.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("sattvic") || lowerMessage.includes("yogic diet")) {
    return {
      text: "The Sattvic diet from Ayurveda emphasizes pure, light, and energy-giving foods. It includes fruits, vegetables, whole grains, legumes, nuts, seeds, dairy, and honey. It avoids processed foods, meat, onions, garlic, and stimulants. This diet promotes physical health and mental clarity. Balance your meals with a variety of food groups for complete nutrition.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("indian regional") || lowerMessage.includes("regional indian")) {
    return {
      text: "Indian regional diets vary widely across the country. Northern diets feature wheat, dairy, and rich curries; Southern diets emphasize rice, coconut, and spicy dishes; Eastern diets include rice, fish, and mustard; and Western diets feature diverse grains and legumes. Each regional cuisine offers unique nutritional benefits through its combination of spices, cooking methods, and ingredients.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("maintenance") || lowerMessage.includes("maintain weight")) {
    return {
      text: "A maintenance diet aims to keep your current weight stable. Calculate your TDEE (Total Daily Energy Expenditure) and consume roughly the same number of calories. Focus on balanced nutrition with adequate protein (0.8-1g per kg of body weight), healthy fats, complex carbs, and plenty of fruits and vegetables. Regular monitoring and adjustments help maintain long-term weight stability.",
      isPremiumPrompt: false,
    }
  }

  // Weight management responses
  if (lowerMessage.includes("lose weight") || lowerMessage.includes("weight loss")) {
    return {
      text: "Sustainable weight loss typically involves a moderate calorie deficit (about 500 calories/day for 1-2 pounds per week), regular physical activity, and a balanced diet rich in protein, fiber, and nutrients. Focus on whole foods, portion control, and consistency rather than extreme restrictions. Our meal plans can help you achieve this balance.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("gain weight") || lowerMessage.includes("weight gain")) {
    return {
      text: "Healthy weight gain involves consuming more calories than you burn while focusing on nutrient-dense foods. Aim for a surplus of 300-500 calories daily, prioritize protein (1.6-2.2g per kg of body weight), include healthy fats, and strength train regularly. Eating frequent, larger meals and calorie-dense foods like nuts, avocados, and healthy oils can help.",
      isPremiumPrompt: false,
    }
  }

  // Nutrient-specific responses
  if (lowerMessage.includes("protein")) {
    return {
      text: "Protein is essential for muscle repair, immune function, and enzyme production. Good sources include lean meats, poultry, fish, eggs, dairy, legumes, tofu, and tempeh. For general health, aim for 0.8g per kg of body weight daily. Athletes and those building muscle may need 1.2-2.0g per kg. Spreading protein intake throughout the day is optimal for muscle protein synthesis.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("carb") || lowerMessage.includes("carbohydrate")) {
    return {
      text: "Carbohydrates are your body's primary energy source. Focus on complex carbs like whole grains, fruits, vegetables, and legumes that provide fiber and nutrients. These digest slowly, providing sustained energy and better blood sugar control. Limit simple carbs like added sugars and refined grains, which can cause energy spikes and crashes.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("fat")) {
    return {
      text: "Healthy fats are essential for hormone production, brain health, and nutrient absorption. Focus on unsaturated fats from sources like olive oil, avocados, nuts, and fatty fish. Limit saturated fats from full-fat dairy and fatty meats, and avoid trans fats found in some processed foods. Fat is calorie-dense (9 calories per gram), so be mindful of portions.",
      isPremiumPrompt: false,
    }
  }

  // Medical condition responses (general advice only)
  if (lowerMessage.includes("diabetes")) {
    return {
      text: "For diabetes management, focus on consistent carbohydrate intake, portion control, and regular meal timing. Choose complex carbs with fiber, pair carbs with protein and healthy fats, and limit added sugars and refined grains. Regular physical activity also helps with blood sugar control. For specific advice tailored to your situation, consider upgrading to Premium for access to our dietitian.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("cholesterol") || lowerMessage.includes("heart")) {
    return {
      text: "To support heart health, focus on unsaturated fats (olive oil, avocados, nuts), fiber-rich foods (oats, barley, fruits, vegetables), lean proteins, and omega-3 sources (fatty fish, flaxseeds, walnuts). Limit saturated fats, trans fats, sodium, and added sugars. The DASH and Mediterranean diets are well-researched approaches for heart health.",
      isPremiumPrompt: false,
    }
  }

  // General nutrition questions
  if (lowerMessage.includes("meal plan") || lowerMessage.includes("diet plan")) {
    return {
      text: "Our AI-generated meal plans are designed based on your profile information, dietary preferences, and health goals. They provide balanced nutrition with appropriate calorie levels and macronutrient distribution. You can generate up to 3 meal plans with a free account, or unlimited plans with Premium. Head to the Meal Plan tab on your dashboard to create one!",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("calorie") || lowerMessage.includes("tdee")) {
    return {
      text: "Your calorie needs depend on factors like age, gender, weight, height, and activity level. We calculate your TDEE (Total Daily Energy Expenditure) using the Mifflin-St Jeor equation and apply activity multipliers. For weight loss, we create a moderate deficit; for weight gain, a surplus; and for maintenance, we match your TDEE. You can see these calculations when generating a meal plan.",
      isPremiumPrompt: false,
    }
  }

  if (lowerMessage.includes("water") || lowerMessage.includes("hydration")) {
    return {
      text: "Staying hydrated is crucial for overall health. A general guideline is to drink about 2-3 liters (8-12 cups) of water daily, but needs vary based on activity level, climate, and individual factors. Signs of good hydration include light-colored urine and rarely feeling thirsty. Hydration also comes from foods, especially fruits and vegetables.",
      isPremiumPrompt: false,
    }
  }

  // Default responses for general questions
  const generalResponses = [
    "For a balanced diet, aim to fill half your plate with vegetables and fruits, a quarter with lean proteins, and a quarter with whole grains or starchy vegetables. Include healthy fats in moderation, and stay hydrated with water.",
    "Consistent meal timing can help regulate hunger and energy levels. Try to eat every 3-4 hours, including 3 balanced meals and 1-2 snacks if needed. This helps maintain stable blood sugar and prevents extreme hunger that can lead to overeating.",
    "When reading nutrition labels, focus on serving sizes, calories, fiber, protein, added sugars, and sodium. Ingredients are listed by weight, so the first few ingredients make up most of the product. Look for short ingredient lists with recognizable foods.",
    "For sustainable results, focus on building healthy habits rather than following restrictive diets. Small, consistent changes like adding more vegetables, controlling portions, and staying active are more effective long-term than dramatic short-term changes.",
    "Meal prep can save time and help you eat healthier. Try batch cooking grains, roasting vegetables, and preparing proteins on weekends. Store in portion-controlled containers for easy grab-and-go meals during busy weekdays.",
  ]

  return {
    text: generalResponses[Math.floor(Math.random() * generalResponses.length)],
    isPremiumPrompt: false,
  }
}

export function Chatbot() {
  const { user } = useAuth()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    setError(null)

    // Initial bot message
    const initialMessage = {
      id: "initial",
      text: "Hello! I'm your CalorieX nutrition assistant. How can I help you with your diet and nutrition questions today?",
      sender: "bot" as const,
      timestamp: new Date(),
    }

    try {
      // Load chat history from Firestore
      const messagesRef = collection(db, "users", user.uid, "chatMessages")
      const q = query(messagesRef, orderBy("timestamp", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedMessages: Message[] = []
          snapshot.forEach((doc) => {
            loadedMessages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            } as Message)
          })

          // Only add initial message if there are no messages
          if (loadedMessages.length === 0) {
            setMessages([initialMessage])
            // Save initial message to Firestore
            addDoc(messagesRef, {
              text: initialMessage.text,
              sender: initialMessage.sender,
              timestamp: serverTimestamp(),
            }).catch((err) => {
              console.error("Error saving initial message:", err)
              setError("Failed to initialize chat. Please try again.")
            })
          } else {
            setMessages(loadedMessages)
          }
        },
        (err) => {
          console.error("Error loading chat messages:", err)
          setError("Failed to load chat history. Please try again.")
        },
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error setting up chat:", err)
      setError("Failed to set up chat. Please try again.")
    }
  }, [user])

  // Fetch user data for subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setUserData(docSnap.data())
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Add user message to Firestore
      const messagesRef = collection(db, "users", user.uid, "chatMessages")
      await addDoc(messagesRef, {
        text: userMessage,
        sender: "user",
        timestamp: serverTimestamp(),
      })

      try {
        // Get bot response
        const botResponse = await getBotResponse(userMessage, userData)

        // Add bot response to Firestore
        await addDoc(messagesRef, {
          text: botResponse.text,
          sender: "bot",
          timestamp: serverTimestamp(),
          isPremiumPrompt: botResponse.isPremiumPrompt,
        })
      } catch (error) {
        console.error("Error getting bot response:", error)
        setError("Failed to get response. Please try again.")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nutrition Support</CardTitle>
        <CardDescription>
          Chat with our nutrition assistant for help with general diet and nutrition questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="h-[400px] overflow-y-auto space-y-4 p-4 rounded-md border">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start gap-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8">
                  {message.sender === "bot" ? (
                    <>
                      <AvatarImage src="/images/logo.png" />
                      <AvatarFallback>CX</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/images/user-avatar.png" />
                      <AvatarFallback>U</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>

                  {/* Premium prompt upgrade button */}
                  {message.sender === "bot" && message.isPremiumPrompt && (
                    <div className="mt-3 flex flex-col">
                      <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                        <Sparkles className="h-3 w-3" />
                        <span>Premium feature</span>
                      </div>
                      <Link href="/dashboard/upgrade">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                        >
                          Upgrade for Expert Advice
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/images/logo.png" />
                  <AvatarFallback>CX</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            placeholder="Ask about nutrition, diets, meal plans..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
