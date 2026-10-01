import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const APP_ORIGIN='https://radar-do-brique.vercel.app'
function corsHeaders(req:Request){
  const origin=req.headers.get('origin')||''
  const local=/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const allowed=origin===APP_ORIGIN||local
  return {
    'Access-Control-Allow-Origin':allowed?origin:APP_ORIGIN,
    'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  }
}


const TEST_PAYER_EMAIL="test_payer_3728717908@testuser.com";

type PlanSlug = "start" | "pro" | "max";

const isPlan = (v: unknown): v is PlanSlug =>
  v === "start" || v === "pro" || v === "max";

async function mpRequest(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const raw = await response.json().catch(() => ({}));
  return { response, raw };
}

Deno.serve(async (req: Request) => {
  const cors=corsHeaders(req)
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}})
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const appUrl = Deno.env.get("APP_URL") || "https://radar-do-brique.vercel.app";

  if (!accessToken || !supabaseUrl || !serviceRole) {
    return json({ error: "Integração de pagamentos não configurada." }, 503);
  }

  try {
    const auth = req.headers.get("authorization") ?? "";
    const userToken = auth.replace(/^Bearer\s+/i, "");
    if (!userToken) return json({ error: "Sessão ausente." }, 401);

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: userError } = await admin.auth.getUser(userToken);
    if (userError || !user?.id || !user.email) {
      return json({ error: "Sessão inválida ou expirada." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plano;
    if (!isPlan(plan)) return json({ error: "Plano inválido." }, 400);

    const { data: config } = await admin
      .from("radar_config")
      .select("acesso_total")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: billing, error: billingError } = await admin
      .from("billing_config")
      .select("ambiente")
      .eq("id", 1)
      .single();
    if (billingError) return json({ error: "Ambiente de cobrança não configurado." }, 503);
    const environment = billing?.ambiente === "production" ? "production" : "test";

    if (config?.acesso_total === true) {
      return json({ already_active: true, plan: "pro", message: "Acesso total já está ativo nesta conta." });
    }

    const { data: catalog, error: catalogError } = await admin
      .from("planos_catalogo")
      .select("slug,nome,preco_mensal,ativo")
      .eq("slug", plan)
      .eq("ativo", true)
      .single();

    if (catalogError || !catalog) return json({ error: "Plano indisponível." }, 404);

    const { data: current } = await admin
      .from("assinaturas")
      .select("mercadopago_subscription_id,status,plano,ultimo_pagamento_em")
      .eq("user_id", user.id)
      .eq("ambiente", environment)
      .in("status", ["pending", "authorized", "active"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (current?.mercadopago_subscription_id) {
      const got = await mpRequest(
        `/preapproval/${encodeURIComponent(current.mercadopago_subscription_id)}`,
        accessToken,
      );

      if (got.response.ok) {
        const status = String(got.raw?.status ?? current.status);
        if ((status === "authorized" || status === "active") && current.ultimo_pagamento_em) {
          return json({ already_active: true, plan: current.plano, status });
        }
        if (got.raw?.init_point && current.plano === plan) {
          return json({
            checkout_url: got.raw.init_point,
            subscription_id: current.mercadopago_subscription_id,
            status,
            reused: true,
          });
        }
      }
    }

    const externalReference = `radar:${user.id}:${plan}`;
    const amount = Number(catalog.preco_mensal);
    const payerEmail = environment === "test" ? TEST_PAYER_EMAIL : user.email;

    const payload = {
      reason: `Radar do Brique - Plano ${catalog.nome}`,
      external_reference: externalReference,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `${appUrl.replace(/\/$/, "")}/?checkout=retorno&plano=${plan}`,
      status: "pending",
    };

    const created = await mpRequest("/preapproval", accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!created.response.ok || !created.raw?.id || !created.raw?.init_point) {
      console.error("MP_CREATE_SUBSCRIPTION_ERROR", created.response.status, JSON.stringify(created.raw));
      return json({
        error: created.raw?.message || "Não foi possível iniciar a assinatura no Mercado Pago.",
      }, created.response.status >= 400 && created.response.status < 600 ? created.response.status : 502);
    }

    const { error: dbError } = await admin.from("assinaturas").upsert({
      user_id: user.id,
      plano: plan,
      gateway: "mercado_pago",
      ambiente: environment,
      mercadopago_subscription_id: String(created.raw.id),
      mercadopago_plan_id: created.raw.preapproval_plan_id ?? null,
      external_reference: externalReference,
      payer_email: payerEmail,
      status: String(created.raw.status ?? "pending"),
      valor: amount,
      currency_id: "BRL",
      proxima_cobranca: created.raw.next_payment_date ?? null,
      dados_gateway: {
        created_from: "radar_checkout",
        init_point_created: true,
      },
    }, { onConflict: "ambiente,mercadopago_subscription_id" });

    if (dbError) {
      console.error("MP_SUBSCRIPTION_DB_ERROR", dbError);
      return json({ error: "Assinatura criada, mas não foi possível registrar o checkout." }, 500);
    }

    return json({
      checkout_url: created.raw.init_point,
      subscription_id: String(created.raw.id),
      status: String(created.raw.status ?? "pending"),
      plan,
    });
  } catch (error) {
    console.error("MP_CHECKOUT_ERROR", error);
    return json({
      error: error instanceof Error ? error.message : "Erro ao iniciar assinatura.",
    }, 500);
  }
});
