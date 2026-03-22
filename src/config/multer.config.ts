import multer from 'multer';

// Use memory storage to handle files manually in the controller
const storage = multer.memoryStorage();

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for local processing (will be routed to Mux/Cloudinary)
    }
});
