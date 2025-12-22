import { api } from '@/lib/api';

// Types inférés depuis Eden
export type Role = NonNullable<Awaited<ReturnType<typeof api.roles.get>>['data']>[number];

export type Permission = {
  id: string;
  role: string;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selfOnly: boolean;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

// Données du formulaire
export interface RoleFormData {
  name: string;
  description: string | null;
  scope: 'admin' | 'store';
}

export interface PermissionFormData {
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selfOnly: boolean;
}

// Groupes de ressources pour l'UI
export interface ResourceGroup {
  name: string;
  resources: string[];
}

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    name: 'Catalogue',
    resources: ['product', 'category', 'collection', 'variant', 'option', 'tax_rate'],
  },
  {
    name: 'Medias',
    resources: ['media', 'folder'],
  },
  {
    name: 'Commerce',
    resources: ['order', 'cart', 'wishlist', 'invoice'],
  },
  {
    name: 'Clients',
    resources: ['customer', 'address'],
  },
  {
    name: 'Administration',
    resources: ['user', 'role', 'permission', 'company', 'stock', 'shipping_provider', 'payment_config', 'audit_log'],
  },
  {
    name: 'Referentiel',
    resources: ['country'],
  },
];

// Labels français pour les ressources
export const RESOURCE_LABELS: Record<string, string> = {
  product: 'Produits',
  category: 'Categories',
  collection: 'Collections',
  variant: 'Variantes',
  option: 'Options',
  tax_rate: 'Taux de TVA',
  media: 'Medias',
  folder: 'Dossiers',
  order: 'Commandes',
  cart: 'Paniers',
  wishlist: 'Listes de souhaits',
  invoice: 'Factures',
  customer: 'Clients',
  address: 'Adresses',
  user: 'Utilisateurs',
  role: 'Roles',
  permission: 'Permissions',
  company: 'Entreprise',
  stock: 'Stock',
  shipping_provider: 'Transporteurs',
  payment_config: 'Paiements',
  audit_log: "Journal d'audit",
  country: 'Pays',
};
