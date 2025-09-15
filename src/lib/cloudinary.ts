// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload image to Cloudinary
 * @param fileBuffer - The image file buffer
 * @param folder - Folder to store the image (e.g., 'venues')
 * @returns Promise with upload result containing public_id and secure_url
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder: string = "venues"
): Promise<{
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { quality: "auto:good" }, // Automatic quality optimization
            { fetch_format: "auto" }, // Automatic format selection (WebP when supported)
            { width: 1200, height: 800, crop: "limit" }, // Limit max size for performance
          ],
          allowed_formats: ["jpg", "png", "webp", "jpeg"],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          } else {
            reject(new Error("Upload failed - no result"));
          }
        }
      )
      .end(fileBuffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param publicId - The public_id of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImageFromCloudinary(
  publicId: string
): Promise<any> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Image deleted from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
}

/**
 * Generate optimized image URL with transformations
 * @param publicId - The public_id of the image
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimized(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): string {
  const { width, height, crop = "fill", quality = "auto:good" } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: "auto",
    secure: true,
  });
}

/**
 * Generate responsive image URLs for different screen sizes
 * @param publicId - The public_id of the image
 * @returns Object with different sized URLs
 */
export function getResponsives(publicId: string) {
  return {
    thumbnail: getOptimized(publicId, { width: 150, height: 150 }),
    small: getOptimized(publicId, { width: 400, height: 300 }),
    medium: getOptimized(publicId, { width: 800, height: 600 }),
    large: getOptimized(publicId, { width: 1200, height: 800 }),
    original: cloudinary.url(publicId, { secure: true }),
  };
}
