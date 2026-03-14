import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load .env from the backend root
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '699a39d7324f8edaff0b8f27a891701e7d76d97353823d7e6974b6da22a1591440375d6f4c2585265b0fa4d10fd21979686d3141898feed3ea71d35c37242294';

const generateTestToken = () => {
    const testUserId = '6994a6d9581c72d9da9f8f3b';

    console.log("Generating token for test user ID:", testUserId);

    const token = jwt.sign(
        { id: testUserId, role: 'seeker' },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    console.log("\n=================================");
    console.log("TEST JWT TOKEN:");
    console.log(token);
    console.log("=================================\n");
    console.log("You can paste this token into your frontend `storage.ts` or `api.ts` to bypass login.");
};

generateTestToken();
