const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and cleans up local storage.
 * @param {string} localFilePath - Path to temporary file on disk.
 * @returns {Promise<object>} Cloudinary upload response object.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("Local file path is missing");
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "inotebook_profiles",
    });
    // Remove local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    // Ensure local file is cleaned up even if Cloudinary upload fails
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};

/**
 * Extracts the Cloudinary public_id (including folder path) from a secure URL.
 * Handles transformations, versions (v12345...), and file extensions.
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} Cloudinary public_id or null if not a valid Cloudinary asset
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  // Check if it is a Cloudinary upload URL
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) {
    return null;
  }

  try {
    // Structure: .../upload/[optional_transforms/][v<version>/]<folder>/<filename>.<ext>
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;

    const parts = afterUpload.split("/");

    // Filter out transformation segments and version tags (e.g. v1724500000)
    const nonVersionParts = parts.filter((part) => {
      if (/^v\d+$/.test(part)) return false; // Matches version tag like v1724522883
      if (part.includes(",") || /^[a-z]_[a-z0-9_]+$/i.test(part)) return false; // Transformations like w_200,c_fill
      return true;
    });

    const pathWithExt = nonVersionParts.join("/");
    // Strip file extension (.jpg, .png, .webp, etc.)
    const lastDotIndex = pathWithExt.lastIndexOf(".");
    const publicId = lastDotIndex !== -1 ? pathWithExt.substring(0, lastDotIndex) : pathWithExt;

    return publicId || null;
  } catch (error) {
    console.error("Error extracting Cloudinary public_id from URL:", error);
    return null;
  }
};

/**
 * Safely deletes an asset from Cloudinary using its public_id.
 * Catches errors internally so callers won't crash if asset is already gone.
 * @param {string} publicId - Cloudinary asset public_id
 * @returns {Promise<object|null>} Cloudinary destroy result or null
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting asset from Cloudinary (publicId:", publicId, "):", error);
    return null; // Return null safely so the main application flow is uninterrupted
  }
};

module.exports = { uploadOnCloudinary, getPublicIdFromUrl, deleteFromCloudinary };