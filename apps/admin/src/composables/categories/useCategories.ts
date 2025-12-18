import { ref, computed } from 'vue';
import { api } from '@/lib/api';
import type { Category, CategoryNode, DragState, CategoryOrderUpdate, CategoryFormData } from './types';

export function useCategories() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const categories = ref<Category[]>([]);
  const loading = ref(true);
  const dragState = ref<DragState>({
    draggedId: null,
    dropTargetId: null,
    dropPosition: null,
  });

  // ---------------------------------------------------------------------------
  // COMPUTED - TREE
  // ---------------------------------------------------------------------------
  const categoryTree = computed((): CategoryNode[] => {
    const buildTree = (parentId: string | null, level: number): CategoryNode[] => {
      return categories.value
        .filter(c => c.parent === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(c => ({ ...c, level, children: buildTree(c.id, level + 1) }));
    };
    return buildTree(null, 0);
  });

  const flatCategoryList = computed((): CategoryNode[] => {
    const result: CategoryNode[] = [];
    const flatten = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        result.push(node);
        flatten(node.children);
      }
    };
    flatten(categoryTree.value);
    return result;
  });

  // ---------------------------------------------------------------------------
  // UTILS - CYCLE PREVENTION
  // ---------------------------------------------------------------------------
  function getDescendants(categoryId: string): Set<string> {
    const descendants = new Set<string>();
    function collect(id: string) {
      descendants.add(id);
      categories.value.filter(c => c.parent === id).forEach(c => collect(c.id));
    }
    collect(categoryId);
    return descendants;
  }

  function getValidParentOptions(categoryId: string): CategoryNode[] {
    const descendants = getDescendants(categoryId);
    return flatCategoryList.value.filter(c => !descendants.has(c.id));
  }

  function isValidDrop(draggedId: string, targetId: string): boolean {
    if (draggedId === targetId) return false;
    const descendants = getDescendants(draggedId);
    return !descendants.has(targetId);
  }

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------
  async function loadCategories() {
    loading.value = true;
    const { data } = await api.categories.get();
    if (data) categories.value = data;
    loading.value = false;
  }

  async function createCategory(formData: CategoryFormData) {
    await api.categories.post({
      name: formData.name,
      description: formData.description || undefined,
      parent: formData.parent || undefined,
      image: formData.image || undefined,
      sortOrder: formData.sortOrder,
      isVisible: formData.isVisible,
    });
    await loadCategories();
  }

  async function updateCategory(id: string, formData: CategoryFormData) {
    await api.categories({ id }).put({
      name: formData.name,
      description: formData.description || undefined,
      parent: formData.parent || undefined,
      image: formData.image || undefined,
      sortOrder: formData.sortOrder,
      isVisible: formData.isVisible,
    });
    await loadCategories();
  }

  async function deleteCategory(id: string) {
    await api.categories({ id }).delete();
    await loadCategories();
  }

  async function batchUpdateOrder(updates: CategoryOrderUpdate[]) {
    await api.categories.batch.order.patch(updates);
    await loadCategories();
  }

  // ---------------------------------------------------------------------------
  // DRAG & DROP - ORDER CALCULATION
  // ---------------------------------------------------------------------------
  function calculateNewOrder(
    draggedId: string,
    targetId: string,
    position: 'before' | 'inside' | 'after'
  ): CategoryOrderUpdate[] {
    const dragged = categories.value.find(c => c.id === draggedId);
    const target = categories.value.find(c => c.id === targetId);
    if (!dragged || !target) return [];

    const updates: CategoryOrderUpdate[] = [];

    if (position === 'inside') {
      // Devient enfant de target (à la fin)
      const siblings = categories.value
        .filter(c => c.parent === targetId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const maxOrder = siblings.length > 0 ? siblings[siblings.length - 1].sortOrder + 1 : 0;
      updates.push({ id: draggedId, parent: targetId, sortOrder: maxOrder });
    } else {
      // Réordonnancement parmi les siblings du même parent
      const newParent = target.parent;
      const siblings = categories.value
        .filter(c => c.parent === newParent && c.id !== draggedId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const targetIndex = siblings.findIndex(c => c.id === targetId);
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

      // Insérer dragged à la bonne position
      siblings.splice(insertIndex, 0, dragged);

      // Recalculer tous les sortOrder
      siblings.forEach((sibling, index) => {
        updates.push({
          id: sibling.id,
          parent: newParent,
          sortOrder: index,
        });
      });
    }

    return updates;
  }

  // ---------------------------------------------------------------------------
  // DRAG & DROP - HANDLERS
  // ---------------------------------------------------------------------------
  function handleDragStart(e: DragEvent, categoryId: string) {
    dragState.value.draggedId = categoryId;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', JSON.stringify({ type: 'category', id: categoryId }));

    const category = categories.value.find(c => c.id === categoryId);
    const ghost = document.createElement('div');
    ghost.className = 'bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium shadow-lg';
    ghost.textContent = category?.name || 'Catégorie';
    ghost.style.cssText = 'position:absolute;top:-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer!.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function handleDragEnd() {
    dragState.value = { draggedId: null, dropTargetId: null, dropPosition: null };
  }

  function handleDragOver(e: DragEvent, targetId: string, position: 'before' | 'inside' | 'after') {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState.value.draggedId) return;
    if (!isValidDrop(dragState.value.draggedId, targetId)) {
      e.dataTransfer!.dropEffect = 'none';
      return;
    }

    e.dataTransfer!.dropEffect = 'move';
    dragState.value.dropTargetId = targetId;
    dragState.value.dropPosition = position;
  }

  function handleDragLeave(e: DragEvent) {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-category-drop]')) {
      dragState.value.dropTargetId = null;
      dragState.value.dropPosition = null;
    }
  }

  async function handleDrop(e: DragEvent, targetId: string, position: 'before' | 'inside' | 'after') {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = dragState.value.draggedId;
    if (!draggedId || !isValidDrop(draggedId, targetId)) {
      handleDragEnd();
      return;
    }

    const updates = calculateNewOrder(draggedId, targetId, position);
    if (updates.length > 0) {
      await batchUpdateOrder(updates);
    }
    handleDragEnd();
  }

  // Drop à la racine (déplacer en tant que catégorie de premier niveau)
  async function handleRootDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = dragState.value.draggedId;
    if (!draggedId) {
      handleDragEnd();
      return;
    }

    // Mettre à la racine, à la fin
    const rootCategories = categories.value
      .filter(c => c.parent === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const maxOrder = rootCategories.length > 0 ? rootCategories[rootCategories.length - 1].sortOrder + 1 : 0;

    await batchUpdateOrder([{ id: draggedId, parent: null, sortOrder: maxOrder }]);
    handleDragEnd();
  }

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    // State
    categories,
    loading,
    dragState,

    // Computed
    categoryTree,
    flatCategoryList,

    // Utils
    getDescendants,
    getValidParentOptions,
    isValidDrop,

    // API
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    batchUpdateOrder,

    // Drag & Drop
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRootDrop,
  };
}
