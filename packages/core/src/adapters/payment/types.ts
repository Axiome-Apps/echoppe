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

export interface PaymentAdapter {
  readonly provider: PaymentProvider;

  /**
   * Crée une session de checkout et retourne l'URL de redirection
   */
  createCheckout(params: CheckoutParams): Promise<CheckoutSession>;

  /**
   * Vérifie et parse un webhook entrant
   */
  verifyWebhook(payload: string, signature: string): Promise<PaymentResult>;

  /**
   * Effectue un remboursement (total ou partiel)
   */
  refund(transactionId: string, amount?: number): Promise<RefundResult>;

  /**
   * Vérifie si l'adapter est configuré (credentials présents et activé)
   */
  isConfigured(): Promise<boolean>;
}
