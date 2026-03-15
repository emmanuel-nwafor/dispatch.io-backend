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
                input: [{ url: videoUrl }],
                playback_policy: ['public'],
                inputs: []
            });
            return asset;
        } catch (error) {
            console.error('Error uploading to Mux:', error);
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
     * Get playback ID for an asset
     */
    getPlaybackId: (asset: any) => {
        return asset.playback_ids?.[0]?.id;
    }
};
