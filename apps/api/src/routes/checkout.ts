import { Elysia, t } from 'elysia';
import {
  db,
  cart,
  cartItem,
  variant,
  product,
  order,
  orderItem,
  country,
  taxRate,
  eq,
  and,
  inArray,
  sql,
  getAvailablePaymentProviders,
  getPaymentAdapter,
  payment,
} from '@echoppe/core';
import {
  customerAuthPlugin,
  type SessionCustomer,
} from '../plugins/customerAuth';

const addressInputSchema = t.Object({
  firstName: t.String({ minLength: 1, maxLength: 100 }),
  lastName: t.String({ minLength: 1, maxLength: 100 }),
  company: t.Optional(t.String({ maxLength: 100 })),
  street: t.String({ minLength: 1, maxLength: 255 }),
  street2: t.Optional(t.String({ maxLength: 255 })),
  postalCode: t.String({ minLength: 1, maxLength: 10 }),
  city: t.String({ minLength: 1, maxLength: 100 }),
  countryCode: t.String({ minLength: 2, maxLength: 2 }),
  phone: t.Optional(t.String({ maxLength: 20 })),
});

const checkoutBodySchema = t.Object({
  shippingAddress: addressInputSchema,
  billingAddress: t.Optional(addressInputSchema),
  useSameAddress: t.Optional(t.Boolean()),
  customerNote: t.Optional(t.String({ maxLength: 500 })),
  paymentProvider: t.Union([t.Literal('stripe'), t.Literal('paypal')]),
  successUrl: t.String({ format: 'uri' }),
  cancelUrl: t.String({ format: 'uri' }),
});

const errorSchema = t.Object({ message: t.String() });

const providerInfoSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
});

const checkoutResultSchema = t.Object({
  orderId: t.String(),
  orderNumber: t.String(),
  paymentUrl: t.String(),
  provider: t.String(),
});

// Generate order number: CMD-YYYY-XXXXX
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Get the count of orders this year
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(order)
    .where(sql`EXTRACT(YEAR FROM ${order.dateCreated}) = ${year}`);

  const num = (Number(result?.count ?? 0) + 1).toString().padStart(5, '0');
  return `CMD-${year}-${num}`;
}

// Create address snapshot for order
interface AddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  postalCode: string;
  city: string;
  countryCode: string;
  phone?: string;
}

interface AddressSnapshot {
  firstName: string;
  lastName: string;
  company: string | null;
  street: string;
  street2: string | null;
  postalCode: string;
  city: string;
  country: {
    code: string;
    name: string;
  };
  phone: string | null;
}

async function createAddressSnapshot(input: AddressInput): Promise<AddressSnapshot | null> {
  const [countryData] = await db
    .select({ code: country.code, name: country.name })
    .from(country)
    .where(eq(country.code, input.countryCode.toUpperCase()));

  if (!countryData) {
    return null;
  }

  return {
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company ?? null,
    street: input.street,
    street2: input.street2 ?? null,
    postalCode: input.postalCode,
    city: input.city,
    country: countryData,
    phone: input.phone ?? null,
  };
}

