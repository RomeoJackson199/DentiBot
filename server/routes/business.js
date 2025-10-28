import express from 'express';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true } },
        _count: { select: { professionals: true, services: true, appointments: true } },
      },
    });

    res.json(
      businesses.map((business) => ({
        id: business.id,
        name: business.name,
        category: business.category,
        ownerName: business.owner?.name ?? null,
        professionalsCount: business._count.professionals,
        servicesCount: business._count.services,
        appointmentsCount: business._count.appointments,
      }))
    );
  } catch (error) {
    console.error('Failed to list businesses', error);
    res.status(500).json({ message: 'Unable to load businesses' });
  }
});

router.get('/:businessId/services', authenticate(), async (req, res) => {
  const { businessId } = req.params;
  try {
    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch (error) {
    console.error('Failed to fetch services', error);
    res.status(500).json({ message: 'Unable to load services' });
  }
});

router.post('/:businessId/services', authenticate(['professional']), async (req, res) => {
  const { businessId } = req.params;
  const { title, description, duration, price } = req.body;

  if (!title || !duration || !price) {
    return res.status(400).json({ message: 'Missing required fields for service' });
  }

  try {
    if (req.user.businessId !== businessId) {
      return res.status(403).json({ message: 'You can only manage services for your own business' });
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        title,
        description: description || '',
        duration,
        price,
      },
    });
    res.status(201).json(service);
  } catch (error) {
    console.error('Failed to create service', error);
    res.status(500).json({ message: 'Unable to create service' });
  }
});

export default router;
