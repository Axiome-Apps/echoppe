import type { Metadata } from "next";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description: "Conditions générales de vente de notre boutique en ligne",
};

export default async function CGVPage() {
  const { data: company } = await api.company.get();

  const companyName = company?.legalName || company?.shopName || "le vendeur";
  const siteName = company?.shopName || "le site";
  const email = company?.publicEmail || "Non renseigné";

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Conditions Générales de Vente</h1>

        <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 1 - Objet
            </h2>
            <p>
              Les présentes conditions générales de vente régissent les ventes de
              produits effectuées sur le site {siteName} et définissent les
              droits et obligations des parties dans le cadre de la vente en
              ligne de produits proposés par {companyName}.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 2 - Prix
            </h2>
            <p>
              Les prix de nos produits sont indiqués en euros toutes taxes
              comprises (TVA française applicable), hors frais de livraison. Le
              montant des frais de livraison est indiqué avant la validation
              finale de la commande.
            </p>
            <p className="mt-4">
              {companyName} se réserve le droit de modifier ses prix à tout
              moment. Les produits seront facturés sur la base des tarifs en
              vigueur au moment de la validation de la commande.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 3 - Commande
            </h2>
            <p>
              Toute commande passée sur le site constitue la formation d'un
              contrat conclu à distance entre le client et {companyName}.
            </p>
            <p className="mt-4">
              La validation de la commande par le client vaut acceptation des
              présentes conditions générales de vente. Une confirmation de
              commande sera envoyée par email récapitulant les détails de
              l'achat.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 4 - Paiement
            </h2>
            <p>
              Le paiement s'effectue en ligne par carte bancaire ou tout autre
              moyen de paiement proposé sur le site. Le paiement est sécurisé par
              notre prestataire de paiement.
            </p>
            <p className="mt-4">
              La commande est validée après confirmation du paiement. En cas de
              refus de paiement, la commande sera automatiquement annulée.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 5 - Livraison
            </h2>
            <p>
              Les produits sont livrés à l'adresse de livraison indiquée lors de
              la commande. Les délais de livraison sont donnés à titre indicatif
              et peuvent varier selon le transporteur choisi.
            </p>
            <p className="mt-4">
              En cas de retard de livraison, le client peut contacter notre
              service client pour obtenir des informations sur le suivi de sa
              commande.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 6 - Droit de rétractation
            </h2>
            <p>
              Conformément à l'article L221-18 du Code de la consommation, le
              client dispose d'un délai de 14 jours à compter de la réception du
              produit pour exercer son droit de rétractation sans avoir à
              justifier de motifs ni à payer de pénalités.
            </p>
            <p className="mt-4">
              Pour exercer ce droit, le client doit notifier sa décision par
              email à {email} ou par courrier. Les produits doivent être
              retournés dans leur état d'origine et complets. Les frais de retour
              sont à la charge du client.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 7 - Garanties
            </h2>
            <p>
              Tous nos produits bénéficient de la garantie légale de conformité
              (articles L217-4 et suivants du Code de la consommation) et de la
              garantie contre les vices cachés (articles 1641 et suivants du Code
              civil).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 8 - Réclamations
            </h2>
            <p>
              Pour toute réclamation, le client peut contacter notre service
              client par email à {email} ou via le formulaire de contact
              disponible sur le site.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 9 - Médiation
            </h2>
            <p>
              En cas de litige, le client peut recourir gratuitement au service
              de médiation de la consommation. Les coordonnées du médiateur sont
              disponibles sur demande auprès de notre service client.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
              Article 10 - Droit applicable
            </h2>
            <p>
              Les présentes conditions générales de vente sont soumises au droit
              français. En cas de litige, les tribunaux français seront seuls
              compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
