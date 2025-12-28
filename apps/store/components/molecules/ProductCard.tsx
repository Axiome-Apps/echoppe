import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAssetUrl } from "@/lib/utils";
import Price from "@/components/atoms/Price";
import Badge from "@/components/atoms/Badge";

interface ProductCardProps {
  product: {
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
  };
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const isOutOfStock =
    product.defaultVariant && product.defaultVariant.quantity <= 0;

  return (
    <Link
      href={`/produits/${product.slug}`}
      className={cn(
        "group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.featuredImage ? (
          <Image
            src={getAssetUrl(product.featuredImage)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isOutOfStock && <Badge variant="danger">Rupture</Badge>}
          {product.defaultVariant?.compareAtPriceHt && (
            <Badge variant="warning">Promo</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-zinc-900 dark:text-white">
          {product.name}
        </h3>

        {product.defaultVariant && (
          <div className="mt-2">
            <Price
              priceHt={product.defaultVariant.priceHt}
              compareAtPriceHt={product.defaultVariant.compareAtPriceHt}
              size="sm"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
