import { Router } from 'express';
import { login, register } from '../../controllers/auth.contollers.js';
import { validate, registerSchema } from '../../middleware/validate.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', login);

export default router;