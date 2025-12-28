import { Suspense } from "react";
import { api } from "@/lib/api";
import ProductGrid from "@/components/organisms/ProductGrid";
import ProductFilters from "@/components/organisms/ProductFilters";
import SearchInput from "@/components/molecules/SearchInput";
import SortSelect from "@/components/molecules/SortSelect";

export const revalidate = 60;

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // Fetch products with filters
  const { data, error } = await api.products.get({
    query: {
      search: params.search,
      category: params.category,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      inStock: params.inStock === "true" ? true : undefined,
      sort: params.sort as "price" | "name" | "date" | undefined,
      order: params.order as "asc" | "desc" | undefined,
      page: params.page ? Number(params.page) : undefined,
      limit: 20,
    },
  });

  // Fetch categories for filter
  const { data: categoriesData } = await api.categories.get();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">
            Erreur lors du chargement des produits
          </p>
        </div>
      </div>
    );
  }

  const products = (data?.data ?? []).filter(
    (product) => product.status === "published"
  );

  const categories = (categoriesData ?? []).filter((cat) => cat.isVisible);
  const totalProducts = data?.meta?.total ?? 0;
  const currentPage = data?.meta?.page ?? 1;
  const totalPages = data?.meta?.totalPages ?? 1;

  const hasActiveFilters =
    params.search || params.category || params.minPrice || params.maxPrice || params.inStock;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Nos produits
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Découvrez notre sélection de produits artisanaux
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="sticky top-24 space-y-6">
            <Suspense fallback={null}>
              <SearchInput placeholder="Rechercher un produit..." />
            </Suspense>

            <div className="hidden lg:block">
              <Suspense fallback={null}>
                <ProductFilters categories={categories} />
              </Suspense>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Mobile filters toggle + Sort */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {totalProducts} produit{totalProducts > 1 ? "s" : ""}
                {hasActiveFilters && " (filtré)"}
              </span>
            </div>

            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {/* Mobile filters */}
          <details className="mb-6 lg:hidden">
            <summary className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
              Filtres
            </summary>
            <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <Suspense fallback={null}>
                <ProductFilters categories={categories} />
              </Suspense>
            </div>
          </details>

          <ProductGrid
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              slug: product.slug,
              status: product.status,
              featuredImage: product.featuredImage,
              defaultVariant: product.defaultVariant,
            }))}
            emptyMessage={
              hasActiveFilters
                ? "Aucun produit ne correspond à vos critères"
                : "Aucun produit disponible pour le moment"
            }
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") {
        params.set(key, value);
      }
    });
    params.set("page", String(page));
    return `/produits?${params.toString()}`;
  };

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <a
          href={createPageUrl(currentPage - 1)}
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Précédent
        </a>
      )}

      {start > 1 && (
        <>
          <a
            href={createPageUrl(1)}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            1
          </a>
          {start > 2 && (
            <span className="px-2 text-zinc-400">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <a
          key={page}
          href={createPageUrl(page)}
          className={
            page === currentPage
              ? "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
              : "rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }
        >
          {page}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-2 text-zinc-400">...</span>
          )}
          <a
            href={createPageUrl(totalPages)}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {totalPages}
          </a>
        </>
      )}

      {currentPage < totalPages && (
        <a
          href={createPageUrl(currentPage + 1)}
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Suivant
        </a>
      )}
    </nav>
  );
}
