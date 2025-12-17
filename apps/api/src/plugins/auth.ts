import { Elysia, t } from 'elysia';
import { db, user, session, role, eq, and, gt } from '@echoppe/core';

export const COOKIE_NAME = 'echoppe_admin_session';

// Schema cookie pour le typage
export const cookieSchema = t.Cookie({
  [COOKIE_NAME]: t.Optional(t.String()),
});

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isOwner: boolean;
  isActive: boolean;
};

export type SessionRole = {
  id: string;
  name: string;
  scope: 'admin' | 'store';
};

export type AuthContext = {
  currentUser: SessionUser | null;
  currentRole: SessionRole | null;
  isAuthenticated: boolean;
};

// Fonction réutilisable pour vérifier la session
export async function getSessionFromToken(token: string | undefined): Promise<AuthContext> {
  if (!token) {
    return { currentUser: null, currentRole: null, isAuthenticated: false };
  }

  const [sessionData] = await db
    .select({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isOwner: user.isOwner,
        isActive: user.isActive,
      },
      role: {
        id: role.id,
        name: role.name,
        scope: role.scope,
      },
    })
    .from(session)
    .innerJoin(user, eq(session.user, user.id))
    .innerJoin(role, eq(user.role, role.id))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())));

  if (!sessionData || !sessionData.user.isActive) {
    return { currentUser: null, currentRole: null, isAuthenticated: false };
  }

  return {
    currentUser: sessionData.user as SessionUser,
    currentRole: sessionData.role as SessionRole,
    isAuthenticated: true,
  };
}

// Plugin singleton avec macro pour l'authentification
// Usage:
//   .use(authPlugin)
//   .get('/public', () => 'public')  // Pas de macro = public
//   .post('/protected', ({ currentUser }) => currentUser, { auth: true })  // auth: true = protégé
export const authPlugin = new Elysia({ name: 'auth' })
  .macro({
    auth: {
      async resolve({ cookie, status }) {
        const token = (cookie as Record<string, { value?: string }>)[COOKIE_NAME]?.value;
        const session = await getSessionFromToken(token);

        if (!session.isAuthenticated) {
          return status(401, { message: 'Non authentifié' });
        }

        return {
          currentUser: session.currentUser,
          currentRole: session.currentRole,
        };
      },
    },
  });
