import { api } from "@/lib/api";
import ContactForm from "@/components/organisms/ContactForm";

export default async function ContactPage() {
  const { data: company } = await api.company.get();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-3xl font-bold">Contactez-nous</h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Une question, une suggestion ou besoin d'aide ? N'hésitez pas à nous
          contacter.
        </p>

        <ContactForm />

        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">Autres moyens de contact</h2>
          <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-900 dark:text-white">Email :</strong>{" "}
              {company?.publicEmail || "Non renseigné"}
            </p>
            {company?.publicPhone && (
              <p>
                <strong className="text-zinc-900 dark:text-white">
                  Téléphone :
                </strong>{" "}
                {company.publicPhone}
              </p>
            )}
            {company && (
              <p>
                <strong className="text-zinc-900 dark:text-white">
                  Adresse :
                </strong>{" "}
                {company.street}
                {company.street2 && `, ${company.street2}`}, {company.postalCode}{" "}
                {company.city}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
