import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "test-collection"))
    const data = querySnapshot.docs.map((doc) => doc.data())
    console.log("Data:", data)
    return new Response(JSON.stringify(data))
  } catch (error) {
    console.error("Error fetching data:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500 })
  }
}
