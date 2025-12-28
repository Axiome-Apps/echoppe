import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold">
              Boutique
            </Link>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Votre boutique en ligne.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold">Boutique</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/produits"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Catégories
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold">Mon compte</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/compte"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link
                  href="/compte/commandes"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Mes commandes
                </Link>
              </li>
              <li>
                <Link
                  href="/panier"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold">Informations</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/cgv"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  CGV
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} Boutique. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
