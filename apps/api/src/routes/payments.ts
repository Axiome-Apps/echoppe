import {
  db,
  eq,
  and,
  cart,
  getPaymentAdapter,
  getProviderStatus,
  isEncryptionConfigured,
  order,
  payment,
  paymentEvent,
  resetPaymentAdapters,
  saveProviderCredentials,
} from '@echoppe/core';
import type { PaymentProvider, PayPalCredentials, StripeCredentials } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { permissionGuard } from '../plugins/rbac';

const checkoutBody = t.Object({
  orderId: t.String({ format: 'uuid' }),
  provider: t.Union([t.Literal('stripe'), t.Literal('paypal')]),
  successUrl: t.String({ format: 'uri' }),
  cancelUrl: t.String({ format: 'uri' }),
});

const uuidParam = t.Object({
  orderId: t.String({ format: 'uuid' }),
});

const stripeConfigBody = t.Object({
  secretKey: t.String({ minLength: 1 }),
  webhookSecret: t.String({ minLength: 1 }),
  isEnabled: t.Optional(t.Boolean()),
});

const paypalConfigBody = t.Object({
  clientId: t.String({ minLength: 1 }),
  clientSecret: t.String({ minLength: 1 }),
  mode: t.Union([t.Literal('sandbox'), t.Literal('live')]),
  isEnabled: t.Optional(t.Boolean()),
});

// Response schemas
const errorSchema = t.Object({ message: t.String() });
const successSchema = t.Object({ success: t.Boolean() });

const providerFieldSchema = t.Object({
  key: t.String(),
  label: t.String(),
  type: t.String(),
  placeholder: t.Optional(t.String()),
});

const providerStatusSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  fields: t.Array(providerFieldSchema),
  isConfigured: t.Boolean(),
  isEnabled: t.Boolean(),
  encryptionReady: t.Boolean(),
});

const checkoutSessionSchema = t.Object({
  sessionId: t.String(),
  url: t.String(),
  provider: t.String(),
});

const paymentSchema = t.Object({
  id: t.String(),
  order: t.String(),
  provider: t.String(),
  status: t.String(),
  amount: t.String(),
  providerTransactionId: t.Nullable(t.String()),
  dateCreated: t.Date(),
  dateUpdated: t.Nullable(t.Date()),
});

const webhookReceivedSchema = t.Object({ received: t.Boolean() });

const refundResultSchema = t.Object({
  success: t.Boolean(),
  refundId: t.Optional(t.String()),
});

const providerMeta: Record<
  PaymentProvider,
  { name: string; description: string; fields: { key: string; label: string; type: string; placeholder?: string }[] }
> = {
  stripe: {
    name: 'Stripe',
    description: 'Paiements par carte bancaire',
    fields: [
      { key: 'secretKey', label: 'Clé secrète', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Secret webhook', type: 'password', placeholder: 'whsec_...' },
    ],
  },
  paypal: {
    name: 'PayPal',
    description: 'Paiements via compte PayPal',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'AX...' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'EL...' },
      { key: 'mode', label: 'Mode', type: 'select', placeholder: 'sandbox' },
    ],
  },
};

export const paymentsRoutes = new Elysia({ prefix: '/payments', detail: { tags: ['Payments'] } })

  // === PAYMENT CONFIG READ ===
  .use(permissionGuard('payment_config', 'read'))

  // GET /payments/providers - Liste des providers avec statut
  .get(
    '/providers',
    async () => {
      const providers: PaymentProvider[] = ['stripe', 'paypal'];
      const encryptionReady = isEncryptionConfigured();

      const result = await Promise.all(
        providers.map(async (id) => {
          const status = await getProviderStatus(id);
          return {
            id,
            ...providerMeta[id],
            ...status,
            encryptionReady,
          };
        }),
      );

      return result;
    },
    { permission: true, response: { 200: t.Array(providerStatusSchema) } },
  )

  // === PAYMENT CONFIG UPDATE ===
  .use(permissionGuard('payment_config', 'update'))

  // PUT /payments/providers/stripe - Configure Stripe
  .put(
    '/providers/stripe',
    async ({ body, status }) => {
      if (!isEncryptionConfigured()) {
        return status(400, { message: 'ENCRYPTION_KEY non configurée' });
      }

      const credentials: StripeCredentials = {
        secretKey: body.secretKey,
        webhookSecret: body.webhookSecret,
      };

      await saveProviderCredentials('stripe', credentials, body.isEnabled ?? true);
      resetPaymentAdapters();

      return { success: true };
    },
    { permission: true, body: stripeConfigBody, response: { 200: successSchema, 400: errorSchema } },
  )

  // PUT /payments/providers/paypal - Configure PayPal
  .put(
    '/providers/paypal',
    async ({ body, status }) => {
      if (!isEncryptionConfigured()) {
        return status(400, { message: 'ENCRYPTION_KEY non configurée' });
      }

      const credentials: PayPalCredentials = {
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        mode: body.mode,
      };

      await saveProviderCredentials('paypal', credentials, body.isEnabled ?? true);
      resetPaymentAdapters();

      return { success: true };
    },
    { permission: true, body: paypalConfigBody, response: { 200: successSchema, 400: errorSchema } },
  )

  // === PUBLIC ROUTES (no auth needed) ===

  // POST /payments/checkout - Créer une session de paiement (public for checkout flow)
  .post(
    '/checkout',
    async ({ body, status }) => {
      const adapter = getPaymentAdapter(body.provider);

      if (!(await adapter.isConfigured())) {
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
    { body: checkoutBody, response: { 200: checkoutSessionSchema, 400: errorSchema, 404: errorSchema } },
  )

  // POST /payments/webhook/stripe - Webhook Stripe (public)
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
    { response: { 200: webhookReceivedSchema, 400: errorSchema } },
  )

  // POST /payments/webhook/paypal - Webhook PayPal (public)
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
    { response: { 200: webhookReceivedSchema, 400: errorSchema } },
  )

  // === ORDER READ (payment status) ===
  .use(permissionGuard('order', 'read'))

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
    { permission: true, params: uuidParam, response: { 200: paymentSchema, 404: errorSchema } },
  )

  // === ORDER UPDATE (refund) ===
  .use(permissionGuard('order', 'update'))

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
      permission: true,
      params: uuidParam,
      body: t.Object({
        amount: t.Optional(t.Number({ minimum: 0 })),
      }),
      response: { 200: refundResultSchema, 400: errorSchema, 404: errorSchema },
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
    // Get the order to find the customer
    const [orderData] = await db
      .select({ customer: order.customer })
      .from(order)
      .where(eq(order.id, orderId));

    if (orderData) {
      // Convert customer's active cart
      await db
        .update(cart)
        .set({ status: 'converted', dateUpdated: new Date() })
        .where(and(eq(cart.customer, orderData.customer), eq(cart.status, 'active')));
    }

    await db
      .update(order)
      .set({ status: 'confirmed', dateUpdated: new Date() })
      .where(eq(order.id, orderId));
  }
}
