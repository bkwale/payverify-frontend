
//import { Request, Response, NextFunction } from 'express';

//import { verifyToken } from '../utils/jwtUtils';

//import { UserJwtPayload } from '../types/express';

//function isUserJwtPayload(payload: unknown): payload is UserJwtPayload {

//    if (!payload || typeof payload !== 'object') {
//        return false;
//    }

//    const obj = payload as Record<string, unknown>;

//    return (
//        typeof obj.id === 'number' &&
//        typeof obj.email === 'string' &&
//        typeof obj.role === 'string'
//    );
//}

//export const authenticate = (

//    req: Request,
//    res: Response,
//    next: NextFunction

//): void => {

//    try {

//        const authHeader = req.headers.authorization;

//        // --------------------------------------------------------------------------------
//        // Validate Authorization header exists and is Bearer token
//        // --------------------------------------------------------------------------------
//        if (!authHeader || !authHeader.startsWith('Bearer ')) {

//            res.status(401).json({
//                message: 'Unauthorized: Missing Bearer token'
//            });

//            return;
//        }

//        // Extract token
//        const token = authHeader.substring(7).trim();

//        // Verify token
//        const decoded = verifyToken(token);

//        // --------------------------------------------------------------------------------
//        // Validate payload structure using type guard
//        // --------------------------------------------------------------------------------
//        if (!isUserJwtPayload(decoded)) {

//            res.status(401).json({
//                message: 'Unauthorized: Invalid token payload'
//            });

//            return;
//        }

//        // --------------------------------------------------------------------------------
//        // Attach user to request
//        //
//        // Controllers can now safely use:
//        //
//        // req.user.id
//        // req.user.email
//        // req.user.role
//        // --------------------------------------------------------------------------------
//        req.user = {
//            id: decoded.id,
//            email: decoded.email,
//            role: decoded.role,
//            name: decoded.name
//        };

//        // Continue request pipeline
//        next();

//    }
//    catch (error) {

//        console.error('JWT Authentication Error:', error);

//        res.status(401).json({
//            message: 'Unauthorized: Invalid or expired token'
//        });

//        return;
//    }
//};

//export const requireAdmin = (

//    req: Request,
//    res: Response,
//    next: NextFunction

//): void => {

//    if (!req.user || req.user.role.toLowerCase() !== 'admin') {

//        res.status(403).json({
//            message: 'Forbidden: Admin access required'
//        });

//        return;
//    }

//    next();
//};

//export const requireRoles = (...roles: string[]) => {

//    return (

//        req: Request,
//        res: Response,
//        next: NextFunction

//    ): void => {

//        const userRole = req.user?.role?.toLowerCase();

//        if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {

//            res.status(403).json({
//                message: 'Forbidden: Insufficient permissions'
//            });

//            return;
//        }

//        next();
//    };
//};

// src/middlewares/authMiddleware.ts
// ------------------------------------------------------------------------------------
// PayVerify JWT Authentication Middleware
//
// FIXES APPLIED:
//
// This file now exports:
//
// 1. verifyJwtMiddleware (named export)
// 2. verifyJwtMiddleware (default export)
// 3. authenticate alias (for backward compatibility)
//
// WHY:
// Your codebase uses BOTH:
//
// import { verifyJwtMiddleware } from ...
// import verifyJwtMiddleware from ...
//
// Supporting both prevents breaking existing routes.
//
// ------------------------------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ------------------------------------------------------------------------------------
// Extend Express Request to include user payload
// ------------------------------------------------------------------------------------

export interface AuthenticatedRequest extends Request {
    user?: any;
}

/**
 * JWT verification middleware
 *
 * Validates JWT token and attaches decoded payload to req.user
 */
export const verifyJwtMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            res.status(401).json({
                message: 'Missing Authorization header'
            });

            return;
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {

            res.status(401).json({
                message: 'Missing JWT token'
            });

            return;
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {

            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, secret);

        req.user = decoded;

        next();

    }
    catch (error) {

        res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};

// ------------------------------------------------------------------------------------
// Backward compatibility alias
//
// Some files import:
//
// import { authenticate }
//
// This ensures nothing breaks.
// ------------------------------------------------------------------------------------

export const authenticate = verifyJwtMiddleware;

// ------------------------------------------------------------------------------------
// Default export support
//
// Some files import:
//
// import verifyJwtMiddleware from ...
//
// This fixes TS1192 error.
// ------------------------------------------------------------------------------------

export default verifyJwtMiddleware;
