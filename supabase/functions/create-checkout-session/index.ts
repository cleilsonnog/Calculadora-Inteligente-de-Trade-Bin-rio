import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import Stripe from "https://esm.sh/stripe@10.17.0";

// Declare o tipo mínimo de 'Deno' para que o TypeScript reconheça Deno.env durante a checagem
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Inicializa o Stripe com a chave secreta dos segredos da Supabase
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Função principal que será servida
serve(async (req) => {
  // Habilita CORS para permitir que o frontend chame esta função
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Extrai o token de autenticação do usuário e o ID do preço
    const { priceId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;

    // 2. Cria um cliente Supabase para interagir com o banco de dados
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Obtém os dados do usuário autenticado
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("User not found.");
    }

    // 4. Busca o stripe_customer_id do usuário no nosso banco de dados
    const { data: customer, error } = await supabaseClient
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
      payment_method_types: ["pix"], // Habilita PIX
      customer: customer.stripe_customer_id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription", // Define que é uma assinatura
      subscription_data: {
        trial_from_plan: true, // Usa o período de teste definido no plano do Stripe
      },
      success_url: `${Deno.env.get("SITE_URL")}/app`, // Redireciona para o app após sucesso
      cancel_url: `${Deno.env.get("SITE_URL")}/`, // Redireciona para a landing page se cancelar
    });

    // 7. Retorna o ID da sessão para o frontend
    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
});
