import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, role, ign, bgmiUid, primaryRole } = req.body;

    if (!email || !password || !username) {
      res.status(400).json({ error: 'Email, username and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email or username already exists.' });
      return;
    }

    if (bgmiUid) {
      const existingUid = await prisma.playerProfile.findUnique({
        where: { bgmiUid }
      });
      if (existingUid) {
        res.status(409).json({ error: 'This BGMI Character UID is already registered.' });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Security: Public registration must never grant ADMIN privileges.
    // Admin promotions are strictly restricted to existing administrators.
    let assignedRole = 'PLAYER';
    let assignedOrganizerStatus = 'NONE';

    if (role === 'ORGANIZER') {
      assignedRole = 'ORGANIZER';
      assignedOrganizerStatus = 'PENDING'; // Must be approved by an Admin before accessing organizer capabilities
    } else if (role === 'TEAM_CAPTAIN') {
      assignedRole = 'TEAM_CAPTAIN';
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: assignedRole,
        organizerStatus: assignedOrganizerStatus,
        ...(ign && bgmiUid
          ? {
              playerProfile: {
                create: {
                  ign,
                  bgmiUid,
                  primaryRole: primaryRole || 'ASSAULTER'
                }
              }
            }
          : {})
      },
      include: {
        playerProfile: true
      }
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      playerProfileId: newUser.playerProfile?.id
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        playerProfile: newUser.playerProfile,
        captainedTeams: []
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // email or username

    if (!identifier || !password) {
      res.status(400).json({ error: 'Identifier and password are required.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }]
      },
      include: {
        playerProfile: {
          include: {
            currentTeam: true
          }
        },
        captainedTeams: {
          include: {
            members: {
              include: {
                player: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      playerProfileId: user.playerProfile?.id
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        playerProfile: user.playerProfile,
        captainedTeams: user.captainedTeams
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        playerProfile: {
          include: {
            currentTeam: true
          }
        },
        captainedTeams: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { password, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { ign, bgmiUid, primaryRole, device, bio, avatar, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
        playerProfile: {
          upsert: {
            create: {
              ign: ign || req.user.username,
              bgmiUid: bgmiUid || '0000000000',
              primaryRole: primaryRole || 'ASSAULTER',
              device,
              bio
            },
            update: {
              ...(ign && { ign }),
              ...(bgmiUid && { bgmiUid }),
              ...(primaryRole && { primaryRole }),
              ...(device !== undefined && { device }),
              ...(bio !== undefined && { bio })
            }
          }
        }
      },
      include: {
        playerProfile: {
          include: { currentTeam: true }
        }
      }
    });

    const { password, ...safeUser } = updatedUser;
    res.json({ message: 'Profile updated successfully.', user: safeUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Profile update failed.' });
  }
};
