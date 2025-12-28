import { Elysia, t } from 'elysia';
import { db, customer, customerSession, eq, and, gt, sendWelcomeEmail } from '@echoppe/core';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'echoppe_customer_session';
const SESSION_DURATION_DAYS = 30;

const cookieSchema = t.Cookie({
  [COOKIE_NAME]: t.Optional(t.String()),
});

// Response schemas
const customerSchema = t.Object({
  id: t.String(),
  email: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  phone: t.Nullable(t.String()),
  emailVerified: t.Boolean(),
  marketingOptin: t.Boolean(),
});

const registerResponseSchema = t.Object({
  customer: customerSchema,
});

const loginCustomerSchema = t.Object({
  id: t.String(),
  email: t.String(),
  firstName: t.String(),
  lastName: t.String(),
});

const loginResponseSchema = t.Object({
  customer: loginCustomerSchema,
});

const meResponseSchema = t.Object({
  customer: customerSchema,
});

const successSchema = t.Object({ success: t.Boolean() });
const errorSchema = t.Object({ message: t.String() });

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function getExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date;
}

export const customerAuthRoutes = new Elysia({
  prefix: '/customer/auth',
  detail: { tags: ['Customer Auth'] },
})
  // POST /customer/auth/register
  .post(
    '/register',
    async ({ body, cookie, request, status }) => {
      // Check if email already exists
      const [existing] = await db
        .select({ id: customer.id })
        .from(customer)
        .where(eq(customer.email, body.email.toLowerCase()));

      if (existing) {
        return status(409, { message: 'Un compte existe déjà avec cet email' });
      }

      // Hash password
      const passwordHash = await Bun.password.hash(body.password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      // Create customer
      const [created] = await db
        .insert(customer)
        .values({
          email: body.email.toLowerCase(),
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          marketingOptin: body.marketingOptin ?? false,
        })
        .returning();

      // Create session
      const token = generateToken();
      const expiresAt = getExpiresAt();
      const ipAddress =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await db.insert(customerSession).values({
        token,
        customer: created.id,
        ipAddress,
        userAgent,
        expiresAt,
      });

      // Update lastLogin
      await db.update(customer).set({ lastLogin: new Date() }).where(eq(customer.id, created.id));

      // Send welcome email
      await sendWelcomeEmail({
        customerEmail: created.email,
        customerName: created.firstName,
      });

      // Set cookie
      cookie[COOKIE_NAME].set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      });

      return {
        customer: {
          id: created.id,
          email: created.email,
          firstName: created.firstName,
          lastName: created.lastName,
          phone: created.phone,
          emailVerified: created.emailVerified,
          marketingOptin: created.marketingOptin,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        firstName: t.String({ minLength: 1, maxLength: 100 }),
        lastName: t.String({ minLength: 1, maxLength: 100 }),
        phone: t.Optional(t.String({ maxLength: 20 })),
        marketingOptin: t.Optional(t.Boolean()),
      }),
      cookie: cookieSchema,
      response: {
        200: registerResponseSchema,
        409: errorSchema,
      },
    },
  )

  // POST /customer/auth/login
  .post(
    '/login',
    async ({ body, cookie, request, status }) => {
      const [found] = await db
        .select({
          id: customer.id,
          email: customer.email,
          passwordHash: customer.passwordHash,
          firstName: customer.firstName,
          lastName: customer.lastName,
        })
        .from(customer)
        .where(eq(customer.email, body.email.toLowerCase()));

      if (!found) {
        return status(401, { message: 'Email ou mot de passe incorrect' });
      }

      const validPassword = await Bun.password.verify(body.password, found.passwordHash);

      if (!validPassword) {
        return status(401, { message: 'Email ou mot de passe incorrect' });
      }

      // Create session
      const token = generateToken();
      const expiresAt = getExpiresAt();
      const ipAddress =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await db.insert(customerSession).values({
        token,
        customer: found.id,
        ipAddress,
        userAgent,
        expiresAt,
      });

      // Update lastLogin
      await db.update(customer).set({ lastLogin: new Date() }).where(eq(customer.id, found.id));

      // Set cookie
      cookie[COOKIE_NAME].set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      });

      return {
        customer: {
          id: found.id,
          email: found.email,
          firstName: found.firstName,
          lastName: found.lastName,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      cookie: cookieSchema,
      response: {
        200: loginResponseSchema,
        401: errorSchema,
      },
    },
  )

  // POST /customer/auth/logout
  .post(
    '/logout',
    async ({ cookie }) => {
      const token = cookie[COOKIE_NAME].value;

      if (token) {
        await db.delete(customerSession).where(eq(customerSession.token, token));
      }

      cookie[COOKIE_NAME].remove();

      return { success: true };
    },
    {
      cookie: cookieSchema,
      response: { 200: successSchema },
    },
  )

  // GET /customer/auth/me
  .get(
    '/me',
    async ({ cookie, status }) => {
      const token = cookie[COOKIE_NAME].value;

      if (!token) {
        return status(401, { message: 'Non authentifié' });
      }

      const [sessionData] = await db
        .select({
          session: {
            id: customerSession.id,
            expiresAt: customerSession.expiresAt,
          },
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            emailVerified: customer.emailVerified,
            marketingOptin: customer.marketingOptin,
          },
        })
        .from(customerSession)
        .innerJoin(customer, eq(customerSession.customer, customer.id))
        .where(and(eq(customerSession.token, token), gt(customerSession.expiresAt, new Date())));

      if (!sessionData) {
        cookie[COOKIE_NAME].remove();
        return status(401, { message: 'Session invalide ou expirée' });
      }

      return {
        customer: sessionData.customer,
      };
    },
    {
      cookie: cookieSchema,
      response: {
        200: meResponseSchema,
        401: errorSchema,
      },
    },
  );
