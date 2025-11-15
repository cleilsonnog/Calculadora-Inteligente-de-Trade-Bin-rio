import { serve } from "std/http";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { corsHeaders } from "../_shared/cors.ts";

// Helper para upsert de produtos
const upsertProduct = async (
  product: Stripe.Product,
  supabaseAdmin: SupabaseClient,
) => {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };
  const { error } = await supabaseAdmin.from("products").upsert(productData);
  if (error) throw error;
  console.log(`Product upserted: ${product.id}`);
};

// Helper para upsert de preços
const upsertPrice = async (
  price: Stripe.Price,
  supabaseAdmin: SupabaseClient,
) => {
  const priceData = {
    id: price.id,
    product_id: typeof price.product === "string"
      ? price.product
      : (price.product as Stripe.Product)?.id,
    active: price.active,
    currency: price.currency,
    description: price.nickname,
    type: price.type,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
    trial_period_days: price.recurring?.trial_period_days,
    metadata: price.metadata,
  };
  const { error } = await supabaseAdmin.from("prices").upsert(priceData);
  if (error) throw error;
  console.log(`Price upserted: ${price.id}`);
};

// Helper para gerenciar mudanças de status de assinatura
const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction: boolean,
  supabaseAdmin: SupabaseClient,
) => {
  // Obtém o user_id do cliente na nossa tabela 'customers'
  const { data: customerData, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (customerError) throw customerError;

  const { id: userId } = customerData;

  // A instância do Stripe deve ser passada para a função ou criada aqui com a chave
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method", "latest_invoice.payment_intent"],
  });

  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    metadata: subscription.metadata,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    created: new Date(subscription.created * 1000).toISOString(),
    current_period_start: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionData);
  if (error) throw error;
  console.log(
    `Subscription ${createAction ? "created" : "updated"}: ${subscription.id}`,
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validação robusta das variáveis de ambiente
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) throw new Error("Missing env var: STRIPE_SECRET_KEY");
    if (!webhookSecret) {
      throw new Error("Missing env var: STRIPE_WEBHOOK_SIGNING_SECRET");
    }
    if (!supabaseUrl) throw new Error("Missing env var: SUPABASE_URL");
    if (!supabaseServiceKey) {
      throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
    }

    // Valida a assinatura do webhook
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header.");
    }

    const body = await req.text();
    // Inicializa o Stripe com a chave secreta
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
    );

    // Cria um cliente Supabase com service role para acesso administrativo
    const supabaseAdmin: SupabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
    );

    switch (event.type) {
      case "product.created":
      case "product.updated":
        await upsertProduct(event.data.object, supabaseAdmin);
        break;

      case "price.created":
      case "price.updated":
        await upsertPrice(event.data.object, supabaseAdmin);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object as Stripe.Subscription;
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            event.type === "customer.subscription.created", // true se for criação, false se for update/delete
            supabaseAdmin,
          );
        }
        break;

      case "checkout.session.completed":
        {
          const checkoutSession = event.data.object;
          if (
            checkoutSession.mode === "subscription" &&
            checkoutSession.subscription
          ) {
            // Se a sessão de checkout for de assinatura e tiver um ID de assinatura,
            // gerencie a mudança de status (criação/atualização)
            await manageSubscriptionStatusChange(
              checkoutSession.subscription as string,
              checkoutSession.customer as string,
              true, // É uma criação/confirmação de assinatura
              supabaseAdmin,
            );
          }
        }
        break;
      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook handler failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
