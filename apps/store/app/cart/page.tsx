"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/providers/CartProvider";
import { getAssetUrl, formatPrice } from "@/lib/utils";
import Button from "@/components/atoms/Button";
import QuantitySelector from "@/components/atoms/QuantitySelector";

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCart();

  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <svg
            className="mx-auto h-16 w-16 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
            Votre panier est vide
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Découvrez nos produits et ajoutez-les à votre panier
          </p>
          <Link href="/produits" className="mt-6 inline-block">
            <Button size="lg">Voir les produits</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
    } else {
      await updateItem(itemId, quantity);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-white">
        Votre panier
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4">
                {/* Image */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                  {item.variant.product.featuredImage ? (
                    <Image
                      src={getAssetUrl(item.variant.product.featuredImage)}
                      alt={item.variant.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        href={`/produits/${item.variant.product.slug}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-white"
                      >
                        {item.variant.product.name}
                      </Link>
                      {item.variant.sku && (
                        <p className="text-sm text-zinc-500">
                          SKU: {item.variant.sku}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {formatPrice(parseFloat(item.variant.priceHt) * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(qty) => handleQuantityChange(item.id, qty)}
                      min={0}
                      max={99}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clear cart */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => clearCart()}
              disabled={isLoading}
              className="text-sm text-zinc-600 hover:underline disabled:opacity-50 dark:text-zinc-400"
            >
              Vider le panier
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Récapitulatif
            </h2>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Sous-total HT
                </span>
                <span className="text-zinc-900 dark:text-white">
                  {formatPrice(cart.totalHt, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  TVA (20%)
                </span>
                <span className="text-zinc-900 dark:text-white">
                  {formatPrice(parseFloat(cart.totalHt) * 0.2, 0)}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-white">Total TTC</span>
                  <span className="text-zinc-900 dark:text-white">
                    {formatPrice(cart.totalHt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/paiement" className="block">
                <Button className="w-full" size="lg">
                  Commander
                </Button>
              </Link>
              <Link href="/produits" className="block">
                <Button variant="secondary" className="w-full">
                  Continuer les achats
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
