import { describe, it, expect } from 'vitest';
import { inferCategory } from './config-utils';

describe('inferCategory', () => {
  it('returns PAYMENT for Stripe/MercadoPago/Paypal keys', () => {
    expect(inferCategory('STRIPE_SECRET')).toBe('PAYMENT');
    expect(inferCategory('mercadopago_token')).toBe('PAYMENT');
    expect(inferCategory('PayPal_key')).toBe('PAYMENT');
  });

  it('returns EMAIL for SMTP/EMAIL/RESEND keys', () => {
    expect(inferCategory('SMTP_HOST')).toBe('EMAIL');
    expect(inferCategory('email_from')).toBe('EMAIL');
    expect(inferCategory('Resend_API_KEY')).toBe('EMAIL');
  });

  it('returns GENERAL for other keys', () => {
    expect(inferCategory('SOME_SETTING')).toBe('GENERAL');
    expect(inferCategory('')).toBe('GENERAL');
    expect(inferCategory('STRIPESPECIAL')).toBe('GENERAL');
  });
});
