import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/stock
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { itemId, type, dateFrom, dateTo, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.userId };

    if (itemId) where.itemId = itemId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { item: true },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({
      movements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get movements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { itemId, sizeLabel, type, quantity, date, reference, notes } = req.body;

    if (!itemId || !sizeLabel || !type || !quantity || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const size = await prisma.inventorySize.findFirst({
      where: { itemId, sizeLabel },
    });

    if (!size) {
      return res.status(404).json({ error: 'Size not found' });
    }

    // Update quantity based on movement type
    const newQuantity =
      type === 'IN' ? size.quantity + parseFloat(quantity) : size.quantity - parseFloat(quantity);

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock for OUT movement' });
    }

    await prisma.inventorySize.update({
      where: { id: size.id },
      data: { quantity: newQuantity },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        userId: req.userId,
        itemId,
        sizeLabel,
        type,
        quantity: parseFloat(quantity),
        date: new Date(date),
        reference,
        notes,
      },
    });

    res.status(201).json(movement);
  } catch (error: any) {
    console.error('Create movement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stock/item/:itemId
router.get('/item/:itemId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { itemId } = req.params;

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const movements = await prisma.stockMovement.findMany({
      where: { itemId },
      orderBy: { date: 'desc' },
    });

    res.json(movements);
  } catch (error: any) {
    console.error('Get item movements error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
