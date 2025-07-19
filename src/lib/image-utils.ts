/**
 * Utility function to get the correct image URL from Strapi
 * @param imageData - The image data from Strapi API
 * @returns Complete image URL or fallback
 */
export function getImageUrl(imageData: any): string {
    if (!imageData) return "/placeholder.png"
  
    // Handle different Strapi image data structures
    let url = ""
  
    if (typeof imageData === "string") {
      url = imageData
    } else if (imageData.url) {
      url = imageData.url
    } else if (imageData.data?.attributes?.url) {
      url = imageData.data.attributes.url
    } else if (imageData.attributes?.url) {
      url = imageData.attributes.url
    }
  
    if (!url) return "/placeholder.png"
  
    // If URL is relative, prepend Strapi base URL
    if (url.startsWith("/uploads/")) {
      return `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`
    }
  
    // If URL is already complete, return as is
    if (url.startsWith("http")) {
      return url
    }
  
    // Fallback: prepend Strapi URL
    return `${process.env.NEXT_PUBLIC_STRAPI_URL}${url.startsWith("/") ? url : `/${url}`}`
  }
  
  /**
   * Get user avatar URL with fallback
   */
  export function getUserAvatarUrl(user: any): string {
    return getImageUrl(user?.profilePicture || user?.avatar) || "/placeholder.png"
  }
  