"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";

export default function AccountDashboard() {
  const { customer } = useAuth();
  const { cart } = useCart();

  const stats = [
    {
      label: "Articles dans le panier",
      value: cart?.itemCount ?? 0,
      href: "/panier",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Bienvenue, {customer?.firstName} !
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Gérez vos commandes, adresses et informations personnelles depuis
          votre espace client.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/compte/commandes"
          className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white">
              Mes commandes
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Suivez vos commandes en cours
            </p>
          </div>
        </Link>

        <Link
          href="/compte/profil"
          className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white">
              Mon profil
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Modifiez vos informations
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
