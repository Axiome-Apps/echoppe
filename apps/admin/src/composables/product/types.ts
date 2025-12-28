import { api } from '@/lib/api';
import type { ApiItem, ApiPaginatedItem } from '@/types/api';

// Types inférés depuis Eden
// ProductListItem = type avec featuredImage/defaultVariant (pour affichage liste)
export type ProductListItem = ApiPaginatedItem<ReturnType<typeof api.products.get>>;
// Product = type de base (pour édition)
export type Product = Omit<ProductListItem, 'featuredImage' | 'defaultVariant'>;
export type TaxRate = ApiItem<ReturnType<typeof api['tax-rates']['get']>>;
export type Collection = ApiPaginatedItem<ReturnType<typeof api.collections.get>>;

// Type pour un produit avec ses variantes et options (retourné par GET /products/:id)
type ProductDetailResponse = Awaited<ReturnType<ReturnType<typeof api.products>['get']>>;
export type ProductDetail = Extract<NonNullable<ProductDetailResponse['data']>, { variants: unknown[] }>;
export type Variant = ProductDetail['variants'][number];

export type Option = {
  id: string;
  name: string;
  values: { id: string; value: string }[];
};

// Type ProductMedia inféré depuis Eden
export type ProductMedia = NonNullable<
  Awaited<ReturnType<ReturnType<typeof api.products>['media']['get']>>['data']
>[number];

// Form state
export interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  category: string;
  taxRate: string;
  collection: string;
  status: 'draft' | 'published' | 'archived';
}

// Select option type
export interface SelectOption {
  value: string;
  label: string;
}
