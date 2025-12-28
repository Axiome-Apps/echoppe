import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import ProductGrid from "@/components/organisms/ProductGrid";
import Breadcrumb from "@/components/molecules/Breadcrumb";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Fetch category by slug
  const { data: category, error: categoryError } = await api.categories[
    "by-slug"
  ]({ slug }).get();

  if (categoryError || !category) {
    notFound();
  }

  // Fetch products in this category
  const { data: productsData } = await api.categories({ id: category.id })
    .products.get();

  const products = (productsData?.data ?? []).filter(
    (product) => product.status === "published"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Catégories", href: "/categories" },
          { label: category.name },
        ]}
      />

      {/* Category Header */}
      <div className="mb-8">
        {category.image && (
          <div className="relative mb-6 h-48 overflow-hidden rounded-lg sm:h-64">
            <Image
              src={getAssetUrl(category.image)}
              alt={category.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            </div>
          </div>
        )}

        {!category.image && (
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {category.name}
          </h1>
        )}

        {category.description && (
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {category.description}
          </p>
        )}
      </div>

      {/* Products */}
      <ProductGrid
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          status: product.status,
          featuredImage: product.featuredImage,
          defaultVariant: product.defaultVariant,
        }))}
        emptyMessage="Aucun produit dans cette catégorie"
      />
    </div>
  );
}
