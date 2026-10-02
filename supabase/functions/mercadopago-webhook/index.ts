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

function parsePixPlanReference(value: unknown) {
  const ref = String(value ?? "").trim();
  const match = /^radar-pix:([0-9a-f-]{36}):(start|pro|max):([0-9a-f-]{36})$/i.exec(ref);
  if (!match) return null;
  return { userId: match[1].toLowerCase(), plan: match[2].toLowerCase(), checkoutId: match[3].toLowerCase() };
}

function parseExtraReference(value: unknown) {
  const ref = String(value ?? "").trim();
  const match = /^radar-extra:([0-9a-f-]{36}):(\d+)$/i.exec(ref);
  if (!match) return null;
  const quantity = Number(match[2]);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { userId: match[1].toLowerCase(), quantity };
}

function parseUpgradeReference(value: unknown) {
  const ref = String(value ?? "").trim();
  const match = /^radar-upgrade:([0-9a-f-]{36}):(start|pro|max)$/i.exec(ref);
  if (!match) return null;
  return { userId: match[1].toLowerCase(), plan: match[2].toLowerCase() };
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

async function mpPut(path: string, token: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

  const { data: billing } = await admin
    .from("billing_config")
    .select("ambiente")
    .eq("id", 1)
    .maybeSingle();
  const configuredEnvironment = billing?.ambiente === "production" ? "production" : "test";

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
    const pixInfo = parsePixPlanReference(rawReference);
    const extraInfo = parseExtraReference(rawReference);
    const upgradeInfo = parseUpgradeReference(rawReference);

    let subscriptionId = String(
      subscription?.id ?? resource?.preapproval_id ?? "",
    ).trim();

    const isApprovedPayment =
      (type === "subscription_authorized_payment" && resource?.payment?.status === "approved")
      || (type === "payment" && resource?.status === "approved");

    if (refInfo && isApprovedPayment && !subscriptionId) {
      const { data: existingSub } = await admin
        .from("assinaturas")
        .select("id,mercadopago_subscription_id,status,dados_gateway")
        .eq("user_id", refInfo.userId)
        .eq("plano", refInfo.plan)
        .eq("ambiente", configuredEnvironment)
        .in("status", ["pending","authorized","active"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub?.mercadopago_subscription_id) {
        subscriptionId = String(existingSub.mercadopago_subscription_id);
        const gotSub = await mpGet(
          `/preapproval/${encodeURIComponent(subscriptionId)}`,
          accessToken,
        );
        if (gotSub.response.ok) subscription = gotSub.raw;

        const paidAt = resource?.date_approved
          ?? resource?.date_last_updated
          ?? resource?.date_created
          ?? new Date().toISOString();
        const nextPayment = subscription?.next_payment_date ?? null;
        const nextStatus = String(subscription?.status ?? "authorized");

        const { error: directUpdateError } = await admin
          .from("assinaturas")
          .update({
            status: nextStatus,
            ultimo_pagamento_em: paidAt,
            proxima_cobranca: nextPayment,
            valido_ate: nextPayment,
            payer_email: subscription?.payer_email ?? resource?.payer?.email ?? null,
            valor: Number(
              subscription?.auto_recurring?.transaction_amount
              ?? resource?.transaction_amount
              ?? 0
            ) || null,
            currency_id: String(
              subscription?.auto_recurring?.currency_id
              ?? resource?.currency_id
              ?? "BRL"
            ),
            dados_gateway: {
              ...(existingSub.dados_gateway || {}),
              type,
              action,
              payment_status: resource?.status ?? null,
              subscription_status: subscription?.status ?? null,
              payment_id: String(resource?.id ?? dataId ?? ""),
              activated_from: "payment_webhook",
            },
          })
          .eq("id", existingSub.id);

        if (directUpdateError) throw directUpdateError;

        const { error: planError } = await admin
          .from("radar_config")
          .upsert(
            { user_id: refInfo.userId, plano_atual: refInfo.plan },
            { onConflict: "user_id" },
          );
        if (planError) throw planError;

        console.log("MP_PAYMENT_MATCHED_SUBSCRIPTION", JSON.stringify({
          userId: refInfo.userId,
          plan: refInfo.plan,
          subscriptionId,
          paymentId: String(resource?.id ?? dataId ?? ""),
        }));
      }
    }

    if (pixInfo && isApprovedPayment) {
      const paymentId = String(resource?.id ?? dataId ?? "").trim();
      if (!paymentId) throw new Error("pix_payment_id_missing");

      const approvedAt = resource?.date_approved
        ?? resource?.date_last_updated
        ?? resource?.date_created
        ?? new Date().toISOString();

      const { data: previousPix } = await admin
        .from("assinaturas")
        .select("valido_ate")
        .eq("user_id", pixInfo.userId)
        .eq("ambiente", configuredEnvironment)
        .like("mercadopago_subscription_id", "pix:%")
        .gt("valido_ate", new Date().toISOString())
        .order("valido_ate", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nowMs = Date.now();
      const previousMs = previousPix?.valido_ate ? new Date(previousPix.valido_ate).getTime() : 0;
      const baseMs = Math.max(nowMs, Number.isFinite(previousMs) ? previousMs : 0);
      const validUntil = new Date(baseMs + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: pixUpsertError } = await admin.from("assinaturas").upsert({
        user_id: pixInfo.userId,
        plano: pixInfo.plan,
        gateway: "mercado_pago_pix",
        ambiente: configuredEnvironment,
        mercadopago_subscription_id: `pix:${paymentId}`,
        mercadopago_plan_id: null,
        external_reference: String(rawReference ?? ""),
        payer_email: resource?.payer?.email ?? null,
        status: "cancelled",
        valor: Number(resource?.transaction_amount ?? resource?.transaction_details?.total_paid_amount ?? 0) || null,
        currency_id: String(resource?.currency_id ?? "BRL"),
        proxima_cobranca: null,
        ultimo_pagamento_em: approvedAt,
        valido_ate: validUntil,
        cancelada_em: approvedAt,
        dados_gateway: {
          type,
          action,
          payment_status: resource?.status ?? null,
          payment_id: paymentId,
          payment_method_id: resource?.payment_method_id ?? "pix",
          access_model: "manual_pix_30_days",
          checkout_id: pixInfo.checkoutId,
        },
      }, { onConflict: "ambiente,mercadopago_subscription_id" });
      if (pixUpsertError) throw pixUpsertError;

      const { error: pixPlanError } = await admin.from("radar_config").upsert(
        { user_id: pixInfo.userId, plano_atual: pixInfo.plan },
        { onConflict: "user_id" },
      );
      if (pixPlanError) throw pixPlanError;

      console.log("MP_PIX_PLAN_ACTIVATED", JSON.stringify({
        userId: pixInfo.userId,
        plan: pixInfo.plan,
        paymentId,
        validUntil,
      }));
    }

    if (upgradeInfo && isApprovedPayment) {
      const paymentId = String(resource?.id ?? dataId ?? "").trim();
      const { data: upgradeRow, error: upgradeLookupError } = await admin
        .from("pagamentos_upgrade")
        .select("*")
        .eq("user_id", upgradeInfo.userId)
        .eq("ambiente", configuredEnvironment)
        .eq("external_reference", String(rawReference ?? ""))
        .in("status", ["pending","approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (upgradeLookupError) throw upgradeLookupError;

      if (upgradeRow && upgradeRow.status !== "approved") {
        const { data: targetPlan, error: planLookupError } = await admin
          .from("planos_catalogo")
          .select("slug,nome,preco_mensal")
          .eq("slug", upgradeInfo.plan)
          .eq("ativo", true)
          .single();
        if (planLookupError || !targetPlan) throw planLookupError ?? new Error("upgrade_plan_not_found");

        const subscriptionId = String(upgradeRow.current_subscription_id ?? "").trim();
        if (!subscriptionId) throw new Error("upgrade_subscription_missing");

        const newReference = `radar:${upgradeInfo.userId}:${upgradeInfo.plan}`;
        const changed = await mpPut(
          `/preapproval/${encodeURIComponent(subscriptionId)}`,
          accessToken,
          {
            reason: `Radar do Brique - Plano ${targetPlan.nome}`,
            external_reference: newReference,
            auto_recurring: {
              transaction_amount: Number(targetPlan.preco_mensal),
              currency_id: "BRL",
            },
          },
        );

        if (!changed.response.ok) {
          console.error("MP_UPGRADE_SUBSCRIPTION_UPDATE_ERROR", changed.response.status, JSON.stringify(changed.raw));
          throw new Error(changed.raw?.message || "upgrade_subscription_update_failed");
        }

        const { data: currentSub } = await admin
          .from("assinaturas")
          .select("id,dados_gateway")
          .eq("user_id", upgradeInfo.userId)
          .eq("ambiente", configuredEnvironment)
          .eq("mercadopago_subscription_id", subscriptionId)
          .maybeSingle();

        if (!currentSub?.id) throw new Error("upgrade_subscription_row_not_found");

        const { error: subUpdateError } = await admin
          .from("assinaturas")
          .update({
            plano: upgradeInfo.plan,
            external_reference: newReference,
            valor: Number(targetPlan.preco_mensal),
            status: String(changed.raw?.status ?? "authorized"),
            proxima_cobranca: changed.raw?.next_payment_date ?? null,
            valido_ate: changed.raw?.next_payment_date ?? null,
            dados_gateway: {
              ...(currentSub.dados_gateway || {}),
              upgraded_from: upgradeRow.from_plan,
              upgraded_to: upgradeInfo.plan,
              upgrade_payment_id: paymentId,
              upgrade_paid_amount: Number(resource?.transaction_amount ?? upgradeRow.valor ?? 0),
              upgrade_approved_at: new Date().toISOString(),
            },
          })
          .eq("id", currentSub.id);
        if (subUpdateError) throw subUpdateError;

        const { error: radarUpdateError } = await admin
          .from("radar_config")
          .upsert(
            { user_id: upgradeInfo.userId, plano_atual: upgradeInfo.plan },
            { onConflict: "user_id" },
          );
        if (radarUpdateError) throw radarUpdateError;

        const { error: upgradeUpdateError } = await admin
          .from("pagamentos_upgrade")
          .update({
            status: "approved",
            gateway_payment_id: paymentId || null,
            payload: {
              ...(upgradeRow.payload || {}),
              approved_at: new Date().toISOString(),
              payment_status: resource?.status ?? null,
              subscription_status: changed.raw?.status ?? null,
            },
          })
          .eq("id", upgradeRow.id);
        if (upgradeUpdateError) throw upgradeUpdateError;

        console.log("MP_UPGRADE_ACTIVATED", JSON.stringify({
          userId: upgradeInfo.userId,
          fromPlan: upgradeRow.from_plan,
          toPlan: upgradeInfo.plan,
          subscriptionId,
          paymentId,
        }));
      }
    }

    if (extraInfo && isApprovedPayment) {
      const environment = configuredEnvironment;
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
        ambiente: configuredEnvironment,
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
