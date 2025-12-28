"use client";

import Button from "@/components/atoms/Button";

export default function AddressesPage() {
  // TODO: Fetch addresses from API
  const addresses: Array<{
    id: string;
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Mes adresses
        </h2>
        <Button size="sm">Ajouter une adresse</Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Aucune adresse enregistrée
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Ajoutez une adresse pour accélérer vos prochaines commandes
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {address.isDefault && (
                <span className="mb-2 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Par défaut
                </span>
              )}
              <p className="font-medium text-zinc-900 dark:text-white">
                {address.name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {address.line1}
                {address.line2 && <br />}
                {address.line2}
                <br />
                {address.postalCode} {address.city}
                <br />
                {address.country}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
