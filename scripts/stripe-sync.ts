/**
 * Script de sincronização do Stripe
 * Lista e valida os produtos e preços criados no Stripe
 *
 * Execute: npx tsx scripts/stripe-sync.ts
 */

import { stripe } from "../src/lib/stripe";

async function main() {
  if (!stripe) {
    console.error(
      "❌ Stripe não está configurado. Defina STRIPE_SECRET_KEY no .env"
    );
    process.exit(1);
  }

  console.log("🔍 Listando produtos e preços no Stripe...\n");

  try {
    // Listar todos os produtos
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    if (products.data.length === 0) {
      console.log("⚠️  Nenhum produto encontrado no Stripe.");
      console.log("💡 Crie produtos no dashboard do Stripe primeiro.");
      return;
    }

    // Para cada produto, listar seus preços
    for (const product of products.data) {
      console.log(`✨ ${product.name}`);

      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      if (prices.data.length === 0) {
        console.log("   ⚠️  Nenhum preço encontrado para este produto.\n");
        continue;
      }

      prices.data.forEach((price) => {
        const amount = price.unit_amount ? price.unit_amount / 100 : 0;
        const currency = price.currency.toUpperCase();
        const interval = price.recurring?.interval || "one-time";
        const nickname = price.nickname || price.id;

        console.log(`   💰 ${nickname} - ${amount} ${currency} (${interval})`);
      });

      console.log();
    }

    console.log("✅ Sincronização concluída!");
  } catch (error) {
    console.error("❌ Erro ao sincronizar produtos do Stripe:", error);
    process.exit(1);
  }
}

main().catch(console.error);
