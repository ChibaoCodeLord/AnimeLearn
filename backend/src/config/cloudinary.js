import cloudinaryPkg from 'cloudinary';
import multerCloudinaryPkg from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';

// ✅ BẮT LƯỚI MỌI TRƯỜNG HỢP (Xử lý dứt điểm lỗi is not a constructor)
// 1. Nếu nó nằm trong Object (bản v4)
// 2. Nếu Node.js bọc nó trong .default
// 3. Nếu bản thân nó chính là class luôn (bản v2/v3)
const CloudinaryStorage = 
  multerCloudinaryPkg.CloudinaryStorage || 
  multerCloudinaryPkg.default?.CloudinaryStorage || 
  multerCloudinaryPkg;

dotenv.config();

// Cấu hình thông qua v2
cloudinaryPkg.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryPkg, // ✅ Phải truyền nguyên object gốc vào đây để tránh lỗi 'uploader'
  params: {
    folder: 'animelearn_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

export const uploadAvatar = multer({ storage: storage });
export const cloudinaryV2 = cloudinaryPkg.v2;

