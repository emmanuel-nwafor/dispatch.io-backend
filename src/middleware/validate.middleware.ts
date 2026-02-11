import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate = (schema: any) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.errors ? error.errors.map((e: any) => ({
                    path: e.path.join('.'),
                    message: e.message
                })) : error.message
            });
        }
    };

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.string().refine((val) => ['seeker', 'recruiter'].includes(val), {
        message: "Role must be either 'seeker' or 'recruiter'",
    }),
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    companyWebsite: z.string().optional(),
});