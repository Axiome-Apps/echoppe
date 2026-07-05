export type PaymentProvider = 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface CheckoutSession {
  id: string;
  url: string;
  provider: PaymentProvider;
}

export interface CheckoutParams {
  orderId: string;
  amount: number; // En centimes
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  lineItems?: LineItem[];
}

export interface LineItem {
  name: string;
  quantity: number;
  unitAmount: number; // En centimes
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  orderId?: string;
  amount?: number;
  rawData: unknown;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface CaptureResult {
  success: boolean;
  error?: string;
}

export interface PaymentAdapter {
  readonly provider: PaymentProvider;

  /**
   * Crée une session de checkout et retourne l'URL de redirection
   */
  createCheckout(params: CheckoutParams): Promise<CheckoutSession>;

  /**
   * Vérifie et parse un webhook entrant
   * @param payload - Le body brut du webhook
   * @param signature - La signature (stripe-signature ou paypal-transmission-sig)
   * @param headers - Headers additionnels (requis pour PayPal)
   */
  verifyWebhook(
    payload: string,
    signature: string,
    headers?: Record<string, string>,
  ): Promise<PaymentResult>;

  /**
   * Effectue un remboursement (total ou partiel)
   */
  refund(transactionId: string, amount?: number): Promise<RefundResult>;

  /**
   * Capture une autorisation préalable (capture manuelle).
   * Présent uniquement sur les adapters supportant la capture différée (Stripe).
   * Son absence signale un adapter en capture immédiate (PayPal).
   */
  capturePayment?(transactionId: string): Promise<CaptureResult>;

  /**
   * Annule une autorisation non capturée → fonds libérés, aucun débit.
   * Va de pair avec `capturePayment` (capture manuelle uniquement).
   */
  cancelPayment?(transactionId: string): Promise<CaptureResult>;

  /**
   * Vérifie si l'adapter est configuré (credentials présents et activé)
   */
  isConfigured(): Promise<boolean>;
}
