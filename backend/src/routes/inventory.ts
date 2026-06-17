import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/inventory/items
router.get('/items', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search, category, lowStock, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.userId };

    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    let items = await prisma.inventoryItem.findMany({
      where,
      include: { sizes: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    if (lowStock === 'true') {
      items = items.filter((item) =>
        item.sizes.some((size) => size.quantity < size.minThreshold)
      );
    }

    const total = await prisma.inventoryItem.count({ where });

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get items error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/items
router.post('/items', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, sku, category, unit, supplier, location, imageUrl, notes, sizes } = req.body;

    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Name, category, and unit are required' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        userId: req.userId,
        name,
        sku,
        category,
        unit,
        supplier,
        location,
        imageUrl,
        notes,
        sizes: {
          create: sizes || [],
        },
      },
      include: { sizes: true },
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Create item error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/items/:id
router.get('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        sizes: true,
        movements: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Get item error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/items/:id
router.put('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, sku, category, unit, supplier, location, imageUrl, notes } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(category && { category }),
        ...(unit && { unit }),
        ...(supplier && { supplier }),
        ...(location && { location }),
        ...(imageUrl && { imageUrl }),
        ...(notes !== undefined && { notes }),
      },
      include: { sizes: true },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update item error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/items/:id
router.delete('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: 'Item deleted' });
  } catch (error: any) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/items/:id/sizes
router.post('/items/:id/sizes', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { sizeLabel, quantity, minThreshold, purchasePrice, sellingPrice } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const size = await prisma.inventorySize.create({
      data: {
        itemId: id,
        sizeLabel,
        quantity: parseFloat(quantity),
        minThreshold: parseFloat(minThreshold || 0),
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
      },
    });

    res.status(201).json(size);
  } catch (error: any) {
    console.error('Create size error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/items/:id/sizes/:sizeId
router.put('/items/:id/sizes/:sizeId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, sizeId } = req.params;
    const { quantity, minThreshold, purchasePrice, sellingPrice } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const size = await prisma.inventorySize.update({
      where: { id: sizeId },
      data: {
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(minThreshold !== undefined && { minThreshold: parseFloat(minThreshold) }),
        ...(purchasePrice && { purchasePrice: parseFloat(purchasePrice) }),
        ...(sellingPrice && { sellingPrice: parseFloat(sellingPrice) }),
      },
    });

    res.json(size);
  } catch (error: any) {
    console.error('Update size error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/items/:id/sizes/:sizeId
router.delete('/items/:id/sizes/:sizeId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, sizeId } = req.params;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.inventorySize.delete({ where: { id: sizeId } });
    res.json({ message: 'Size deleted' });
  } catch (error: any) {
    console.error('Delete size error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const items = await prisma.inventoryItem.findMany({
      where: { userId: req.userId },
      include: { sizes: true },
    });

    const lowStock = items
      .flatMap((item) =>
        item.sizes
          .filter((size) => size.quantity < size.minThreshold)
          .map((size) => ({
            ...size,
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
          }))
      )
      .sort((a, b) => a.quantity - b.quantity);

    res.json(lowStock);
  } catch (error: any) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const items = await prisma.inventoryItem.findMany({
      where: { userId: req.userId },
      include: { sizes: true },
    });

    const totalItems = items.length;
    let totalValue = 0;
    const categoryBreakdown: any = {};

    items.forEach((item) => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = 0;
      }

      item.sizes.forEach((size) => {
        const itemValue = size.quantity * size.purchasePrice;
        totalValue += itemValue;
        categoryBreakdown[item.category] += itemValue;
      });
    });

    res.json({
      totalItems,
      totalValue,
      categoryBreakdown,
    });
  } catch (error: any) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
