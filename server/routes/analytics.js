import express from 'express';
import { subDays } from 'date-fns';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', authenticate(), async (req, res) => {
  try {
    const baseFilter = req.user.role === 'professional'
      ? { professionalId: req.user.id }
      : { clientId: req.user.id };

    const since = subDays(new Date(), 30);

    const [appointments, payments, clients] = await Promise.all([
      prisma.appointment.findMany({
        where: { ...baseFilter, startTime: { gte: since } },
        include: { service: true },
      }),
      prisma.payment.findMany({
        where: req.user.role === 'professional'
          ? { appointment: { professionalId: req.user.id }, createdAt: { gte: since } }
          : { payerId: req.user.id, createdAt: { gte: since } },
      }),
      prisma.user.count({ where: { role: 'client', businessId: req.user.businessId ?? undefined } }),
    ]);

    const revenue = payments.filter((payment) => payment.status === 'PAID').reduce((sum, payment) => sum + payment.amount, 0);

    const weekly = {};
    appointments.forEach((appointment) => {
      const week = appointment.startTime.toISOString().slice(0, 10);
      weekly[week] = (weekly[week] || 0) + 1;
    });

    res.json({
      totalAppointments: appointments.length,
      revenue,
      clients,
      weeklyBookings: Object.entries(weekly).map(([date, value]) => ({ date, value })),
    });
  } catch (error) {
    console.error('Failed to load analytics', error);
    res.status(500).json({ message: 'Unable to load analytics data' });
  }
});

export default router;
