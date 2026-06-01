export type CategoriaConfig = "GENERAL" | "EMAIL" | "PAYMENT";

export const inferCategory = (clave: string): CategoriaConfig => {
  const key = clave.toUpperCase();

  if (key.startsWith("STRIPE_") || key.startsWith("MERCADOPAGO_") || key.startsWith("PAYPAL_")) return "PAYMENT";
  if (key.startsWith("SMTP_") || key.startsWith("EMAIL_") || key.startsWith("RESEND_")) return "EMAIL";
  return "GENERAL";
};
