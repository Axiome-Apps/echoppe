import { Elysia, t } from 'elysia';
import { db, customer, customerSession, eq, and, gt } from '@echoppe/core';

export const CUSTOMER_COOKIE_NAME = 'echoppe_customer_session';

export const customerCookieSchema = t.Cookie({
  [CUSTOMER_COOKIE_NAME]: t.Optional(t.String()),
});

export type SessionCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerified: boolean;
};

export type CustomerAuthContext = {
  currentCustomer: SessionCustomer | null;
  isAuthenticated: boolean;
};

export async function getCustomerSessionFromToken(
  token: string | undefined,
): Promise<CustomerAuthContext> {
  if (!token) {
    return { currentCustomer: null, isAuthenticated: false };
  }

  const [sessionData] = await db
    .select({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
      },
    })
    .from(customerSession)
    .innerJoin(customer, eq(customerSession.customer, customer.id))
    .where(and(eq(customerSession.token, token), gt(customerSession.expiresAt, new Date())));

  if (!sessionData) {
    return { currentCustomer: null, isAuthenticated: false };
  }

  return {
    currentCustomer: sessionData.customer as SessionCustomer,
    isAuthenticated: true,
  };
}

export const customerAuthPlugin = new Elysia({ name: 'customerAuth' }).macro({
  customerAuth: {
    async resolve({ cookie, status }) {
      const token = (cookie as Record<string, { value?: string }>)[CUSTOMER_COOKIE_NAME]?.value;
      const session = await getCustomerSessionFromToken(token);

      if (!session.isAuthenticated) {
        return status(401, { message: 'Non authentifié' });
      }

      return {
        currentCustomer: session.currentCustomer,
      };
    },
  },
});
