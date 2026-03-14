import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET available:", !!JWT_SECRET);

const testUserId = '6994a6d9581c72d9da9f8f3b';

const testVerification = () => {
    if (!JWT_SECRET) {
        console.error("JWT_SECRET NOT FOUND IN .ENV");
        return;
    }

    // Generate valid token
    const token = jwt.sign({ id: testUserId, role: 'seeker' }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Generated valid token:", token.substring(0, 20) + "...");

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("Verification successful:", decoded);
    } catch (err: any) {
        console.error("Verification FAILED:", err.message);
    }

    // Test Expired (short life)
    const expiredToken = jwt.sign({ id: testUserId, role: 'seeker' }, JWT_SECRET, { expiresIn: '0s' });
    try {
        jwt.verify(expiredToken, JWT_SECRET);
    } catch (err: any) {
        console.log("Caught expected expired error:", err.name); // Should be TokenExpiredError
    }

    // Test Invalid Secret
    try {
        jwt.verify(token, 'WRONG_SECRET');
    } catch (err: any) {
        console.log("Caught expected invalid signature:", err.name); // Should be JsonWebTokenError
    }
};

testVerification();
