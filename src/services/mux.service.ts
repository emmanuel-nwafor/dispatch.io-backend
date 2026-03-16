import Mux from '@mux/mux-node';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Mux with tokenId and tokenSecret
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN!,
    tokenSecret: process.env.MUX_SECRET_KEY!,
});

const { video } = mux;

export const MuxService = {
    /**
     * Upload a video to Mux from a URL (e.g., Cloudinary URL)
     */
    uploadVideo: async (videoUrl: string) => {
        try {
            const asset = await video.assets.create({
                inputs: [{ url: videoUrl }],
                playback_policy: ['public']
            });
            return asset;
        } catch (error) {
            console.error('Error uploading to Mux:', error);
            throw error;
        }
    },

    /**
     * Create a direct upload URL for frontend to use
     */
    createDirectUpload: async () => {
        try {
            const upload = await video.uploads.create({
                new_asset_settings: {
                    playback_policy: ['public'],
                },
                cors_origin: '*', // Allow uploads from the mobile app
            });
            return upload;
        } catch (error) {
            console.error('Error creating Mux direct upload:', error);
            throw error;
        }
    },

    /**
     * Delete an asset from Mux
     */
    deleteAsset: async (assetId: string) => {
        try {
            await video.assets.delete(assetId);
        } catch (error) {
            console.error('Error deleting from Mux:', error);
            throw error;
        }
    },

    /**
     * Get asset by upload ID
     */
    getAssetByUploadId: async (uploadId: string) => {
        try {
            const upload = await video.uploads.retrieve(uploadId);
            if (upload.asset_id) {
                return await video.assets.retrieve(upload.asset_id);
            }
            return null;
        } catch (error) {
            console.error('Error retrieving asset by upload ID:', error);
            throw error;
        }
    },

    /**
     * Get playback ID for an asset
     */
    getPlaybackId: (asset: any) => {
        return asset.playback_ids?.[0]?.id;
    }
};
