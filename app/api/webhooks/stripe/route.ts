import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/core/env";
import { prisma } from "@/core/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/webhooks/stripe
 * Webhook do Stripe para sincronização automática de assinaturas
 *
 * Processa eventos do Stripe:
 * - checkout.session.completed: Nova assinatura criada via Checkout
 * - customer.subscription.updated: Assinatura atualizada (mudança de plano, renovação, etc.)
 * - customer.subscription.deleted: Assinatura cancelada
 *
 * @see https://stripe.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar se Stripe está configurado
    const stripe = getStripe();
    if (!stripe) {
      console.error("[Webhook Stripe] Stripe não configurado");
      return NextResponse.json(
        { message: "Stripe não configurado", error: "STRIPE_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    // 2. Verificar se webhook secret está configurado
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error("[Webhook Stripe] STRIPE_WEBHOOK_SECRET não configurado");
      return NextResponse.json(
        {
          message: "Webhook secret não configurado",
          error: "WEBHOOK_SECRET_MISSING",
        },
        { status: 503 }
      );
    }

    // 3. Obter raw body e signature header
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Webhook Stripe] Header stripe-signature ausente");
      return NextResponse.json(
        {
          message: "Assinatura do webhook ausente",
          error: "SIGNATURE_MISSING",
        },
        { status: 400 }
      );
    }

    // 4. Validar assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
        300 // Tolerância de 300 segundos (5 minutos)
      );
    } catch (error) {
      console.error("[Webhook Stripe] Erro ao validar assinatura:", error);
      return NextResponse.json(
        {
          message: "Assinatura do webhook inválida",
          error: "SIGNATURE_INVALID",
        },
        { status: 400 }
      );
    }

    console.log(
      `[Webhook Stripe] Evento recebido: ${event.type} (ID: ${event.id})`
    );

    // 5. Processar evento baseado no tipo
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      default:
        console.log(`[Webhook Stripe] Evento não tratado: ${event.type}`);
    }

    // 6. Retornar sucesso
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook Stripe] Erro ao processar webhook:", error);
    return NextResponse.json(
      {
        message: "Erro interno ao processar webhook",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * Processa evento checkout.session.completed
 * Cria ou atualiza assinatura quando um checkout é concluído
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    const customerId = session.customer;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!customerId || !subscriptionId) {
      console.error(
        "[Webhook Stripe] checkout.session.completed sem customerId ou subscriptionId"
      );
      return;
    }

    // Buscar tenant pelo customerId
    const tenant = await prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId as string },
    });

    if (!tenant) {
      console.error(
        `[Webhook Stripe] Tenant não encontrado para customerId: ${customerId}`
      );
      return;
    }

    // Buscar detalhes da assinatura no Stripe
    const stripe = getStripe();
    if (!stripe) {
      console.error("[Webhook Stripe] Stripe não disponível");
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId as string,
      {
        expand: ["items.data.price"],
      }
    );

    // Atualizar tenant com dados da assinatura
    // Type assertion para acessar propriedades que podem não estar no tipo TypeScript
    const sub = subscription as unknown as Stripe.Subscription & {
      current_period_end: number | null;
      trial_end: number | null;
    };
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: sub.id,
        plan: mapStripePriceToPlan(sub.items.data[0]?.price.id),
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      },
    });

    console.log(
      `[Webhook Stripe] Assinatura criada para tenant ${tenant.id}: ${subscription.id}`
    );
  } catch (error) {
    console.error(
      "[Webhook Stripe] Erro ao processar checkout.session.completed:",
      error
    );
    throw error;
  }
}

/**
 * Processa evento customer.subscription.updated
 * Atualiza assinatura quando há mudanças (mudança de plano, renovação, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    // Buscar tenant pelo customerId
    const tenant = await prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!tenant) {
      console.error(
        `[Webhook Stripe] Tenant não encontrado para customerId: ${customerId}`
      );
      return;
    }

    // Atualizar tenant com dados atualizados da assinatura
    // Type assertion para acessar propriedades que podem não estar no tipo TypeScript
    const subData = subscription as unknown as {
      current_period_end: number | null;
      trial_end: number | null;
    };
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: subscription.id,
        plan: mapStripePriceToPlan(subscription.items.data[0]?.price.id),
        currentPeriodEnd: subData.current_period_end
          ? new Date(subData.current_period_end * 1000)
          : null,
        trialEndsAt: subData.trial_end
          ? new Date(subData.trial_end * 1000)
          : null,
      },
    });

    console.log(
      `[Webhook Stripe] Assinatura atualizada para tenant ${tenant.id}: ${subscription.id}`
    );
  } catch (error) {
    console.error(
      "[Webhook Stripe] Erro ao processar customer.subscription.updated:",
      error
    );
    throw error;
  }
}

/**
 * Processa evento customer.subscription.deleted
 * Cancela assinatura e downgrade para plano FREE
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    // Buscar tenant pelo customerId
    const tenant = await prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!tenant) {
      console.error(
        `[Webhook Stripe] Tenant não encontrado para customerId: ${customerId}`
      );
      return;
    }

    // Atualizar tenant: remover subscriptionId e downgrade para FREE
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: null,
        plan: "FREE",
        currentPeriodEnd: null,
        trialEndsAt: null,
      },
    });

    console.log(
      `[Webhook Stripe] Assinatura cancelada para tenant ${tenant.id}: ${subscription.id}`
    );
  } catch (error) {
    console.error(
      "[Webhook Stripe] Erro ao processar customer.subscription.deleted:",
      error
    );
    throw error;
  }
}

/**
 * Mapeia o Price ID do Stripe para o enum TenantPlan
 * TODO: Este mapeamento deve ser configurável ou buscar do banco de dados
 */
function mapStripePriceToPlan(
  priceId: string | undefined
): "FREE" | "PRO" | "ENTERPRISE" {
  if (!priceId) {
    return "FREE";
  }

  // Mapeamento baseado nos Price IDs configurados no Stripe
  // Ajuste conforme seus Price IDs reais
  if (priceId.includes("pro") || priceId.includes("PRO")) {
    return "PRO";
  }
  if (priceId.includes("enterprise") || priceId.includes("ENTERPRISE")) {
    return "ENTERPRISE";
  }

  return "FREE";
}
