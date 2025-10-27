const { data, error } = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ priceId: "price_123" }),
  }
).then((r) => r.json());
