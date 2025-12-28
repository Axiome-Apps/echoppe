"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import Button from "@/components/atoms/Button";

export default function ConfirmationPage() {
  const { refresh } = useCart();

  // Refresh cart to clear it after successful payment
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg
            className="h-10 w-10 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Commande confirmée !
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Merci pour votre commande. Vous recevrez un email de confirmation avec
          les détails de votre commande.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/compte/commandes" className="block">
            <Button className="w-full">Voir mes commandes</Button>
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
