import Link from "next/link";
import { api } from "@/lib/api";
import ProductGrid from "@/components/organisms/ProductGrid";
import Button from "@/components/atoms/Button";

export const revalidate = 60;

export default async function Home() {
  const { data } = await api.products.get();

  const featuredProducts = (data?.data ?? [])
    .filter((product) => product.status === "published")
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="bg-zinc-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              Bienvenue sur la boutique
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
              Découvrez notre sélection de produits artisanaux de qualité
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/produits">
                <Button size="lg">Voir les produits</Button>
              </Link>
              <Link href="/categories">
                <Button variant="secondary" size="lg">
                  Catégories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Produits à la une
            </h2>
            <Link
              href="/produits"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Voir tout →
            </Link>
          </div>
          <ProductGrid
            products={featuredProducts.map((product) => ({
              id: product.id,
              name: product.name,
              slug: product.slug,
              status: product.status,
              featuredImage: product.featuredImage,
              defaultVariant: product.defaultVariant,
            }))}
          />
        </section>
      )}
    </div>
  );
}
