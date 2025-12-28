import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import ProductGrid from "@/components/organisms/ProductGrid";
import Breadcrumb from "@/components/molecules/Breadcrumb";

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  // Fetch collection by slug
  const { data: collection, error: collectionError } = await api.collections[
    "by-slug"
  ]({ slug }).get();

  if (collectionError || !collection) {
    notFound();
  }

  // Fetch products in this collection
  const { data: productsData } = await api.collections({ id: collection.id })
    .products.get();

  const products = (productsData?.data ?? []).filter(
    (product) => product.status === "published"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Collections", href: "/collections" },
          { label: collection.name },
        ]}
      />

      {/* Collection Header */}
      <div className="mb-8">
        {collection.image && (
          <div className="relative mb-6 h-48 overflow-hidden rounded-lg sm:h-64">
            <Image
              src={getAssetUrl(collection.image)}
              alt={collection.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl font-bold text-white">
                {collection.name}
              </h1>
            </div>
          </div>
        )}

        {!collection.image && (
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {collection.name}
          </h1>
        )}

        {collection.description && (
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {collection.description}
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
        emptyMessage="Aucun produit dans cette collection"
      />
    </div>
  );
}
