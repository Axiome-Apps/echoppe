"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { api } from "@/lib/api";
import { getAssetUrl, formatPrice } from "@/lib/utils";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

type Step = "address" | "payment" | "review";

interface AddressForm {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  street2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  phone: string;
}

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
}

const emptyAddress: AddressForm = {
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  street2: "",
  postalCode: "",
  city: "",
  countryCode: "FR",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<AddressForm>(emptyAddress);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [customerNote, setCustomerNote] = useState("");
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment providers
  useEffect(() => {
    async function fetchProviders() {
      const { data } = await api.checkout["payment-providers"].get();
      if (data) {
        setPaymentProviders(data);
        if (data.length > 0) {
          setSelectedProvider(data[0].id);
        }
      }
    }
    fetchProviders();
  }, []);

  // Pre-fill customer name if logged in
  useEffect(() => {
    if (customer) {
      setShippingAddress((prev) => ({
        ...prev,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || "",
      }));
    }
  }, [customer]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/connexion?redirect=/paiement");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      router.push("/panier");
    }
  }, [cartLoading, cart, router]);

  if (authLoading || cartLoading || !cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        </div>
      </div>
    );
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("review");
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;

      const { data, error: checkoutError } = await api.checkout.post({
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          company: shippingAddress.company || undefined,
          street: shippingAddress.street,
          street2: shippingAddress.street2 || undefined,
          postalCode: shippingAddress.postalCode,
          city: shippingAddress.city,
          countryCode: shippingAddress.countryCode,
          phone: shippingAddress.phone || undefined,
        },
        billingAddress: useSameAddress
          ? undefined
          : {
              firstName: billingAddress.firstName,
              lastName: billingAddress.lastName,
              company: billingAddress.company || undefined,
              street: billingAddress.street,
              street2: billingAddress.street2 || undefined,
              postalCode: billingAddress.postalCode,
              city: billingAddress.city,
              countryCode: billingAddress.countryCode,
              phone: billingAddress.phone || undefined,
            },
        useSameAddress,
        customerNote: customerNote || undefined,
        paymentProvider: selectedProvider as "stripe" | "paypal",
        successUrl: `${baseUrl}/paiement/confirmation`,
        cancelUrl: `${baseUrl}/paiement/annule`,
      });

      if (checkoutError) {
        const message = "message" in checkoutError ? String(checkoutError.message) : "Erreur lors de la commande";
        setError(message);
        return;
      }

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateShippingField = (field: keyof AddressForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setShippingAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateBillingField = (field: keyof AddressForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBillingAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Calculate totals
  const subtotalHt = parseFloat(cart.totalHt);
  const tva = subtotalHt * 0.2;
  const totalTtc = subtotalHt + tva;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-white">
        Paiement
      </h1>

      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { key: "address", label: "Adresse" },
            { key: "payment", label: "Paiement" },
            { key: "review", label: "Confirmation" },
          ].map((s, idx) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s.key
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : ["address"].indexOf(step) < ["address", "payment", "review"].indexOf(s.key)
                    ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                    : "bg-green-500 text-white"
                }`}
              >
                {["address", "payment", "review"].indexOf(s.key) <
                ["address", "payment", "review"].indexOf(step)
                  ? "✓"
                  : idx + 1}
              </div>
              <span
                className={`hidden text-sm sm:block ${
                  step === s.key
                    ? "font-medium text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {s.label}
              </span>
              {idx < 2 && (
                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700 sm:w-16" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === "address" && (
            <form onSubmit={handleAddressSubmit}>
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">
                  Adresse de livraison
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Prénom"
                    value={shippingAddress.firstName}
                    onChange={updateShippingField("firstName")}
                    required
                  />
                  <Input
                    label="Nom"
                    value={shippingAddress.lastName}
                    onChange={updateShippingField("lastName")}
                    required
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Entreprise (optionnel)"
                    value={shippingAddress.company}
                    onChange={updateShippingField("company")}
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Adresse"
                    value={shippingAddress.street}
                    onChange={updateShippingField("street")}
                    required
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Complément d'adresse (optionnel)"
                    value={shippingAddress.street2}
                    onChange={updateShippingField("street2")}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Code postal"
                    value={shippingAddress.postalCode}
                    onChange={updateShippingField("postalCode")}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Ville"
                      value={shippingAddress.city}
                      onChange={updateShippingField("city")}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Pays
                    </label>
                    <select
                      value={shippingAddress.countryCode}
                      onChange={updateShippingField("countryCode")}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                      required
                    >
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CH">Suisse</option>
                      <option value="LU">Luxembourg</option>
                    </select>
                  </div>
                  <Input
                    label="Téléphone (optionnel)"
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={updateShippingField("phone")}
                  />
                </div>

                {/* Billing address toggle */}
                <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useSameAddress}
                      onChange={(e) => setUseSameAddress(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Utiliser la même adresse pour la facturation
                    </span>
                  </label>
                </div>

                {/* Billing address form */}
                {!useSameAddress && (
                  <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                    <h3 className="mb-4 font-medium text-zinc-900 dark:text-white">
                      Adresse de facturation
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Prénom"
                        value={billingAddress.firstName}
                        onChange={updateBillingField("firstName")}
                        required
                      />
                      <Input
                        label="Nom"
                        value={billingAddress.lastName}
                        onChange={updateBillingField("lastName")}
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        label="Entreprise (optionnel)"
                        value={billingAddress.company}
                        onChange={updateBillingField("company")}
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        label="Adresse"
                        value={billingAddress.street}
                        onChange={updateBillingField("street")}
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        label="Complément d'adresse (optionnel)"
                        value={billingAddress.street2}
                        onChange={updateBillingField("street2")}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Input
                        label="Code postal"
                        value={billingAddress.postalCode}
                        onChange={updateBillingField("postalCode")}
                        required
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Ville"
                          value={billingAddress.city}
                          onChange={updateBillingField("city")}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Pays
                        </label>
                        <select
                          value={billingAddress.countryCode}
                          onChange={updateBillingField("countryCode")}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                          required
                        >
                          <option value="FR">France</option>
                          <option value="BE">Belgique</option>
                          <option value="CH">Suisse</option>
                          <option value="LU">Luxembourg</option>
                        </select>
                      </div>
                      <Input
                        label="Téléphone (optionnel)"
                        type="tel"
                        value={billingAddress.phone}
                        onChange={updateBillingField("phone")}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Link href="/panier">
                  <Button type="button" variant="secondary">
                    Retour au panier
                  </Button>
                </Link>
                <Button type="submit">Continuer</Button>
              </div>
            </form>
          )}

          {/* Step 2: Payment method */}
          {step === "payment" && (
            <form onSubmit={handlePaymentSubmit}>
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">
                  Mode de paiement
                </h2>

                {paymentProviders.length === 0 ? (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Aucun mode de paiement disponible.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paymentProviders.map((provider) => (
                      <label
                        key={provider.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                          selectedProvider === provider.id
                            ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-900"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={provider.id}
                          checked={selectedProvider === provider.id}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                        />
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {provider.name}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {provider.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Customer note */}
                <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Note pour la commande (optionnel)
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Instructions spéciales, message..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("address")}
                >
                  Retour
                </Button>
                <Button type="submit" disabled={!selectedProvider}>
                  Continuer
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div>
              <div className="space-y-6">
                {/* Shipping address summary */}
                <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      Adresse de livraison
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep("address")}
                      className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Modifier
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                    {shippingAddress.company && (
                      <>
                        <br />
                        {shippingAddress.company}
                      </>
                    )}
                    <br />
                    {shippingAddress.street}
                    {shippingAddress.street2 && (
                      <>
                        <br />
                        {shippingAddress.street2}
                      </>
                    )}
                    <br />
                    {shippingAddress.postalCode} {shippingAddress.city}
                    <br />
                    {shippingAddress.countryCode === "FR" && "France"}
                    {shippingAddress.countryCode === "BE" && "Belgique"}
                    {shippingAddress.countryCode === "CH" && "Suisse"}
                    {shippingAddress.countryCode === "LU" && "Luxembourg"}
                  </p>
                </div>

                {/* Billing address summary */}
                {!useSameAddress && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        Adresse de facturation
                      </h3>
                      <button
                        type="button"
                        onClick={() => setStep("address")}
                        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                      >
                        Modifier
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {billingAddress.firstName} {billingAddress.lastName}
                      {billingAddress.company && (
                        <>
                          <br />
                          {billingAddress.company}
                        </>
                      )}
                      <br />
                      {billingAddress.street}
                      {billingAddress.street2 && (
                        <>
                          <br />
                          {billingAddress.street2}
                        </>
                      )}
                      <br />
                      {billingAddress.postalCode} {billingAddress.city}
                      <br />
                      {billingAddress.countryCode === "FR" && "France"}
                      {billingAddress.countryCode === "BE" && "Belgique"}
                      {billingAddress.countryCode === "CH" && "Suisse"}
                      {billingAddress.countryCode === "LU" && "Luxembourg"}
                    </p>
                  </div>
                )}

                {/* Payment method summary */}
                <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      Mode de paiement
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep("payment")}
                      className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Modifier
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {paymentProviders.find((p) => p.id === selectedProvider)?.name}
                  </p>
                </div>

                {/* Customer note */}
                {customerNote && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      Note
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {customerNote}
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("payment")}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Traitement..." : "Payer maintenant"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Récapitulatif
            </h2>

            {/* Items */}
            <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {item.variant.product.featuredImage ? (
                      <Image
                        src={getAssetUrl(item.variant.product.featuredImage)}
                        alt={item.variant.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {item.variant.product.name}
                    </p>
                    <p className="text-xs text-zinc-500">Qté: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatPrice(parseFloat(item.variant.priceHt) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Sous-total HT</span>
                <span className="text-zinc-900 dark:text-white">
                  {formatPrice(subtotalHt, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">TVA (20%)</span>
                <span className="text-zinc-900 dark:text-white">
                  {formatPrice(tva, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Livraison</span>
                <span className="text-zinc-900 dark:text-white">Gratuite</span>
              </div>
              <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-white">Total TTC</span>
                  <span className="text-zinc-900 dark:text-white">
                    {formatPrice(totalTtc, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
