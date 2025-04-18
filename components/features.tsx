import { Check, Sparkles, Users, Calculator, Calendar, HeartPulse, Utensils } from "lucide-react"

export function Features() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <span className="font-medium">Powerful Features</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              CalorieX offers a comprehensive suite of features to help you achieve your health and nutrition goals.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-800">
              <Sparkles className="h-6 w-6 text-green-600 dark:text-green-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">AI-Generated Meal Plans</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Our advanced AI creates personalized meal plans based on your preferences, dietary restrictions, and
              health goals.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>7-day meal plans with quantities</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Detailed nutritional information</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Recipe suggestions</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800">
              <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Advanced Calorie Calculator</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Our sophisticated algorithm calculates your optimal daily calorie intake based on your current weight,
              goal weight, and activity level.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>TDEE calculation</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Goal-based calorie adjustments</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Safe and effective progress</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-800">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Flexible Diet Periods</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Choose your ideal diet duration from 4 weeks to 6 months to create a plan that fits your lifestyle and
              goals.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Multiple duration options</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Optimized for your timeframe</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Progress tracking</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-800">
              <HeartPulse className="h-6 w-6 text-red-600 dark:text-red-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Medical Condition Support</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Specialized meal plans for various medical conditions including diabetes, thyroid issues, PCOS, and high
              cholesterol.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Condition-specific nutrition</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Allergen exclusions</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Health-optimized recipes</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-800">
              <Utensils className="h-6 w-6 text-orange-600 dark:text-orange-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Diverse Diet Preferences</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Support for multiple diet types including vegetarian, vegan, keto, gluten-free, and intermittent fasting.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>8+ diet preference options</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Culturally diverse recipes</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Customizable food preferences</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-800">
              <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-200" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Expert Dietitian Support</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Premium members get personalized advice and support from certified dietitians to help achieve health
              goals.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>One-on-one consultations</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Personalized recommendations</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Expert guidance</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <div className="rounded-lg border bg-background p-6 shadow-sm max-w-3xl">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-8 w-8 text-green-600 dark:text-green-200"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Free vs. Premium Plans</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Choose the plan that best fits your needs and budget, with options for both free and premium users.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Free Plan</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>3 meal plans per month</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>Basic calorie calculation</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>Support chatbot</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Premium Plan</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>Unlimited meal plans</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>Advanced calorie calculation</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                        <span>Dietitian consultations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
