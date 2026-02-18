import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.headers['x-api-key']) {
        token = req.headers['x-api-key'] as string;
    }

    if (!token || token === '{{token}}') {
        res.status(401).json({ success: false, message: "Not authorized, token missing or invalid variable" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as { id: string, role: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Token failed" });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Role ${req.user?.role || 'Unknown'} is not authorized`
            });
            return;
        }
        return next();
    };
};