import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                res.status(401).json({ message: 'Not authorized, no token' });
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string };
            req.user = decoded;

            return next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                message: `Role ${req.user?.role || 'Unknown'} is not authorized to access this route`
            });
            return;
        }
        return next();
    };
};