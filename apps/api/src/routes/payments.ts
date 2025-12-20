import {
  db,
  eq,
  getAvailablePaymentProviders,
  getPaymentAdapter,
  order,
  payment,
  paymentEvent,
} from '@echoppe/core';
import type { PaymentProvider } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { authPlugin } from '../plugins/auth';

const checkoutBody = t.Object({
  orderId: t.String({ format: 'uuid' }),
  provider: t.Union([t.Literal('stripe'), t.Literal('paypal')]),
  successUrl: t.String({ format: 'uri' }),
  cancelUrl: t.String({ format: 'uri' }),
});

const uuidParam = t.Object({
  orderId: t.String({ format: 'uuid' }),
});

export const paymentsRoutes = new Elysia({ prefix: '/payments' })
  .use(authPlugin)

  // GET /payments/providers - Liste des providers disponibles
  .get(
    '/providers',
    () => {
      return getAvailablePaymentProviders();
    },
    { auth: true },
  )

  // POST /payments/checkout - Créer une session de paiement
  .post(
    '/checkout',
    async ({ body, status }) => {
      const adapter = getPaymentAdapter(body.provider);

      if (!adapter.isConfigured()) {
        return status(400, { message: `Provider ${body.provider} non configuré` });
      }

      // Récupérer la commande
      const [orderData] = await db
        .select()
        .from(order)
        .where(eq(order.id, body.orderId));

      if (!orderData) {
        return status(404, { message: 'Commande introuvable' });
      }

      // Vérifier qu'il n'y a pas déjà un paiement complété
      const [existingPayment] = await db
        .select()
        .from(payment)
        .where(eq(payment.order, body.orderId));

      if (existingPayment?.status === 'completed') {
        return status(400, { message: 'Cette commande a déjà été payée' });
      }

      // Montant en centimes
      const amountCents = Math.round(parseFloat(orderData.totalTtc) * 100);

      // Créer la session de checkout
      const session = await adapter.createCheckout({
        orderId: body.orderId,
        amount: amountCents,
        currency: 'EUR',
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        metadata: {
          orderNumber: orderData.orderNumber,
        },
      });

      // Créer ou mettre à jour l'entrée payment
      if (existingPayment) {
        await db
          .update(payment)
          .set({
            provider: body.provider,
            status: 'pending',
            dateUpdated: new Date(),
          })
          .where(eq(payment.id, existingPayment.id));
      } else {
        await db.insert(payment).values({
          order: body.orderId,
          provider: body.provider,
          status: 'pending',
          amount: orderData.totalTtc,
        });
      }

      // Log l'événement
      const [paymentRecord] = await db
        .select()
        .from(payment)
        .where(eq(payment.order, body.orderId));

      if (paymentRecord) {
        await db.insert(paymentEvent).values({
          payment: paymentRecord.id,
          type: 'checkout_created',
          data: { sessionId: session.id, provider: body.provider },
        });
      }

      return {
        sessionId: session.id,
        url: session.url,
        provider: session.provider,
      };
    },
    { body: checkoutBody },
  )

  // GET /payments/:orderId - Statut du paiement
  .get(
    '/:orderId',
    async ({ params, status }) => {
      const [paymentData] = await db
        .select()
        .from(payment)
        .where(eq(payment.order, params.orderId));

      if (!paymentData) {
        return status(404, { message: 'Paiement introuvable' });
      }

      return paymentData;
    },
    { auth: true, params: uuidParam },
  )

  // POST /payments/webhook/stripe - Webhook Stripe
  .post(
    '/webhook/stripe',
    async ({ request, status }) => {
      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        return status(400, { message: 'Missing signature' });
      }

      const payload = await request.text();
      const adapter = getPaymentAdapter('stripe');

      try {
        const result = await adapter.verifyWebhook(payload, signature);

        if (result.orderId && result.status !== 'pending') {
          await handlePaymentResult(result.orderId, 'stripe', result);
        }

        return { received: true };
      } catch (error) {
        console.error('Stripe webhook error:', error);
        return status(400, { message: 'Webhook verification failed' });
      }
    },
  )

  // POST /payments/webhook/paypal - Webhook PayPal
  .post(
    '/webhook/paypal',
    async ({ request, status }) => {
      const payload = await request.text();
      const signature = request.headers.get('paypal-transmission-sig') ?? '';
      const adapter = getPaymentAdapter('paypal');

      try {
        const result = await adapter.verifyWebhook(payload, signature);

        if (result.orderId && result.status !== 'pending') {
          await handlePaymentResult(result.orderId, 'paypal', result);
        }

        return { received: true };
      } catch (error) {
        console.error('PayPal webhook error:', error);
        return status(400, { message: 'Webhook verification failed' });
      }
    },
  )

  // POST /payments/:orderId/refund - Rembourser (admin)
  .post(
    '/:orderId/refund',
    async ({ params, body, status }) => {
      const [paymentData] = await db
        .select()
        .from(payment)
        .where(eq(payment.order, params.orderId));

      if (!paymentData) {
        return status(404, { message: 'Paiement introuvable' });
      }

      if (paymentData.status !== 'completed') {
        return status(400, { message: 'Seuls les paiements complétés peuvent être remboursés' });
      }

      if (!paymentData.providerTransactionId) {
        return status(400, { message: 'Transaction ID manquant' });
      }

      const adapter = getPaymentAdapter(paymentData.provider as PaymentProvider);
      const amountCents = body.amount ? Math.round(body.amount * 100) : undefined;

      const result = await adapter.refund(paymentData.providerTransactionId, amountCents);

      if (result.success) {
        await db
          .update(payment)
          .set({ status: 'refunded', dateUpdated: new Date() })
          .where(eq(payment.id, paymentData.id));

        await db.insert(paymentEvent).values({
          payment: paymentData.id,
          type: 'refund',
          data: { refundId: result.refundId, amount: body.amount },
        });

        // Mettre à jour le statut de la commande
        await db
          .update(order)
          .set({ status: 'refunded', dateUpdated: new Date() })
          .where(eq(order.id, params.orderId));
      }

      return result;
    },
    {
      auth: true,
      params: uuidParam,
      body: t.Object({
        amount: t.Optional(t.Number({ minimum: 0 })), // undefined = remboursement total
      }),
    },
  );

// Helper pour traiter les résultats de paiement
async function handlePaymentResult(
  orderId: string,
  _provider: PaymentProvider,
  result: { transactionId: string; status: string; rawData: unknown },
) {
  const [paymentData] = await db
    .select()
    .from(payment)
    .where(eq(payment.order, orderId));

  if (!paymentData) {
    console.error(`Payment not found for order ${orderId}`);
    return;
  }

  // Mettre à jour le paiement
  await db
    .update(payment)
    .set({
      status: result.status as 'completed' | 'failed' | 'refunded',
      providerTransactionId: result.transactionId,
      dateUpdated: new Date(),
    })
    .where(eq(payment.id, paymentData.id));

  // Log l'événement
  await db.insert(paymentEvent).values({
    payment: paymentData.id,
    type: result.status === 'completed' ? 'success' : result.status,
    data: result.rawData,
  });

  // Mettre à jour le statut de la commande si paiement réussi
  if (result.status === 'completed') {
    await db
      .update(order)
      .set({ status: 'confirmed', dateUpdated: new Date() })
      .where(eq(order.id, orderId));
  }
}
