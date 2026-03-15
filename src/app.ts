import express from 'express';
import type {
    Application,
    Request,
    Response,
} from 'express';

import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import jobRoutes from './routes/jobs/jobs.routes.js';
import applicationRoutes from './routes/applications/application.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { protect } from './middleware/auth.middleware.js';
import authRoutes from './routes/auth/auth.routes.js';
import feedRoutes from './routes/feed/feed.routes.js';
import userRoutes from './routes/users/user.routes.js';
import reelRoutes from './routes/reels/reels.routes.js';
import postRoutes from './routes/posts/post.routes.js';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'active' });
});

//  Auth
app.use('/api/v1/auth', authRoutes);

// Users
app.use('/api/v1/users', userRoutes);

// Jobs
app.use('/api/v1/jobs', protect, jobRoutes);
app.use('/api/v1/all-jobs', jobRoutes);
app.use('/api/v1/create-jobs', jobRoutes);

// Applications
app.use('/api/v1/applications', applicationRoutes);

// Feed
app.use('/api/v1/feed', feedRoutes);

// Reels/Posts
app.use('/api/v1/reels', reelRoutes);
app.use('/api/v1/posts', postRoutes);

app.use(errorHandler)

export default app;