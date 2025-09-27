import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/actors
 * Get all available actors
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const actors = await prisma.actor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      actors
    });

  } catch (error: any) {
    console.error('Error fetching actors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actors'
    });
  }
});

/**
 * GET /api/actors/:id
 * Get specific actor details
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const actor = await prisma.actor.findUnique({
      where: { id: req.params.id }
    });

    if (!actor) {
      return res.status(404).json({
        success: false,
        error: 'Actor not found'
      });
    }

    res.json({
      success: true,
      actor
    });

  } catch (error: any) {
    console.error('Error fetching actor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actor'
    });
  }
});

/**
 * POST /api/actors
 * Create a new actor (admin endpoint)
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  const { id, name, description } = req.body;

  if (!id || !name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: id, name'
    });
  }

  try {
    const actor = await prisma.actor.create({
      data: {
        id,
        name,
        description: description || null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      actor
    });

  } catch (error: any) {
    console.error('Error creating actor:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Actor with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create actor'
    });
  }
});

/**
 * PUT /api/actors/:id
 * Update actor details (admin endpoint)
 */
router.put('/:id', async (req: express.Request, res: express.Response) => {
  const { name, description, isActive } = req.body;

  try {
    const actor = await prisma.actor.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      actor
    });

  } catch (error: any) {
    console.error('Error updating actor:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Actor not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update actor'
    });
  }
});

/**
 * DELETE /api/actors/:id
 * Deactivate actor (admin endpoint)
 */
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const actor = await prisma.actor.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Actor deactivated successfully'
    });

  } catch (error: any) {
    console.error('Error deactivating actor:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Actor not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to deactivate actor'
    });
  }
});

export default router;
