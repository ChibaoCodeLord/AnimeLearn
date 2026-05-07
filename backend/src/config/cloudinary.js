import cloudinaryPkg from 'cloudinary';
import multerCloudinaryPkg from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';

const CloudinaryStorage = 
  multerCloudinaryPkg.CloudinaryStorage || 
  multerCloudinaryPkg.default?.CloudinaryStorage || 
  multerCloudinaryPkg;

dotenv.config();

cloudinaryPkg.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryPkg, 
  params: {
    folder: 'animelearn_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

export const uploadAvatar = multer({ storage: storage });
export const cloudinaryV2 = cloudinaryPkg.v2;

