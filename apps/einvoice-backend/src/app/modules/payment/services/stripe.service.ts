import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCheckoutSessionRequest } from '@common/interfaces/common';

@Injectable()
export class StripeService {
  private stripe: Stripe.Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_CONFIG.SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_CONFIG.SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  async createCheckoutSession(params: CreateCheckoutSessionRequest) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card', 'amazon_pay', 'alipay'],
      mode: 'payment',
      success_url: this.configService.get('STRIPE_CONFIG.SUCCESS_URL'),
      cancel_url: this.configService.get('STRIPE_CONFIG.CANCEL_URL'),
      line_items: params.lineItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      customer_email: params.clientEmail,
      metadata: {
        invoiceId: params.invoiceId,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  expireCheckoutSession(sessionId: string) {
    return this.stripe.checkout.sessions.expire(sessionId);
  }
}
