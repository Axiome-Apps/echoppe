import type { Metadata } from "next";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales et informations sur l'éditeur du site",
};

export default async function MentionsLegalesPage() {
  const { data: company } = await api.company.get();

  const legalFormLabels: Record<string, string> = {
    EI: "Entreprise Individuelle",
    AE: "Auto-Entrepreneur",
    EURL: "EURL",
    SARL: "SARL",
    SASU: "SASU",
    SAS: "SAS",
    SA: "SA",
    SCI: "SCI",
  };

  const formatCapital = (capital: string | null) => {
    if (!capital) return null;
    const num = parseFloat(capital);
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Mentions légales</h1>

        <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Éditeur du site
            </h2>
            {company ? (
              <p>
                Le présent site est édité par :<br />
                <strong>{company.legalName}</strong>
                <br />
                {company.legalForm && (
                  <>
                    {legalFormLabels[company.legalForm] || company.legalForm}
                    {company.shareCapital && (
                      <> au capital de {formatCapital(company.shareCapital)}</>
                    )}
                    <br />
                  </>
                )}
                Siège social : {company.street}
                {company.street2 && `, ${company.street2}`}, {company.postalCode}{" "}
                {company.city}
                <br />
                {company.rcsCity && (
                  <>
                    RCS {company.rcsCity}
                    <br />
                  </>
                )}
                {company.siret && (
                  <>
                    SIRET : {company.siret}
                    <br />
                  </>
                )}
                {company.tvaIntra && (
                  <>N° TVA intracommunautaire : {company.tvaIntra}</>
                )}
              </p>
            ) : (
              <p className="italic text-zinc-500">
                Informations non renseignées
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Directeur de la publication
            </h2>
            {company?.publisherName ? (
              <p>
                {company.publisherName}
                <br />
                Email : {company.publicEmail}
                {company.publicPhone && (
                  <>
                    <br />
                    Téléphone : {company.publicPhone}
                  </>
                )}
              </p>
            ) : (
              <p>
                Email : {company?.publicEmail || "Non renseigné"}
                {company?.publicPhone && (
                  <>
                    <br />
                    Téléphone : {company.publicPhone}
                  </>
                )}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Hébergement
            </h2>
            {company?.hostingProvider ? (
              <p>
                Ce site est hébergé par :<br />
                <strong>{company.hostingProvider}</strong>
                {company.hostingAddress && (
                  <>
                    <br />
                    {company.hostingAddress}
                  </>
                )}
                {company.hostingPhone && (
                  <>
                    <br />
                    {company.hostingPhone}
                  </>
                )}
              </p>
            ) : (
              <p className="italic text-zinc-500">
                Informations non renseignées
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Propriété intellectuelle
            </h2>
            <p>
              L'ensemble de ce site relève de la législation française et
              internationale sur le droit d'auteur et la propriété
              intellectuelle. Tous les droits de reproduction sont réservés, y
              compris pour les documents téléchargeables et les représentations
              iconographiques et photographiques.
            </p>
            <p className="mt-4">
              La reproduction de tout ou partie de ce site sur un support
              électronique quel qu'il soit est formellement interdite sauf
              autorisation expresse du directeur de la publication.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Protection des données personnelles
            </h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données
              (RGPD) et à la loi Informatique et Libertés, vous disposez d'un
              droit d'accès, de rectification, de suppression et d'opposition
              aux données personnelles vous concernant.
            </p>
            <p className="mt-4">
              Pour exercer ce droit, vous pouvez nous contacter par email à
              l'adresse : {company?.publicEmail || "Non renseigné"}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Cookies
            </h2>
            <p>
              Ce site utilise des cookies pour améliorer l'expérience
              utilisateur. En naviguant sur ce site, vous acceptez l'utilisation
              de cookies conformément à notre politique de confidentialité.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
