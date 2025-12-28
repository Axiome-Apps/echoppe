import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez-nous pour toute question ou demande d'information",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
