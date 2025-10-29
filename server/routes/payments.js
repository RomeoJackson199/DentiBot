import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: '2024-06-20' });
};

router.get('/', authenticate(), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: req.user.role === 'professional' ? { appointment: { professionalId: req.user.id } } : { payerId: req.user.id },
      include: {
        appointment: {
          include: { service: true, client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Failed to list payments', error);
    res.status(500).json({ message: 'Unable to load payments' });
  }
});

router.post('/create-checkout-session', authenticate(), async (req, res) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ message: 'Appointment id is required' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, payment: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const payment = appointment.payment;

    if (!payment) {
      return res.status(404).json({ message: 'Payment record missing for appointment' });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Fallback when Stripe is not configured
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', method: 'manual', stripeSession: 'demo-session' },
      });
      return res.json({
        sessionId: 'demo-session',
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/success`,
        message: 'Stripe is not configured. Payment marked as paid for demo purposes.',
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: appointment.service.title,
            },
            unit_amount: Math.round(payment.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/cancelled`,
      metadata: {
        appointmentId: appointment.id,
        paymentId: payment.id,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSession: session.id },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Failed to create checkout session', error);
    res.status(500).json({ message: 'Unable to start payment' });
  }
});

export const paymentsWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(400).json({ message: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', method: session.payment_method_types?.[0] || 'card' },
      });
    }
  }

  res.json({ received: true });
};

export default router;
