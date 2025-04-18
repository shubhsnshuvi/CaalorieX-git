import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export function About() {
  return (
    <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <span className="font-medium">Our Mission</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About CalorieX</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              CalorieX is an AI-powered platform that creates personalized meal plans based on your unique body
              composition, dietary preferences, health goals, and medical conditions.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl blur-xl opacity-70"></div>
            <Image
              src="/placeholder.svg?height=400&width=600"
              alt="CalorieX Team"
              width={600}
              height={400}
              className="relative mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center shadow-xl"
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Science-Backed Nutrition</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Our platform combines cutting-edge AI technology with nutritional science to deliver meal plans that are
                not only delicious but also optimized for your specific health goals.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Personalized Approach</h3>
              <p className="text-gray-500 dark:text-gray-400">
                We analyze over 20 personal factors including your age, gender, weight, height, activity level, medical
                conditions, and food preferences to create truly personalized nutrition plans.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Advanced Calorie Calculation</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Our proprietary algorithm calculates your optimal daily calorie intake based on your current weight,
                goal weight, and selected diet period, ensuring you achieve your goals safely and effectively.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:gap-12">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-800">
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
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                  >
                    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Holistic Health</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We believe in a holistic approach to health that considers not just calories, but nutritional balance,
                  medical needs, and lifestyle factors.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-800">
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
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Affordability</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We're committed to making personalized nutrition accessible to everyone with our free plan and
                  affordable premium options.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-800">
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
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Continuous Innovation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We're constantly improving our algorithms and adding new features like our advanced calorie calculator
                  and diet period selection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
