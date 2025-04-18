import { ArrowRight } from "lucide-react"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <span className="font-medium">Simple Process</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How CalorieX Works</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Our science-backed approach to personalized nutrition in four simple steps
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4">
          <div className="relative flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              1
            </div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
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
                className="h-8 w-8 text-green-600 dark:text-green-400"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Create Profile</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Enter your details including weight, height, age, and dietary preferences
            </p>
            <ArrowRight className="absolute -right-10 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300 hidden lg:block" />
          </div>
          <div className="relative flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              2
            </div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
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
                className="h-8 w-8 text-green-600 dark:text-green-400"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Set Goals</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Define your target weight and select your diet period from 4 weeks to 6 months
            </p>
            <ArrowRight className="absolute -right-10 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300 hidden lg:block" />
          </div>
          <div className="relative flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              3
            </div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
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
                className="h-8 w-8 text-green-600 dark:text-green-400"
              >
                <path d="M14 13.5H2" />
                <path d="M14 10H2" />
                <path d="M14 16.5H2" />
                <path d="M14 7H2" />
                <path d="M17 22l5-10 5 10" />
                <path d="M22 16h-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Generate Plan</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Our AI calculates your optimal calorie intake and creates a personalized meal plan
            </p>
            <ArrowRight className="absolute -right-10 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300 hidden lg:block" />
          </div>
          <div className="relative flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              4
            </div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
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
                className="h-8 w-8 text-green-600 dark:text-green-400"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Track Progress</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Follow your meal plan and track your progress with our intuitive dashboard
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
