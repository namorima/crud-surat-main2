import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the image data from the request
    const formData = await request.formData()
    const imageData = formData.get("image") as File

    if (!imageData) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Create a new FormData for the ImgBB API
    const imgbbFormData = new FormData()
    imgbbFormData.append("image", imageData)
    imgbbFormData.append("expiration", "86400") // 1 day in seconds

    // Use a server-side API key for ImgBB
    // In production, this should be an environment variable
    const API_KEY = process.env.IMGBB_API_KEY || "c1c0e9e0c5a6a1e0c9c0e9e0c5a6a1e0" // Replace with your actual API key

    // Upload to ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: imgbbFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ImgBB API error:", errorText)
      return NextResponse.json({ error: "Failed to upload image to ImgBB" }, { status: 500 })
    }

    const data = await response.json()

    // Return the direct link
    return NextResponse.json({ url: data.data.url })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
