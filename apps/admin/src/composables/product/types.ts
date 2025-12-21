import { api } from '@/lib/api';

// Types inférés depuis Eden
export type Product = NonNullable<Awaited<ReturnType<typeof api.products.get>>['data']>['data'][number];
export type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];
export type TaxRate = NonNullable<Awaited<ReturnType<typeof api['tax-rates']['get']>>['data']>[number];
export type Collection = NonNullable<Awaited<ReturnType<typeof api.collections.get>>['data']>['data'][number];

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
