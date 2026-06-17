import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/budgets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month, year } = req.query;
    const now = new Date();
    const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1;
    const currentYear = year ? parseInt(year as string) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    res.json(budgets);
  } catch (error: any) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/budgets
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { category, amount, month, year } = req.body;

    if (!category || !amount || !month || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.userId,
        category,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    res.status(201).json(budget);
  } catch (error: any) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/budgets/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { category, amount, month, year } = req.body;

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== req.userId) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(month && { month: parseInt(month) }),
        ...(year && { year: parseInt(year) }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== req.userId) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted' });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/budgets/progress
router.get('/progress', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month, year } = req.query;
    const now = new Date();
    const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1;
    const currentYear = year ? parseInt(year as string) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        type: 'expense',
        date: { gte: startDate, lte: endDate },
      },
    });

    const progress = budgets.map((budget) => {
      const spent = transactions
        .filter((t) => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentage: (spent / budget.amount) * 100,
      };
    });

    res.json(progress);
  } catch (error: any) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
