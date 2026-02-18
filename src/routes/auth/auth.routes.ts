import { Router } from 'express';
import { login, register, sendOtp, verifyOtp } from '../../controllers/auth.contollers.js';
import { validate, registerSchema } from '../../middleware/validate.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', login);

router.post('/send-otp', sendOtp)

router.post('/verify-otp', verifyOtp)

export default router;