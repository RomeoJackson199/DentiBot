import express from 'express';
import { addMinutes, isBefore, parseISO } from 'date-fns';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const buildAppointmentFilter = (user, scope) => {
  if (scope === 'professional' || user.role === 'professional') {
    return { professionalId: user.id };
  }
  if (scope === 'client' || user.role === 'client') {
    return { clientId: user.id };
  }
  return {
    OR: [{ clientId: user.id }, { professionalId: user.id }],
  };
};

router.get('/', authenticate(), async (req, res) => {
  const { scope } = req.query;
  try {
    const appointments = await prisma.appointment.findMany({
      where: buildAppointmentFilter(req.user, scope),
      include: {
        service: true,
        client: { select: { id: true, name: true, email: true } },
        professional: { select: { id: true, name: true, email: true } },
        payment: true,
      },
      orderBy: { startTime: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    console.error('Failed to load appointments', error);
    res.status(500).json({ message: 'Unable to load appointments' });
  }
});

router.get('/availability', authenticate(), async (req, res) => {
  const { professionalId, serviceId, date } = req.query;

  if (!professionalId || !serviceId || !date) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
    });

    const slots = [];
    let cursor = new Date(`${date}T08:00:00.000Z`);
    const businessClose = new Date(`${date}T20:00:00.000Z`);

    while (isBefore(addMinutes(cursor, service.duration), businessClose)) {
      const candidateStart = cursor;
      const candidateEnd = addMinutes(candidateStart, service.duration);

      const overlapping = appointments.some((appointment) => {
        return (
          (candidateStart >= appointment.startTime && candidateStart < appointment.endTime) ||
          (candidateEnd > appointment.startTime && candidateEnd <= appointment.endTime) ||
          (candidateStart <= appointment.startTime && candidateEnd >= appointment.endTime)
        );
      });

      if (!overlapping) {
        slots.push({
          startTime: candidateStart.toISOString(),
          endTime: candidateEnd.toISOString(),
        });
      }

      cursor = addMinutes(cursor, Math.max(30, Math.round(service.duration / 2)));
    }

    res.json({ slots });
  } catch (error) {
    console.error('Failed to load availability', error);
    res.status(500).json({ message: 'Unable to load availability' });
  }
});

router.post('/', authenticate(), async (req, res) => {
  const { clientId, professionalId: rawProfessionalId, serviceId, startTime } = req.body;

  if (!clientId || !rawProfessionalId || !serviceId || !startTime) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let professionalId = rawProfessionalId;
    const professionalExists = await prisma.user.findUnique({ where: { id: professionalId } });

    if (!professionalExists) {
      const business = await prisma.business.findUnique({ where: { id: rawProfessionalId }, include: { owner: true } });
      if (!business || !business.ownerId) {
        return res.status(404).json({ message: 'Professional not found' });
      }
      professionalId = business.ownerId;
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const start = parseISO(startTime);
    const end = addMinutes(start, service.duration);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        professionalId,
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(409).json({ message: 'Selected time overlaps with an existing appointment' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        professionalId,
        serviceId,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
      },
      include: {
        service: true,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        payerId: clientId,
        amount: appointment.service.price,
        method: 'stripe',
        status: 'PENDING',
      },
    });

    res.status(201).json({ appointment, payment });
  } catch (error) {
    console.error('Failed to create appointment', error);
    res.status(500).json({ message: 'Unable to create appointment' });
  }
});

router.patch('/:id/status', authenticate(), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        service: true,
        payment: true,
      },
    });
    res.json(appointment);
  } catch (error) {
    console.error('Failed to update appointment status', error);
    res.status(500).json({ message: 'Unable to update appointment status' });
  }
});

export default router;
