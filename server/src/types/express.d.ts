// Extend Express Request to include file upload information
declare namespace Express {
  namespace Multer {
    interface File {
      url?: string;
      publicId?: string;
    }
  }
}

