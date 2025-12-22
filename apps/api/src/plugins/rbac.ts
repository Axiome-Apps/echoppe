import { Elysia } from 'elysia';
import { db, permission, role, eq } from '@echoppe/core';
import type { Resource, Action } from '@echoppe/core';
import {
  getSessionFromToken,
  COOKIE_NAME,
  type SessionUser,
  type SessionRole,
} from './auth';
import {
  getCustomerSessionFromToken,
  CUSTOMER_COOKIE_NAME,
  type SessionCustomer,
} from './customerAuth';

// Types pour les permissions
export type PermissionSet = {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selfOnly: boolean;
};

// Types pour les contextes d'authentification
export type AuthenticatedAdmin = {
  type: 'admin';
  user: SessionUser;
  role: SessionRole;
  permissions: Map<string, PermissionSet>;
};

export type AuthenticatedCustomer = {
  type: 'customer';
  customer: SessionCustomer;
  permissions: Map<string, PermissionSet>;
};

export type PublicAccess = {
  type: 'public';
  permissions: Map<string, PermissionSet>;
};

export type RbacAuthContext = AuthenticatedAdmin | AuthenticatedCustomer | PublicAccess;

// Cache des permissions par rôle (en mémoire)
const permissionCache = new Map<string, Map<string, PermissionSet>>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache pour les rôles système (Customer, Public)
let customerRoleId: string | null = null;
let publicRoleId: string | null = null;

async function getPermissionsForRole(roleId: string): Promise<Map<string, PermissionSet>> {
  const now = Date.now();
  const cached = permissionCache.get(roleId);
  const timestamp = cacheTimestamps.get(roleId);

  if (cached && timestamp && now - timestamp < CACHE_TTL) {
    return cached;
  }

  const perms = await db.select().from(permission).where(eq(permission.role, roleId));

  const permMap = new Map<string, PermissionSet>();
  for (const p of perms) {
    permMap.set(p.resource, {
      canCreate: p.canCreate,
      canRead: p.canRead,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete,
      selfOnly: p.selfOnly,
    });
  }

  permissionCache.set(roleId, permMap);
  cacheTimestamps.set(roleId, now);

  return permMap;
}

async function getCustomerRoleId(): Promise<string | null> {
  if (customerRoleId) return customerRoleId;

  const [customerRole] = await db.select().from(role).where(eq(role.name, 'Client'));
  customerRoleId = customerRole?.id ?? null;
  return customerRoleId;
}

async function getPublicRoleId(): Promise<string | null> {
  if (publicRoleId) return publicRoleId;

  const [pubRole] = await db.select().from(role).where(eq(role.name, 'Public'));
  publicRoleId = pubRole?.id ?? null;
  return publicRoleId;
}

async function getCustomerPermissions(): Promise<Map<string, PermissionSet>> {
  const roleId = await getCustomerRoleId();
  if (!roleId) return new Map();
  return getPermissionsForRole(roleId);
}

async function getPublicPermissions(): Promise<Map<string, PermissionSet>> {
  const roleId = await getPublicRoleId();
  if (!roleId) return new Map();
  return getPermissionsForRole(roleId);
}

// Fonction utilitaire pour vérifier une permission
export function hasPermission(
  permissions: Map<string, PermissionSet>,
  resource: Resource,
  action: Action,
): boolean {
  const perm = permissions.get(resource);
  if (!perm) return false;

  switch (action) {
    case 'create':
      return perm.canCreate;
    case 'read':
      return perm.canRead;
    case 'update':
      return perm.canUpdate;
    case 'delete':
      return perm.canDelete;
  }
}

export function isSelfOnly(permissions: Map<string, PermissionSet>, resource: Resource): boolean {
  const perm = permissions.get(resource);
  return perm?.selfOnly ?? false;
}

/**
 * Invalide le cache des permissions
 * Appeler après modification des permissions d'un rôle
 */
