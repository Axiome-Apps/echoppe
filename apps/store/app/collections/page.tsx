import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";

export const revalidate = 60;

export default async function CollectionsPage() {
  const { data, error } = await api.collections.get();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">
            Erreur lors du chargement des collections
          </p>
        </div>
      </div>
    );
  }

  const collections = (data?.data ?? []).filter((col) => col.isVisible);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Collections
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Découvrez nos collections thématiques
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            Aucune collection disponible
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {collection.image ? (
                  <Image
                    src={getAssetUrl(collection.image)}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl text-zinc-400">
                      {collection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {collection.name}
                </h2>
                {collection.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {collection.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
