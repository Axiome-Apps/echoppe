import { api } from '@/lib/api';

// Types inférés depuis Eden (extrait le tableau, exclut les erreurs)
type FoldersResponse = NonNullable<Awaited<ReturnType<typeof api.media.folders.get>>['data']>;
type MediaResponse = NonNullable<Awaited<ReturnType<typeof api.media.get>>['data']>;

export type Folder = Extract<FoldersResponse, unknown[]>[number];
// MediaResponse est maintenant paginée: { data: Media[], meta: {...} }
export type Media = MediaResponse['data'][number];

// Type dérivé pour l'arbre de dossiers (UI)
export interface FolderNode extends Folder {
  children: FolderNode[];
  level: number;
}

export interface ContextMenuState {
  x: number;
  y: number;
  item: Media | null;
}

export type ViewMode = 'grid' | 'list';
export type GridSize = 'small' | 'medium' | 'large';
export type SortBy = 'date' | 'name' | 'size';
export type SortOrder = 'desc' | 'asc';
