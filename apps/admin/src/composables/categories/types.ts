import { api } from '@/lib/api';

// Types inférés depuis Eden (response paginée)
type CategoriesResponse = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>;
export type Category = CategoriesResponse['data'][number];

// Type dérivé pour l'arbre de catégories (UI)
export interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

// État du drag & drop
export interface DragState {
  draggedId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'inside' | 'after' | null;
}

// Payload pour le batch update
export interface CategoryOrderUpdate {
  id: string;
  parent: string | null;
  sortOrder: number;
}

// Données du formulaire (slug généré côté API)
export interface CategoryFormData {
  name: string;
  description: string;
  parent: string | null;
  image: string | null;
  sortOrder: number;
  isVisible: boolean;
}
