/**
 * Script de teste do Stripe
 * Cria um cliente e assinatura de teste para validar a integração
 *
 * Execute: npx tsx scripts/stripe-test.ts
 *
 * Esta etapa será usada depois para criar assinaturas de tenants automaticamente.
 * Mas você já pode validar a conexão com um teste simples.
 */

import { stripe } from "../src/lib/stripe";

async function testStripe() {
  if (!stripe) {
    console.error(
      "❌ Stripe não está configurado. Defina STRIPE_SECRET_KEY no .env"
    );
    process.exit(1);
  }

  try {
    console.log("🧪 Testando integração com Stripe...\n");

    // Criar um cliente de teste
    console.log("📝 Criando cliente de teste...");
    const customer = await stripe.customers.create({
      name: "Empresa de Teste",
      email: "demo@empresa.com",
      metadata: {
        test: "true",
        created_by: "stripe-test-script",
      },
    });

    console.log(`✓ Cliente criado: ${customer.id}\n`);

    // Criar uma assinatura de teste
    // NOTA: Substitua "price_pegasus_pro_monthly" pelo ID real do preço criado no Stripe
    const testPriceId =
      process.env.STRIPE_TEST_PRICE_ID || "price_pegasus_pro_monthly";

    console.log(`📝 Criando assinatura de teste com preço: ${testPriceId}...`);

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: testPriceId,
          },
        ],
        metadata: {
          test: "true",
          created_by: "stripe-test-script",
        },
      });

      console.log(`🧾 Assinatura criada: ${subscription.id}\n`);
      console.log("✅ Teste concluído com sucesso!");
      console.log("\n📋 Resultado esperado:");
      console.log("   • Cliente e assinatura criados no painel do Stripe");
      console.log(
        "   • Tenant correspondente atualizado com stripeCustomerId e stripeSubscriptionId (em tarefas futuras)"
      );
    } catch (subscriptionError: unknown) {
      if (subscriptionError instanceof Error) {
        if (subscriptionError.message.includes("No such price")) {
          console.error(`❌ Preço não encontrado: ${testPriceId}`);
          console.error(
            "💡 Crie o preço no dashboard do Stripe primeiro ou defina STRIPE_TEST_PRICE_ID no .env"
          );
        } else {
          console.error(
            "❌ Erro ao criar assinatura:",
            subscriptionError.message
          );
        }
      } else {
        console.error(
          "❌ Erro desconhecido ao criar assinatura:",
          subscriptionError
        );
      }
      // Limpar cliente de teste se a assinatura falhar
      await stripe.customers.del(customer.id);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erro ao testar Stripe:", error);
    process.exit(1);
  }
}

testStripe().catch(console.error);
