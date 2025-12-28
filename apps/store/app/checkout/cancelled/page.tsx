"use client";

import Link from "next/link";
import Button from "@/components/atoms/Button";

export default function CancelledPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <svg
            className="h-10 w-10 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Paiement annulé
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Votre paiement a été annulé. Aucun montant n&apos;a été débité de
          votre compte. Votre panier a été conservé.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/panier" className="block">
            <Button className="w-full">Retourner au panier</Button>
          </Link>
          <Link href="/produits" className="block">
            <Button variant="secondary" className="w-full">
              Continuer mes achats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
