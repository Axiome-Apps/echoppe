import ProductCard from "@/components/molecules/ProductCard";

interface ProductGridProps {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    featuredImage?: string | null;
    defaultVariant?: {
      priceHt: string;
      compareAtPriceHt?: string | null;
      quantity: number;
    } | null;
  }>;
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  emptyMessage = "Aucun produit trouvé",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
