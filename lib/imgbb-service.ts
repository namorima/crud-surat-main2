/**
 * Service for uploading images to ImgBB via our API route
 */
export async function uploadToImgBB(imageDataUrl: string): Promise<string> {
  try {
    // Convert data URL to Blob
    const response = await fetch(imageDataUrl)
    const blob = await response.blob()

    // Create FormData
    const formData = new FormData()
    formData.append("image", blob)

    // Upload via our API route
    const uploadResponse = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await uploadResponse.json()

    // Return the direct link
    return data.url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}
