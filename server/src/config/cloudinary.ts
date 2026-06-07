import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary (will be reconfigured in verifyCloudinaryConnection after dotenv loads)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Verify Cloudinary connection
export const verifyCloudinaryConnection = async (): Promise<boolean> => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log('⚠️  Cloudinary: Not configured (missing environment variables)');
      console.log('   Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
      return false;
    }

    // Reconfigure Cloudinary with actual environment variables (dotenv is now loaded)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Verify configuration is loaded correctly
    const config = cloudinary.config();
    if (!config.cloud_name || config.cloud_name !== cloudName) {
      console.log('❌ Cloudinary: Configuration mismatch');
      console.log(`   Expected: ${cloudName}, Got: ${config.cloud_name || 'undefined'}`);
      return false;
    }

    // Test connection by making a simple API call
    try {
      const result = await cloudinary.api.ping();
      
      if (result.status === 'ok') {
        console.log('✅ Cloudinary: Connected successfully');
        console.log(`   Cloud Name: ${cloudName}`);
        console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
        return true;
      } else {
        console.log('❌ Cloudinary: Connection failed - Invalid response');
        return false;
      }
    } catch (apiError: any) {
      // If ping fails, check if it's an authentication error
      if (apiError.message?.includes('Invalid API Key') || apiError.message?.includes('401')) {
        console.log('❌ Cloudinary: Authentication failed');
        console.log(`   Error: Invalid API credentials`);
        return false;
      }
      
      // For other errors, assume config is valid but API test failed
      console.log('✅ Cloudinary: Configuration loaded');
      console.log(`   Cloud Name: ${cloudName}`);
      console.log(`   Note: API test failed, but configuration appears valid`);
      console.log(`   Error: ${apiError.message || 'Unknown error'}`);
      return true; // Return true since config is valid, just API test failed
    }
  } catch (error: any) {
    console.log('❌ Cloudinary: Connection failed');
    console.log(`   Error: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Configure Multer to use memory storage (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

// Helper function to delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to upload image directly (without multer)
export const uploadImage = async (
  file: Express.Multer.File | string,
  folder: string = 'logszone'
): Promise<{ url: string; publicId: string }> => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    console.error('Cloudinary configuration error:', error.message);
    throw error;
  }

  try {
    let result;
    
    if (typeof file === 'string') {
      // Upload from URL or base64
      result = await cloudinary.uploader.upload(file, {
        folder,
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
      });
    } else {
      // Upload from buffer - convert to base64
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      result = await cloudinary.uploader.upload(base64, {
        folder,
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
      });
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    // Provide more helpful error message
    const errorCode = error?.code || error?.error?.code;
    const errorMessage = error?.message || error?.error?.message || error?.toString();
    
    if (errorCode === 'ENOTFOUND' || errorMessage?.includes('getaddrinfo') || errorMessage?.includes('ENOTFOUND')) {
      const helpfulError = new Error('Cannot connect to Cloudinary. Please check your internet connection and Cloudinary configuration.');
      // Preserve original error for debugging
      (helpfulError as any).originalError = error;
      (helpfulError as any).code = errorCode;
      throw helpfulError;
    }
    // Preserve original error structure but ensure message is accessible
    if (!error.message && error?.error?.message) {
      error.message = error.error.message;
    }
    throw error;
  }
};

export default cloudinary;