export function invalidatePermissionCache(roleId?: string) {
  if (roleId) {
    permissionCache.delete(roleId);
    cacheTimestamps.delete(roleId);
  } else {
    permissionCache.clear();
    cacheTimestamps.clear();
  }
}

/**
 * Invalide le cache des rôles système (Customer, Public)
 * Appeler si ces rôles sont recréés
 */
export function invalidateSystemRoleCache() {
  customerRoleId = null;
  publicRoleId = null;
}

/**
 * Obtient le contexte d'authentification depuis les cookies
 */
export async function getAuthContext(
  cookie: Record<string, { value?: string }>,
): Promise<RbacAuthContext> {
  // 1. Essayer l'auth admin
  const adminToken = cookie[COOKIE_NAME]?.value;
  if (adminToken) {
    const session = await getSessionFromToken(adminToken);
    if (session.isAuthenticated && session.currentUser && session.currentRole) {
      const permissions = await getPermissionsForRole(session.currentRole.id);
      return {
        type: 'admin',
        user: session.currentUser,
        role: session.currentRole,
        permissions,
      };
    }
  }

  // 2. Essayer l'auth customer
  const customerToken = cookie[CUSTOMER_COOKIE_NAME]?.value;
  if (customerToken) {
    const session = await getCustomerSessionFromToken(customerToken);
    if (session.isAuthenticated && session.currentCustomer) {
      const permissions = await getCustomerPermissions();
      return {
        type: 'customer',
        customer: session.currentCustomer,
        permissions,
      };
    }
  }

  // 3. Accès public
  const permissions = await getPublicPermissions();
  return {
    type: 'public',
    permissions,
  };
}

/**
 * Vérifie si le contexte a la permission demandée
 * Owner bypass toutes les vérifications
 */
export function checkPermission(
  authContext: RbacAuthContext,
  resource: Resource,
  action: Action,
): {
  allowed: boolean;
  selfOnly: boolean;
  currentUser: SessionUser | null;
  currentRole: SessionRole | null;
  currentCustomer: SessionCustomer | null;
} {
  // Owner admin bypass all checks
  if (authContext.type === 'admin' && authContext.user.isOwner) {
    return {
      allowed: true,
      selfOnly: false,
      currentUser: authContext.user,
      currentRole: authContext.role,
      currentCustomer: null,
    };
  }

  const allowed = hasPermission(authContext.permissions, resource, action);
  const selfOnly = isSelfOnly(authContext.permissions, resource);

  if (authContext.type === 'admin') {
    return {
      allowed,
      selfOnly,
      currentUser: authContext.user,
      currentRole: authContext.role,
      currentCustomer: null,
    };
  }

  if (authContext.type === 'customer') {
    return {
      allowed,
      selfOnly,
      currentUser: null,
      currentRole: null,
      currentCustomer: authContext.customer,
    };
  }

  // Public access
  return {
    allowed,
    selfOnly: false,
    currentUser: null,
    currentRole: null,
    currentCustomer: null,
  };
}

// Plugin RBAC - dérive le contexte d'auth avec permissions
export const rbacPlugin = new Elysia({ name: 'rbac' }).derive(
  async ({ cookie }): Promise<{ authContext: RbacAuthContext }> => {
    const authContext = await getAuthContext(cookie as Record<string, { value?: string }>);
    return { authContext };
  },
);

/**
 * Crée un guard de permission pour une ressource et action
 * Usage: .use(permissionGuard('product', 'create'))
 */
export function permissionGuard(resource: Resource, action: Action) {
  return new Elysia({ name: `permission-${resource}-${action}` }).macro({
    permission: {
      async resolve({ cookie, status }) {
        const authContext = await getAuthContext(
          cookie as Record<string, { value?: string }>,
        );
        const result = checkPermission(authContext, resource, action);

        if (!result.allowed) {
          return status(403, { message: `Permission refusée: ${action} sur ${resource}` });
        }

        return {
          currentUser: result.currentUser,
          currentRole: result.currentRole,
          currentCustomer: result.currentCustomer,
          selfOnly: result.selfOnly,
          authContext,
        };
      },
    },
  });
}
