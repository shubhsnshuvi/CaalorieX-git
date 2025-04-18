import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export function Testimonials() {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <span className="font-medium">Success Stories</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Real results from real people who transformed their health with CalorieX
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white">
                      <Image src="/placeholder.svg?height=48&width=48" alt="Sarah J." fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Sarah J.</h3>
                      <p className="text-sm text-white/80">Lost 15kg in 4 months</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="italic text-gray-600 dark:text-gray-400">
                    "The personalized meal plans and calorie calculations were a game-changer for me. I've tried many
                    diets before, but CalorieX made it sustainable and enjoyable."
                  </p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white">
                      <Image src="/placeholder.svg?height=48&width=48" alt="Michael T." fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Michael T.</h3>
                      <p className="text-sm text-white/80">Gained 8kg of muscle</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="italic text-gray-600 dark:text-gray-400">
                    "As someone looking to build muscle, the protein-focused meal plans were exactly what I needed. The
                    diet period selection helped me plan my bulking and cutting cycles perfectly."
                  </p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white">
                      <Image src="/placeholder.svg?height=48&width=48" alt="Priya K." fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Priya K.</h3>
                      <p className="text-sm text-white/80">Managed PCOS with diet</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="italic text-gray-600 dark:text-gray-400">
                    "The medical condition-specific meal plans have been life-changing for managing my PCOS. The
                    advanced calorie calculation helped me find the perfect balance for my body."
                  </p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
