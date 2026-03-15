import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on fieldname or other criteria
        let folder = 'dispatch_io_uploads';
        if (file.fieldname === 'avatar' || file.fieldname === 'profileImage') {
            folder = 'dispatch_io_profiles';
        } else if (file.fieldname === 'postImage') {
            folder = 'dispatch_io_posts';
        }

        return {
            folder: folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };
    },
});

export const upload = multer({ storage: storage });
export { cloudinary };
