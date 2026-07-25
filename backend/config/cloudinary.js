const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image buffer directly to Cloudinary
 * @param {Buffer} imageBuffer - Raw binary image buffer
 * @returns {Promise<String>} - Permanent HTTPS URL
 */
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'nise_news_thumbnails' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(imageBuffer);
  });
};

module.exports = { uploadImageToCloudinary };