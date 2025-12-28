import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'ariane" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            Accueil
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-zinc-400">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-zinc-900 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-900 dark:text-white">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
