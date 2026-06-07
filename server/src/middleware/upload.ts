import { Request, Response, NextFunction } from 'express';
import { upload, uploadImage } from '../config/cloudinary';

// Single image upload middleware
export const uploadSingle = (fieldName: string = 'image') => {
  return upload.single(fieldName);
};

// Multiple images upload middleware
export const uploadMultiple = (fieldName: string = 'images', maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Multiple named fields upload middleware (for icon and qrCode)
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return upload.fields(fields);
};

// Middleware to upload file to Cloudinary after multer processes it
export const uploadToCloudinary = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // If no files, skip upload processing
    if (!req.file && !req.files) {
      return next();
    }
    
    if (req.file) {
      // Upload single file to Cloudinary
      try {
        const result = await uploadImage(req.file, 'darknet');
        req.file.url = result.url;
        req.file.publicId = result.publicId;
      } catch (uploadError: any) {
        console.error('Failed to upload single file to Cloudinary:', uploadError);
        // Continue without image - mark as failed
        (req.file as any).uploadFailed = true;
        // Extract error message properly
        const errorMessage = uploadError?.error?.message || uploadError?.message || uploadError?.toString() || 'Unknown error';
        (req.file as any).uploadError = errorMessage;
      }
      // Remove buffer to save memory
      delete (req.file as any).buffer;
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        // Upload multiple files to Cloudinary
        const uploadPromises = req.files.map(async (file: Express.Multer.File) => {
          try {
            const result = await uploadImage(file, 'darknet');

            uploadImage(file, 'darknet/payment-methods')
                .then((result) => {
                  (file as any).url = result.url;
                  (file as any).publicId = result.publicId;
                  (file as any).uploadFailed = false;
                  delete (file as any).buffer;
                  return { fieldName, file };
                })
                .catch((uploadError: any) => {
                  console.error(`Failed to upload ${fieldName} to Cloudinary:`, uploadError);
                  (file as any).uploadFailed = true;
                  // Extract error message properly - handle nested error structure
                  let errorMessage = 'Unknown error';
                  if (uploadError?.error?.message) {
                    errorMessage = uploadError.error.message;
                  } else if (uploadError?.message) {
                    errorMessage = uploadError.message;
                  } else if (typeof uploadError === 'string') {
                    errorMessage = uploadError;
                  } else if (uploadError?.toString) {
                    errorMessage = uploadError.toString();
                  }
                  (file as any).uploadError = errorMessage;
                  (file as any).url = undefined;
                  (file as any).publicId = undefined;
                  delete (file as any).buffer;
                  return { fieldName, file };
                })
            );
          }
        }
        // Wait for all uploads to complete (success or failure)
        await Promise.all(uploadPromises);
      }
    }
    next();
  } catch (error: any) {
    console.error('Unexpected error in uploadToCloudinary middleware:', error);
    // Continue anyway - let controller handle missing images
    next();
  }
};

// Error handling middleware for multer
export const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof Error) {
    if (err.message === 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.') {
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }
    if (err.message.includes('File too large')) {
      res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
      return;
    }
  }
  next(err);
};