export const checkoutRoutes = new Elysia({
  prefix: '/checkout',
  detail: { tags: ['Checkout'] },
})
  // GET /checkout/payment-providers - List available payment providers (public)
  .get(
    '/payment-providers',
    async () => {
      const providers = await getAvailablePaymentProviders();

      const providerMeta: Record<string, { name: string; description: string }> = {
        stripe: { name: 'Carte bancaire', description: 'Paiement sécurisé par carte' },
        paypal: { name: 'PayPal', description: 'Paiement via compte PayPal' },
      };

      return providers.map((id) => ({
        id,
        ...providerMeta[id],
      }));
    },
    { response: { 200: t.Array(providerInfoSchema) } },
  )

  // Use customer auth for checkout
  .use(customerAuthPlugin)

  // POST /checkout - Create order from cart and initiate payment
  .post(
    '/',
    async ({ body, currentCustomer, status }) => {
      const customer = currentCustomer as SessionCustomer;

      // 1. Get customer's active cart
      const [cartData] = await db
        .select({ id: cart.id })
        .from(cart)
        .where(and(eq(cart.customer, customer.id), eq(cart.status, 'active')));

      if (!cartData) {
        return status(400, { message: 'Votre panier est vide' });
      }

      // 2. Get cart items with product and variant info
      const items = await db
        .select({
          id: cartItem.id,
          quantity: cartItem.quantity,
          variant: {
            id: variant.id,
            priceHt: variant.priceHt,
            sku: variant.sku,
            quantity: variant.quantity,
            reserved: variant.reserved,
          },
          product: {
            id: product.id,
            name: product.name,
            taxRateId: product.taxRate,
          },
        })
        .from(cartItem)
        .innerJoin(variant, eq(cartItem.variant, variant.id))
        .innerJoin(product, eq(variant.product, product.id))
        .where(eq(cartItem.cart, cartData.id));

      if (items.length === 0) {
        return status(400, { message: 'Votre panier est vide' });
      }

      // 3. Check stock availability
      for (const item of items) {
        const available = item.variant.quantity - item.variant.reserved;
        if (item.quantity > available) {
          return status(400, {
            message: `Stock insuffisant pour ${item.product.name} (${available} disponible)`
          });
        }
      }

      // 4. Verify payment provider is available
      const adapter = getPaymentAdapter(body.paymentProvider);
      if (!(await adapter.isConfigured())) {
        return status(400, { message: `Mode de paiement ${body.paymentProvider} non disponible` });
      }

      // 5. Create address snapshots
      const shippingSnapshot = await createAddressSnapshot(body.shippingAddress);
      if (!shippingSnapshot) {
        return status(400, { message: 'Pays de livraison invalide' });
      }

      const billingAddress = body.useSameAddress ? body.shippingAddress : body.billingAddress;
      if (!billingAddress) {
        return status(400, { message: 'Adresse de facturation requise' });
      }

      const billingSnapshot = body.useSameAddress
        ? shippingSnapshot
        : await createAddressSnapshot(billingAddress);

      if (!billingSnapshot) {
        return status(400, { message: 'Pays de facturation invalide' });
      }

      // 6. Get tax rates for products
      const taxRateIds = [...new Set(items.map((item) => item.product.taxRateId))];
      const taxRates = await db
        .select({ id: taxRate.id, rate: taxRate.rate })
        .from(taxRate)
        .where(inArray(taxRate.id, taxRateIds));
      const taxRateMap = new Map(taxRates.map((tr) => [tr.id, parseFloat(tr.rate)]));

      // 7. Calculate order totals
      let subtotalHt = 0;
      const orderItems: Array<{
        variantId: string;
        label: string;
        quantity: number;
        unitPriceHt: number;
        taxRateValue: number;
        totalHt: number;
        totalTtc: number;
      }> = [];

      for (const item of items) {
        const unitPriceHt = parseFloat(item.variant.priceHt);
        const taxRateValue = taxRateMap.get(item.product.taxRateId) ?? 20;
        const totalHt = unitPriceHt * item.quantity;
        const totalTtc = totalHt * (1 + taxRateValue / 100);

        subtotalHt += totalHt;

        // Build label: "Product Name — SKU" or just "Product Name"
        const label = item.variant.sku
          ? `${item.product.name} — ${item.variant.sku}`
          : item.product.name;

        orderItems.push({
          variantId: item.variant.id,
          label,
          quantity: item.quantity,
          unitPriceHt,
          taxRateValue,
          totalHt,
          totalTtc,
        });
      }

      // For now, no shipping cost and no discount
      const shippingHt = 0;
      const discountHt = 0;
      const totalHt = subtotalHt + shippingHt - discountHt;

      // Calculate total tax based on individual item tax rates
      const totalTax = orderItems.reduce((sum, item) => {
        return sum + (item.totalTtc - item.totalHt);
      }, 0);

      const totalTtc = totalHt + totalTax;

      // 8. Generate order number
      const orderNumber = await generateOrderNumber();

      // 9. Create order
      const [createdOrder] = await db
        .insert(order)
        .values({
          orderNumber,
          customer: customer.id,
          status: 'pending',
          shippingAddress: shippingSnapshot,
          billingAddress: billingSnapshot,
          subtotalHt: subtotalHt.toFixed(2),
          shippingHt: shippingHt.toFixed(2),
          discountHt: discountHt.toFixed(2),
          totalHt: totalHt.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalTtc: totalTtc.toFixed(2),
          customerNote: body.customerNote,
        })
        .returning();

      // 10. Create order items
      await db.insert(orderItem).values(
        orderItems.map((item) => ({
          order: createdOrder.id,
          variant: item.variantId,
          label: item.label,
          quantity: item.quantity,
          unitPriceHt: item.unitPriceHt.toFixed(2),
          taxRate: item.taxRateValue.toFixed(2),
          totalHt: item.totalHt.toFixed(2),
          totalTtc: item.totalTtc.toFixed(2),
        })),
      );

      // 11. Cart will be converted when payment is confirmed via webhook
      // This allows the user to retry if payment fails

      // 12. Create payment session
      const amountCents = Math.round(totalTtc * 100);

      let session;
      try {
        session = await adapter.createCheckout({
          orderId: createdOrder.id,
          amount: amountCents,
          currency: 'EUR',
          successUrl: body.successUrl,
          cancelUrl: body.cancelUrl,
          metadata: {
            orderNumber,
          },
        });
      } catch (error) {
        // Payment session creation failed, rollback order
        await db.delete(orderItem).where(eq(orderItem.order, createdOrder.id));
        await db.delete(order).where(eq(order.id, createdOrder.id));

        const message = error instanceof Error ? error.message : 'Erreur lors de la création du paiement';
        return status(400, { message });
      }

      // 13. Create payment record
      await db.insert(payment).values({
        order: createdOrder.id,
        provider: body.paymentProvider,
        status: 'pending',
        amount: totalTtc.toFixed(2),
      });

      return {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        paymentUrl: session.url,
        provider: body.paymentProvider,
      };
    },
    {
      customerAuth: true,
      cookie: t.Cookie({
        echoppe_customer_session: t.Optional(t.String()),
      }),
      body: checkoutBodySchema,
      response: {
        200: checkoutResultSchema,
        400: errorSchema,
      },
    },
  );
