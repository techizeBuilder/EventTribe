/**
 * Image utility functions for handling file uploads and conversions
 */

/**
 * Convert a file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - The base64 string representation
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Resize an image to fit within max dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - Image quality (0-1)
 * @returns {Promise<string>} - The resized image as base64 string
 */
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth = width;
      let newHeight = height;
      
      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        if (aspectRatio > 1) {
          // Landscape
          newWidth = Math.min(maxWidth, width);
          newHeight = newWidth / aspectRatio;
        } else {
          // Portrait
          newHeight = Math.min(maxHeight, height);
          newWidth = newHeight * aspectRatio;
        }
      }
      
      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate if file is a valid image
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid image file
 */
export const isValidImage = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Get file size in MB
 * @param {File} file - The file to check
 * @returns {number} - Size in MB
 */
export const getFileSizeInMB = (file) => {
  return (file.size / (1024 * 1024)).toFixed(2);
};

/**
 * Validate image file size and type
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10MB)
 * @returns {Object} - Validation result with isValid and message
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { isValid: false, message: "No file selected" };
  }

  if (!isValidImage(file)) {
    return { 
      isValid: false, 
      message: `File format not supported. Only supports JPEG, PNG, GIF, and WebP images up to ${maxSizeMB}MB.` 
    };
  }

  const fileSizeMB = getFileSizeInMB(file);
  if (fileSizeMB > maxSizeMB) {
    return { 
      isValid: false, 
      message: `File too large (${fileSizeMB}MB). Only supports files up to ${maxSizeMB}MB.` 
    };
  }

  return { isValid: true, message: "Valid image file" };
};

/**
 * Compress image with better quality control
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - Image quality (0-1)
 * @param {number} maxSizeKB - Maximum size in KB (optional)
 * @returns {Promise<string>} - The compressed image as base64 string
 */
export const compressImage = async (file, maxWidth = 1200, maxHeight = 800, quality = 0.8, maxSizeKB = 500) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth = width;
      let newHeight = height;
      
      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        if (aspectRatio > 1) {
          // Landscape
          newWidth = Math.min(maxWidth, width);
          newHeight = newWidth / aspectRatio;
        } else {
          // Portrait
          newHeight = Math.min(maxHeight, height);
          newWidth = newHeight * aspectRatio;
        }
      }
      
      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Try different quality levels if size limit is specified
      let currentQuality = quality;
      let base64 = canvas.toDataURL('image/jpeg', currentQuality);
      
      // If maxSizeKB is specified, reduce quality until size is acceptable
      if (maxSizeKB) {
        while (base64.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) { // 1.37 is base64 overhead factor
          currentQuality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', currentQuality);
        }
      }
      
      resolve(base64);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};