"use client";

import Link from "next/link";

export default function OrdersPage() {
  // TODO: Fetch orders from API
  const orders: Array<{
    id: string;
    number: string;
    date: string;
    status: string;
    total: string;
  }> = [];

  if (orders.length === 0) {
    return (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Aucune commande
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Vous n&apos;avez pas encore passé de commande
        </p>
        <Link
          href="/produits"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-white"
        >
          Découvrir nos produits →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Mes commandes
      </h2>

      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/compte/commandes/${order.id}`}
            className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">
                Commande #{order.number}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {order.date}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-zinc-900 dark:text-white">
                {order.total}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {order.status}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
