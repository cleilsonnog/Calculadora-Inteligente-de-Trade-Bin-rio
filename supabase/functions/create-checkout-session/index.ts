import { serve } from "std/http";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { corsHeaders } from "../_shared/cors.ts";

// Função principal que será servida
serve(async (req) => {
  // Habilita CORS para permitir que o frontend chame esta função
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validação robusta das variáveis de ambiente
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Verificação individual para saber exatamente qual variável está faltando
    if (!stripeSecretKey) throw new Error("Missing env var: STRIPE_SECRET_KEY");
    if (!siteUrl) throw new Error("Missing env var: SITE_URL");
    if (!supabaseUrl) throw new Error("Missing env var: SUPABASE_URL");
    if (!supabaseAnonKey) throw new Error("Missing env var: SUPABASE_ANON_KEY");

    // Inicializa o Stripe com a chave secreta
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20", // ⬅️ ATUALIZADO: Versão da API mais recente e estável
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 1. Extrai o token de autenticação do usuário e o ID do preço
    const { priceId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;

    // 2. Cria um cliente Supabase para interagir com o banco de dados
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Obtém os dados do usuário autenticado
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("User not found.");
    }

    // 4. Busca o stripe_customer_id do usuário no nosso banco de dados
    let { data: customer, error } = await supabaseClient
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    // 5. Se o usuário não for um cliente no Stripe ainda, cria um
    if (error || !customer?.stripe_customer_id) {
      const customerData: { metadata: { user_id: string }; email?: string } = {
        metadata: { user_id: user.id },
      };
      if (user.email) {
        customerData.email = user.email;
      }

      const newStripeCustomer = await stripe.customers.create(customerData);
      const stripe_customer_id = newStripeCustomer.id;

      // Salva o novo ID do cliente no nosso banco de dados
      await supabaseClient
        .from("customers")
        .insert({ id: user.id, stripe_customer_id })
        .select();

      customer = { stripe_customer_id };
    }

    // 6. Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "pix"], // ⬅️ MELHORIA: Habilita Cartão e PIX
      customer: customer.stripe_customer_id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription", // Define que é uma assinatura
      client_reference_id: user.id, // ⬅️ ADICIONADO: Vincula a sessão ao ID do usuário do Supabase
      subscription_data: {
        trial_from_plan: true, // Usa o período de teste definido no plano do Stripe
      },
      success_url: `${siteUrl}/app`, // Redireciona para o app após sucesso
      cancel_url: `${siteUrl}/`, // Redireciona para a landing page se cancelar
    });

    // 7. Retorna o ID da sessão para o frontend
    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
