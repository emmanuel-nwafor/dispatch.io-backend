import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/Users.js';
import { Reel } from '../src/models/Reels.js';
import { MuxService } from '../src/services/mux.service.js';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI;
const TEST_VIDEO_URL = 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4';

async function testMuxUpload() {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to database.');

        // Find a test user (e.g., Jane Doe from seed)
        const user = await User.findOne({ email: 'janedoe@gmail.com' });
        if (!user) {
            throw new Error('Test user not found. Please run seed script first.');
        }
        console.log(`Found test user: ${user.email} (${user._id})`);

        // 1. Upload to Mux
        console.log('Step 1: Uploading video to Mux...');
        const asset = await MuxService.uploadVideo(TEST_VIDEO_URL);
        const playbackId = MuxService.getPlaybackId(asset);
        console.log(`Mux Upload Success! Asset ID: ${asset.id}, Playback ID: ${playbackId}`);

        // 2. Save to DB
        console.log('Step 2: Saving Reel to Database...');
        const reel = await Reel.create({
            creatorId: user._id,
            title: 'Mux Test Reel',
            description: 'This is a test reel created via script to verify Mux and DB integration.',
            type: 'company_tour',
            videoUrl: TEST_VIDEO_URL, // Using the source URL as a placeholder for Cloudinary
            assetId: asset.id,
            playbackId: playbackId,
            thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
            tags: ['test', 'mux', 'integration']
        });

        console.log('Reel created successfully in DB:');
        console.log(JSON.stringify(reel, null, 2));

        console.log('\nIntegration Test PASSED!');
        process.exit(0);
    } catch (error) {
        console.error('Integration Test FAILED:', error);
        process.exit(1);
    }
}

testMuxUpload();
