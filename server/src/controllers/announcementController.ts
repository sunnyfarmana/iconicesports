import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, role: true } }
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ announcements });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { title, content, category, isPinned } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required.' });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        isPinned: !!isPinned,
        authorId: req.user.id
      },
      include: {
        author: { select: { username: true } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_announcement', announcement);
    }

    res.status(201).json({ message: 'Announcement created successfully.', announcement });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id }
    });

    res.json({ message: 'Announcement deleted.' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};
