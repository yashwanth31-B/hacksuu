import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateProfile, isAuthorizedAdmin } from '../db/users.ts';
import { verifyJwt } from '../lib/jwt.ts';

export interface AuthRequest extends Request {
  user?: any;
  profile?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format.' });
  }

  // 1. Try verifying as CivicFix JWT token
  const jwtPayload = verifyJwt(token);
  if (jwtPayload) {
    req.user = {
      uid: jwtPayload.uid,
      email: jwtPayload.email,
      name: jwtPayload.name,
      role: jwtPayload.role,
    };
    req.profile = await getOrCreateProfile(
      jwtPayload.uid,
      jwtPayload.email,
      jwtPayload.name,
      jwtPayload.role
    );
    return next();
  }

  // 2. Try verifying as Firebase ID token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const profile = await getOrCreateProfile(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || ''
    );
    req.profile = profile;

    return next();
  } catch (error) {
    // Both token verifications failed
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      const jwtPayload = verifyJwt(token);
      if (jwtPayload) {
        req.user = {
          uid: jwtPayload.uid,
          email: jwtPayload.email,
          name: jwtPayload.name,
          role: jwtPayload.role,
        };
        req.profile = await getOrCreateProfile(
          jwtPayload.uid,
          jwtPayload.email,
          jwtPayload.name,
          jwtPayload.role
        );
        return next();
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        const profile = await getOrCreateProfile(
          decodedToken.uid,
          decodedToken.email || '',
          decodedToken.name || ''
        );
        req.profile = profile;
      } catch (e) {
        // Silently continue for optional auth
      }
    }
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.profile) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const email = (req.user.email || '').trim().toLowerCase();
  const isAdmin = req.profile.role === 'admin' || (await isAuthorizedAdmin(email));

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Access denied. You do not have municipal administrator privileges.',
    });
  }

  next();
};

export const requireWorkerOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.profile) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const role = req.profile.role;
  const email = (req.user.email || '').trim().toLowerCase();
  const isAdmin = role === 'admin' || (await isAuthorizedAdmin(email));

  if (!isAdmin && role !== 'worker' && role !== 'supervisor') {
    return res.status(403).json({
      error: 'Access denied. Field worker or administrator privileges required.',
    });
  }

  next();
};
