import { cn } from "@/lib/utils";

interface PriceProps {
  priceHt: string | number;
  taxRate?: number;
  compareAtPriceHt?: string | number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function formatPrice(price: number, locale = "fr-FR", currency = "EUR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(price);
}

export default function Price({
  priceHt,
  taxRate = 20,
  compareAtPriceHt,
  className,
  size = "md",
}: PriceProps) {
  const ht = typeof priceHt === "string" ? parseFloat(priceHt) : priceHt;
  const ttc = ht * (1 + taxRate / 100);

  const compareHt = compareAtPriceHt
    ? typeof compareAtPriceHt === "string"
      ? parseFloat(compareAtPriceHt)
      : compareAtPriceHt
    : null;
  const compareTtc = compareHt ? compareHt * (1 + taxRate / 100) : null;

  const sizeStyles = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const isOnSale = compareTtc && compareTtc > ttc;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-semibold",
          sizeStyles[size],
          isOnSale && "text-red-600"
        )}
      >
        {formatPrice(ttc)}
      </span>
      {isOnSale && (
        <span className="text-sm text-zinc-500 line-through">
          {formatPrice(compareTtc)}
        </span>
      )}
    </div>
  );
}
