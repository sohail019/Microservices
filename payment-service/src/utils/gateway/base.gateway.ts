import { createLogger } from "../logger";

const logger = createLogger("BaseGateway");

export interface GatewayConfig {
  apiKey: string;
  apiSecret?: string;
  environment?: string;
}

export interface PaymentInitiateParams {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface PaymentRefundParams {
  paymentId: string;
  amount?: number;
  reason: string;
}

export interface WebhookParams {
  event: string;
  gatewayPaymentId: string;
  data: any;
}

export interface GatewayResponse {
  success: boolean;
  gatewayPaymentId?: string;
  status: string;
  redirectUrl?: string;
  message?: string;
  data?: any;
}

/**
 * Base Payment Gateway class that all gateway implementations should extend
 */
export abstract class BaseGateway {
  protected config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  /**
   * Initiate a payment
   */
  abstract initiatePayment(
    params: PaymentInitiateParams
  ): Promise<GatewayResponse>;

  /**
   * Verify and process a webhook event
   */
  abstract processWebhook(params: WebhookParams): Promise<GatewayResponse>;

  /**
   * Process a refund
   */
  abstract processRefund(params: PaymentRefundParams): Promise<GatewayResponse>;

  /**
   * Cancel a payment
   */
  abstract cancelPayment(paymentId: string): Promise<GatewayResponse>;

  /**
   * Get payment details
   */
  abstract getPaymentDetails(paymentId: string): Promise<GatewayResponse>;

  /**
   * Map gateway-specific status to our standard status
   */
  protected abstract mapStatus(gatewayStatus: string): string;

  /**
   * Format currency amount for the gateway (some require cents/paisa conversion)
   */
  protected formatAmount(amount: number, currency: string): number {
    // Most gateways use smallest currency unit (cents, paisa, etc.)
    if (currency === "USD" || currency === "EUR" || currency === "GBP") {
      return Math.round(amount * 100); // Convert to cents
    } else if (currency === "INR") {
      return Math.round(amount * 100); // Convert to paisa
    }
    return amount;
  }

  /**
   * Generate a unique reference ID
   */
  protected generateReferenceId(): string {
    return `ref_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  }

  /**
   * Handle errors from gateway API
   */
  protected handleError(error: any): GatewayResponse {
    logger.error(`Payment gateway error:`, error);

    return {
      success: false,
      status: "failed",
      message: error.message || "An error occurred with the payment gateway",
      data: error,
    };
  }
}
