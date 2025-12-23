<script setup lang="ts">
import { onMounted } from 'vue';
import ProductMediaGallery from '@/components/organisms/ProductMediaGallery.vue';
import VariantModal from '@/components/organisms/VariantModal.vue';
import ProductHeader from '@/components/organisms/product/ProductHeader.vue';
import ProductInfoCard from '@/components/organisms/product/ProductInfoCard.vue';
import ProductVariantsCard from '@/components/organisms/product/ProductVariantsCard.vue';
import ProductSidebar from '@/components/organisms/product/ProductSidebar.vue';
import { useProductData, useProductForm, useProductVariants } from '@/composables/product';

// Composables
const productData = useProductData();
const productForm = useProductForm();

const productVariants = useProductVariants({
  productId: productForm.productId,
  variants: productForm.variants,
  options: productForm.options,
  variantThumbnails: productForm.variantThumbnails,
  onReload: productForm.loadProduct,
});

// Handle media changes
async function handleMediaChange() {
  await productForm.loadProductMedia();
}

// Initialize
onMounted(async () => {
  productForm.loading.value = true;
  await productData.loadAll();

  if (!productForm.isNew.value) {
    await productForm.loadProduct();
  } else {
    productForm.initNewProduct(productData.getDefaultCategory(), productData.getDefaultTaxRate());
  }

  productForm.loading.value = false;
});
</script>

<template>
  <div>
    <ProductHeader
      :title="productForm.form.value.name"
      :is-new="productForm.isNew.value"
      :saving="productForm.saving.value"
      :has-changes="productForm.hasChanges.value"
      @back="productForm.goBack"
      @save="productForm.save"
    />

    <div
      v-if="productForm.loading.value"
      class="text-gray-500"
    >
      Chargement...
    </div>

    <!-- Main layout: 2 columns -->
    <div
      v-else
      class="flex gap-6"
    >
      <!-- Left: Main content -->
      <div class="flex-1 min-w-0 space-y-6">
        <ProductInfoCard
          v-model:name="productForm.form.value.name"
          v-model:description="productForm.form.value.description"
        />

        <!-- Media section (only for existing products) -->
        <div
          v-if="!productForm.isNew.value"
          class="bg-white rounded-lg shadow p-6"
        >
          <ProductMediaGallery
            v-if="productForm.productId.value"
            :product-id="productForm.productId.value"
            :variants="productForm.variants.value"
            :product-media="productForm.productMedia.value"
            :media-cache="productForm.mediaCache.value"
            @media-change="handleMediaChange"
          />
        </div>

        <!-- Variants section (only for existing products) -->
        <ProductVariantsCard
          v-if="!productForm.isNew.value"
          :variants="productVariants.variantsData.value"
          :columns="productVariants.variantColumns.value"
          :row-id="productVariants.getVariantRowId"
          :on-reorder="productVariants.handleVariantReorder"
          @add="productVariants.handleAddVariant"
        />
      </div>

      <!-- Right: Sidebar -->
      <ProductSidebar
        v-model:status="productForm.form.value.status"
        v-model:category="productForm.form.value.category"
        v-model:collection="productForm.form.value.collection"
        v-model:tax-rate="productForm.form.value.taxRate"
        :is-new="productForm.isNew.value"
        :slug="productForm.form.value.slug"
        :date-created="productForm.dateCreated.value"
        :date-updated="productForm.dateUpdated.value"
        :category-options="productData.categoryOptions.value"
        :collection-options="productData.collectionOptions.value"
        :tax-rate-options="productData.taxRateOptions.value"
        :status-options="productData.statusOptions"
      />
    </div>

    <!-- Variant Modal -->
    <VariantModal
      v-if="productVariants.showVariantModal.value && productForm.productId.value"
      :product-id="productForm.productId.value"
      :variant="productVariants.editingVariant.value"
      :options="productForm.options.value"
      :product-media="productForm.productMedia.value"
      :media-cache="productForm.mediaCache.value"
      :on-close="productVariants.closeVariantModal"
      :on-saved="productVariants.onVariantSaved"
      :on-options-change="productVariants.updateOptions"
    />
  </div>
</template>
