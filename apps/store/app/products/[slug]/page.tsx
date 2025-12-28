import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import Price from "@/components/atoms/Price";
import Badge from "@/components/atoms/Badge";
import AddToCartButton from "@/components/molecules/AddToCartButton";
import ProductOptions from "@/components/molecules/ProductOptions";
import ProductGallery from "@/components/molecules/ProductGallery";
import Breadcrumb from "@/components/molecules/Breadcrumb";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { data, error } = await api.products["by-slug"]({ slug }).get();

  if (error || !data) {
    notFound();
  }

  const product = data;
  const defaultVariant = product.variants?.find((v) => v.isDefault) ?? product.variants?.[0];
  const isOutOfStock = defaultVariant && defaultVariant.quantity <= 0;

  // Fetch category for breadcrumb
  const { data: category } = await api.categories({ id: product.category }).get();

  const breadcrumbItems = [
    { label: "Produits", href: "/produits" },
    ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
    { label: product.name },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <ProductGallery
          images={product.images ?? []}
          productName={product.name}
        />

        {/* Product info */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex gap-2">
            {isOutOfStock && <Badge variant="danger">Rupture de stock</Badge>}
            {defaultVariant?.compareAtPriceHt && <Badge variant="warning">Promo</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {product.name}
          </h1>

          {/* Price */}
          {defaultVariant && (
            <Price
              priceHt={defaultVariant.priceHt}
              compareAtPriceHt={defaultVariant.compareAtPriceHt}
              size="lg"
            />
          )}

          {/* Description */}
          {product.description && (
            <div
              className="prose prose-zinc dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <ProductOptions
              options={product.options}
              variants={product.variants ?? []}
            />
          )}

          {/* Add to cart */}
          {defaultVariant && (
            <AddToCartButton
              variantId={defaultVariant.id}
              disabled={isOutOfStock}
            />
          )}

          {/* Stock info */}
          {defaultVariant && !isOutOfStock && defaultVariant.quantity <= 5 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Plus que {defaultVariant.quantity} en stock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
