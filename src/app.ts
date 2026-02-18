import express from 'express';
import type {
    Application,
    Request,
    Response,
} from 'express';

import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { completeProfile } from './controllers/user.controller.js';
import { protect } from './middleware/auth.middleware.js';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'active' });
});

app.use('/api/auth', authRoutes);

app.use('/api/v1/users', protect, completeProfile);

app.use(errorHandler)

export default app;