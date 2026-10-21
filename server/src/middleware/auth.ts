import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'iconic-esports-bgmi-super-secret-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  playerProfileId?: string;
  organizerStatus?: string;
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Access denied. Authentication token required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Database lookup to guarantee role freshness, account active state, and anti-tamper
    const liveUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        organizerStatus: true
      }
    });

    if (!liveUser) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (!liveUser.isActive) {
      res.status(403).json({ error: 'Your account has been suspended by a platform administrator.' });
      return;
    }

    // Attach trusted server-verified attributes
    req.user = {
      id: liveUser.id,
      email: liveUser.email,
      username: liveUser.username,
      role: liveUser.role,
      organizerStatus: liveUser.organizerStatus,
      isActive: liveUser.isActive
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const optionalAuthenticateToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      const liveUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          organizerStatus: true
        }
      });
      if (liveUser && liveUser.isActive) {
        req.user = {
          id: liveUser.id,
          email: liveUser.email,
          username: liveUser.username,
          role: liveUser.role,
          organizerStatus: liveUser.organizerStatus,
          isActive: liveUser.isActive
        };
      }
    } catch {
      // Ignored for optional
    }
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
      return;
    }

    next();
  };
};

/**
 * Ensures organizer is approved before publishing tournaments or launching official events
 */
export const requireApprovedOrganizer = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // Admins always have full permissions
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  if (req.user.role !== 'ORGANIZER') {
    res.status(403).json({ error: 'Organizer privileges required.' });
    return;
  }

  if (req.user.organizerStatus !== 'APPROVED') {
    res.status(403).json({
      error: `Organizer account is ${req.user.organizerStatus || 'PENDING'} approval. You cannot publish or manage official events until verified by an Administrator.`
    });
    return;
  }

  next();
};

/**
 * Checks that the authenticated user owns the tournament or is an Administrator
 */
export async function verifyTournamentOwnership(
  user: AuthUser,
  tournamentId: string
): Promise<{ allowed: boolean; tournament?: any; error?: string }> {
  if (user.role === 'ADMIN') {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return { allowed: false, error: 'Tournament not found.' };
    return { allowed: true, tournament };
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return { allowed: false, error: 'Tournament not found.' };
  }

  if (tournament.organizerId !== user.id) {
    return {
      allowed: false,
      error: 'Access denied: You are not authorized to manage another organizer\'s tournament.'
    };
  }

  return { allowed: true, tournament };
}
