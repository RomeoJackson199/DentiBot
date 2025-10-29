import express from 'express';
import OpenAI from 'openai';
import { addMinutes, isBefore } from 'date-fns';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const assistantInstructions = `You are Caberu's AI assistant. Help users schedule or manage services like fitness, beauty, or dental appointments professionally. Always keep the tone encouraging, inclusive, and clear. Offer to assist with bookings, rescheduling, cancellations, and answering basic FAQs.`;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const resolveProfessionalId = async (professionalId) => {
  if (!professionalId) return null;
  const user = await prisma.user.findUnique({ where: { id: professionalId } });
  if (user) return user.id;
  const business = await prisma.business.findUnique({ where: { id: professionalId } });
  return business?.ownerId ?? null;
};

const computeAvailability = async ({ professionalId, serviceId, date }) => {
  if (!professionalId || !serviceId || !date) {
    return [];
  }

  const resolvedProfessionalId = await resolveProfessionalId(professionalId);
  if (!resolvedProfessionalId) return [];

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: resolvedProfessionalId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
  });

  const slots = [];
  let cursor = new Date(`${date}T08:00:00.000Z`);
  const businessClose = new Date(`${date}T20:00:00.000Z`);

  while (isBefore(addMinutes(cursor, service.duration), businessClose)) {
    const start = cursor;
    const end = addMinutes(start, service.duration);

    const hasConflict = appointments.some((appointment) => {
      return (
        (start >= appointment.startTime && start < appointment.endTime) ||
        (end > appointment.startTime && end <= appointment.endTime) ||
        (start <= appointment.startTime && end >= appointment.endTime)
      );
    });

    if (!hasConflict) {
      slots.push({ startTime: start.toISOString(), endTime: end.toISOString() });
    }

    cursor = addMinutes(cursor, Math.max(30, Math.round(service.duration / 2)));
  }

  return slots.slice(0, 5);
};

router.post('/', authenticate(), async (req, res) => {
  const { message, context, professionalId, serviceId, date } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    let aiResponse = "I'm here to help you manage your sessions. Let me know if you want to see available times or adjust a booking.";

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: assistantInstructions },
          { role: 'user', content: message },
          ...(context ? [{ role: 'assistant', content: context }] : []),
        ],
        temperature: 0.5,
      });

      aiResponse = completion.choices?.[0]?.message?.content || aiResponse;
    }

    const suggestedSlots = await computeAvailability({ professionalId, serviceId, date });

    res.json({
      reply: aiResponse,
      suggestedSlots,
    });
  } catch (error) {
    console.error('AI assistant error', error);
    res.status(500).json({ message: 'Failed to generate AI response' });
  }
});

export default router;
