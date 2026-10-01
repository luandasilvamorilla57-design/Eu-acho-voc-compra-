import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const enc = new TextEncoder();

function parseSignature(header: string) {
  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  return { ts, v1 };
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validMercadoPagoSignature(
  secret: string,
  xSignature: string,
  xRequestId: string,
  dataId: string,
) {
  const { ts, v1 } = parseSignature(xSignature);
  if (!ts || !v1 || !xRequestId || !dataId) return false;

  // IDs de alguns tópicos podem chegar em maiúsculas; a documentação do MP
  // orienta normalizá-los para minúsculas na validação. Aceitamos também o
  // valor original para compatibilidade com tópicos numéricos.
  const candidates = [...new Set([dataId, dataId.toLowerCase()])];
  for (const id of candidates) {
    const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
    const digest = await hmacHex(secret, manifest);
    if (safeEqual(digest, v1)) return true;
  }
  return false;
}

function parseExternalReference(value: unknown) {
  const ref = String(value ?? "").trim();
  const match = /^radar:([0-9a-f-]{36}):(start|pro|max)$/i.exec(ref);
  if (!match) return null;
  return { userId: match[1].toLowerCase(), plan: match[2].toLowerCase() };
}

function parseExtraReference(value: unknown) {
  const ref = String(value ?? "").trim();
  const match = /^radar-extra:([0-9a-f-]{36}):(\d+)$/i.exec(ref);
  if (!match) return null;
  const quantity = Number(match[2]);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { userId: match[1].toLowerCase(), quantity };
}

async function mpGet(path: string, token: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const raw = await response.json().catch(() => ({}));
  return { response, raw };
}

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET") ?? "";
  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (req.method === "GET") {
    return json({ ok: true, service: "mercadopago-webhook" });
  }

  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!webhookSecret || !accessToken || !supabaseUrl || !serviceRole) {
    console.error("MP_WEBHOOK_CONFIG_MISSING");
    return json({ error: "Configuração incompleta" }, 503);
  }

  const url = new URL(req.url);
  const bodyText = await req.text();
  let body: any = {};
  try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }

  const dataId = url.searchParams.get("data.id")
    ?? url.searchParams.get("data_id")
    ?? String(body?.data?.id ?? "");
  const type = url.searchParams.get("type") ?? String(body?.type ?? "");
  const action = String(body?.action ?? "");
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const signatureValid = await validMercadoPagoSignature(
    webhookSecret, xSignature, xRequestId, dataId,
  );

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!signatureValid) {
    console.warn("MP_WEBHOOK_BAD_SIGNATURE", JSON.stringify({ type, dataId, xRequestId }));
    await admin.from("mercadopago_webhook_eventos").insert({
      request_id: xRequestId || null,
      event_id: String(body?.id ?? "") || null,
      tipo: type || null,
      acao: action || null,
      resource_id: dataId || null,
      live_mode: typeof body?.live_mode === "boolean" ? body.live_mode : null,
      assinatura_valida: false,
      processado: false,
      erro: "assinatura_invalida",
      payload: {},
    });
    return json({ error: "Assinatura inválida" }, 401);
  }

  let resource: any = null;
  let resourceError = "";
  let subscription: any = null;

  try {
    let path = "";
    if (type === "subscription_preapproval") path = `/preapproval/${encodeURIComponent(dataId)}`;
    else if (type === "subscription_authorized_payment") path = `/authorized_payments/${encodeURIComponent(dataId)}`;
    else if (type === "payment") path = `/v1/payments/${encodeURIComponent(dataId)}`;

    if (path) {
      const got = await mpGet(path, accessToken);
      resource = got.raw;
      if (!got.response.ok) {
        resourceError = `mercadopago_${got.response.status}`;
        console.warn("MP_RESOURCE_LOOKUP_FAILED", JSON.stringify({
          type, dataId, status: got.response.status,
        }));
      }
    }

    if (resource && type === "subscription_authorized_payment" && resource?.preapproval_id) {
      const gotSub = await mpGet(
        `/preapproval/${encodeURIComponent(String(resource.preapproval_id))}`,
        accessToken,
      );
      if (gotSub.response.ok) subscription = gotSub.raw;
    } else if (resource && type === "subscription_preapproval") {
      subscription = resource;
    }

    const rawReference = resource?.external_reference ?? subscription?.external_reference;
    const refInfo = parseExternalReference(rawReference);
    const extraInfo = parseExtraReference(rawReference);

    const subscriptionId = String(
      subscription?.id ?? resource?.preapproval_id ?? "",
    ).trim();

    const isApprovedPayment =
      (type === "subscription_authorized_payment" && resource?.payment?.status === "approved")
      || (type === "payment" && resource?.status === "approved");

    if (extraInfo && isApprovedPayment) {
      const environment = body?.live_mode === true ? "production" : "test";
      const paymentId = String(resource?.id ?? dataId ?? "").trim();
      const paidValue = Number(
        resource?.transaction_amount
        ?? resource?.transaction_details?.total_paid_amount
        ?? 0
      ) || 0;

      if (paymentId) {
        const { data: creditResult, error: creditError } = await admin.rpc("registrar_pagamento_extra", {
          p_user_id: extraInfo.userId,
          p_gateway: "mercado_pago",
          p_ambiente: environment,
          p_external_reference: String(rawReference ?? ""),
          p_gateway_payment_id: paymentId,
          p_quantidade: extraInfo.quantity,
          p_valor: paidValue,
          p_payload: {
            type,
            action,
            status: resource?.status ?? resource?.payment?.status ?? null,
          },
        });
        if (creditError) throw creditError;
        console.log("MP_EXTRA_CREDITS_GRANTED", JSON.stringify({
          userId: extraInfo.userId,
          quantity: extraInfo.quantity,
          paymentId,
          result: creditResult,
        }));
      }
    }

    if (refInfo && subscriptionId) {
      const row: Record<string, unknown> = {
        user_id: refInfo.userId,
        plano: refInfo.plan,
        gateway: "mercado_pago",
        ambiente: body?.live_mode === true ? "production" : "test",
        mercadopago_subscription_id: subscriptionId,
        mercadopago_plan_id: subscription?.preapproval_plan_id ?? null,
        external_reference: String(
          resource?.external_reference ?? subscription?.external_reference ?? "",
        ),
        payer_email: subscription?.payer_email ?? resource?.payer_email ?? null,
        status: String(subscription?.status ?? resource?.payment?.status ?? resource?.status ?? "unknown"),
        valor: Number(
          subscription?.auto_recurring?.transaction_amount
          ?? resource?.transaction_amount
          ?? resource?.transaction_details?.total_paid_amount
          ?? 0
        ) || null,
        currency_id: String(
          subscription?.auto_recurring?.currency_id ?? resource?.currency_id ?? "BRL"
        ),
        proxima_cobranca: subscription?.next_payment_date ?? null,
        valido_ate: subscription?.next_payment_date ?? null,
        cancelada_em: subscription?.status === "cancelled" ? new Date().toISOString() : null,
        dados_gateway: {
          type,
          action,
          subscription_status: subscription?.status ?? null,
          payment_status: resource?.payment?.status ?? resource?.status ?? null,
        },
      };

      if (isApprovedPayment) {
        row.ultimo_pagamento_em = new Date().toISOString();
      }

      const { error: upsertError } = await admin
        .from("assinaturas")
        .upsert(row, { onConflict: "ambiente,mercadopago_subscription_id" });
      if (upsertError) throw upsertError;

      // O plano exibido no app só acompanha um pagamento realmente aprovado.
      // A autorização efetiva continua sendo calculada no servidor pela assinatura paga.
      if (isApprovedPayment) {
        const { error: planError } = await admin
          .from("radar_config")
          .upsert(
            { user_id: refInfo.userId, plano_atual: refInfo.plan },
            { onConflict: "user_id" },
          );
        if (planError) throw planError;
        console.log("MP_PLAN_ACTIVATED", JSON.stringify({
          userId: refInfo.userId, plan: refInfo.plan, subscriptionId,
        }));
      }
    }
  } catch (e) {
    resourceError = e instanceof Error ? e.message : "processamento_falhou";
    console.error("MP_WEBHOOK_PROCESS_ERROR", resourceError);
  }

  await admin.from("mercadopago_webhook_eventos").insert({
    request_id: xRequestId || null,
    event_id: String(body?.id ?? "") || null,
    tipo: type || null,
    acao: action || null,
    resource_id: dataId || null,
    live_mode: typeof body?.live_mode === "boolean" ? body.live_mode : null,
    assinatura_valida: true,
    processado: !resourceError,
    erro: resourceError || null,
    payload: {
      body,
      resource_summary: resource ? {
        id: resource?.id ?? null,
        status: resource?.status ?? resource?.payment?.status ?? null,
        preapproval_id: resource?.preapproval_id ?? null,
        external_reference: resource?.external_reference ?? null,
      } : null,
    },
  });

  console.log("MP_WEBHOOK_OK", JSON.stringify({
    type, dataId, action, resourceError: resourceError || null,
  }));

  // O MP recomenda 200/201 para confirmar recebimento. Mesmo se uma simulação
  // usar um resource_id fictício, a assinatura já foi validada e registramos o evento.
  return json({ received: true });
});
