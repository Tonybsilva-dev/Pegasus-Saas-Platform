import Stripe from "stripe";

import { env } from "@/core/env";

/**
 * Cliente Stripe singleton
 * Mantém uma única instância do Stripe para toda a aplicação
 *
 * Boas práticas:
 * - Não inicializar Stripe dentro de handlers; manter singleton
 * - Em dev, use `stripe login` e `stripe listen` para webhooks locais
 * - Nunca expor STRIPE_SECRET_KEY no cliente; use rotas /api/billing/... seguras
 *
 * @see https://stripe.com/docs/api
 */
let stripeInstance: Stripe | null = null;

/**
 * Retorna a instância singleton do cliente Stripe
 * Cria uma nova instância se não existir
 */
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    console.warn(
      "[Stripe] STRIPE_SECRET_KEY não configurada. Stripe não estará disponível."
    );
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      // Usar a versão mais recente suportada pelo SDK
      // O Stripe SDK gerencia automaticamente a versão se não especificada
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Exporta a instância do Stripe diretamente
 * Use esta exportação para acessar o Stripe em toda a aplicação
 */
export const stripe = getStripe();
