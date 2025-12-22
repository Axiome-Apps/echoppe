<script setup lang="ts">
import { computed } from 'vue';
import {
  RESOURCE_GROUPS,
  RESOURCE_LABELS,
  type PermissionFormData,
} from '@/composables/roles';

const props = defineProps<{
  permissions: PermissionFormData[];
  readonly?: boolean;
  showSelfOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:permissions', permissions: PermissionFormData[]): void;
}>();

// Transformer en Map pour acces rapide
const permissionMap = computed(() => {
  const map = new Map<string, PermissionFormData>();
  for (const p of props.permissions) {
    map.set(p.resource, p);
  }
  return map;
});

function getPermission(resource: string): PermissionFormData {
  return (
    permissionMap.value.get(resource) || {
      resource,
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
      selfOnly: false,
    }
  );
}

function togglePermission(resource: string, action: keyof PermissionFormData) {
  if (props.readonly) return;
  if (action === 'resource') return;

  const current = getPermission(resource);
  const updated: PermissionFormData = {
    ...current,
    resource,
    [action]: !current[action],
  };

  const newPermissions = props.permissions.filter((p) => p.resource !== resource);

  // N'ajouter que si au moins une permission est true
  if (updated.canCreate || updated.canRead || updated.canUpdate || updated.canDelete) {
    newPermissions.push(updated);
  }

  emit('update:permissions', newPermissions);
}

function toggleAll(resource: string, value: boolean) {
  if (props.readonly) return;

  const newPermissions = props.permissions.filter((p) => p.resource !== resource);

  if (value) {
    newPermissions.push({
      resource,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      selfOnly: getPermission(resource).selfOnly,
    });
  }

  emit('update:permissions', newPermissions);
}

function hasAllPermissions(resource: string): boolean {
  const p = getPermission(resource);
  return p.canCreate && p.canRead && p.canUpdate && p.canDelete;
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="group in RESOURCE_GROUPS"
      :key="group.name"
      class="bg-white rounded-lg shadow p-4"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ group.name }}
      </h3>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-3 text-sm font-medium text-gray-500">
                Ressource
              </th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-16">
                Tout
              </th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-16">
                Creer
              </th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-16">
                Lire
              </th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-16">
                Modifier
              </th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-16">
                Supprimer
              </th>
              <th
                v-if="showSelfOnly"
                class="text-center py-2 px-3 text-sm font-medium text-gray-500 w-20"
              >
                Self only
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="resource in group.resources"
              :key="resource"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-2 px-3 text-sm text-gray-900">
                {{ RESOURCE_LABELS[resource] || resource }}
              </td>
              <td class="py-2 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="hasAllPermissions(resource)"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="toggleAll(resource, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td class="py-2 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="getPermission(resource).canCreate"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="togglePermission(resource, 'canCreate')"
                />
              </td>
              <td class="py-2 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="getPermission(resource).canRead"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="togglePermission(resource, 'canRead')"
                />
              </td>
              <td class="py-2 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="getPermission(resource).canUpdate"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="togglePermission(resource, 'canUpdate')"
                />
              </td>
              <td class="py-2 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="getPermission(resource).canDelete"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="togglePermission(resource, 'canDelete')"
                />
              </td>
              <td
                v-if="showSelfOnly"
                class="py-2 px-3 text-center"
              >
                <input
                  type="checkbox"
                  :checked="getPermission(resource).selfOnly"
                  :disabled="readonly"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  @change="togglePermission(resource, 'selfOnly')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
