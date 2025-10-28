import express from 'express';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/thread/:partnerId', authenticate(), async (req, res) => {
  const { partnerId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: partnerId },
          { senderId: partnerId, receiverId: req.user.id },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    console.error('Failed to load messages', error);
    res.status(500).json({ message: 'Unable to load conversation' });
  }
});

router.post('/', authenticate(), async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Missing receiver or content' });
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Failed to send message', error);
    res.status(500).json({ message: 'Unable to send message' });
  }
});

export default router;
