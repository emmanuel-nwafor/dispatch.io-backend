import * as dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

dotenv.config();
connectDB();

app.listen(PORT, () => {
    console.log(`Dispatch.io server is up and running on port ${PORT}`);
});
