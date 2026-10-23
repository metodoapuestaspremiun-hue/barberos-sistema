/**
 * fix-webhooks.mjs
 * =====================================================================
 * Diagnostica y repara TODOS los webhooks de instancias barber_* en
 * Evolution API, apuntándolos al dominio correcto de producción.
 *
 * Problemas encontrados:
 * 1. Los webhooks apuntan a "barberos-teal.vercel.app" (URL vieja).
 *    El dominio real de producción es "www.barberosplus.com".
 * 2. webhookByEvents=false → Evolution no manda el campo "event" en el
 *    payload, así que payload.event siempre es undefined y el handler
 *    ignora TODOS los mensajes.
 *
 * Uso:
 *   node scripts/fix-webhooks.mjs [--dry-run] [--instance barber_xxx]
 */

const EVOLUTION_API_URL = "http://178.238.238.158:8080";
const EVOLUTION_API_KEY = "42a447c1-3d74-4b52-9571-042c174f7621";
const CORRECT_WEBHOOK_URL = "https://www.barberosplus.com/api/webhook/whatsapp";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SINGLE = args.includes("--instance") ? args[args.indexOf("--instance") + 1] : null;

const headers = {
  apikey: EVOLUTION_API_KEY,
  "Content-Type": "application/json",
};

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function getWebhook(instance) {
  try {
    return await fetchJSON(`${EVOLUTION_API_URL}/webhook/find/${instance}`);
  } catch (e) {
    return null;
  }
}

async function setWebhook(instance) {
  return await fetchJSON(`${EVOLUTION_API_URL}/webhook/set/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: CORRECT_WEBHOOK_URL,
        webhookByEvents: true,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("BarberOS – Reparacion de Webhooks Evolution API");
  console.log(`Dominio correcto: ${CORRECT_WEBHOOK_URL}`);
  console.log(`Modo: ${DRY_RUN ? "DRY-RUN (solo diagnostico)" : "REPARACION REAL"}`);
  console.log("=".repeat(60));

  let instances;
  try {
    instances = await fetchJSON(`${EVOLUTION_API_URL}/instance/fetchInstances`);
  } catch (e) {
    console.error("No se pudo conectar a Evolution API:", e.message);
    process.exit(1);
  }

  const targets = SINGLE
    ? instances.filter((i) => i.name === SINGLE)
    : instances.filter((i) => i.name.startsWith("barber_"));

  if (targets.length === 0) {
    console.log("No se encontraron instancias objetivo.");
    process.exit(0);
  }

  console.log(`\nInstancias a procesar: ${targets.length}\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let failed = 0;

  for (const inst of targets) {
    const name = inst.name;
    const status = inst.connectionStatus;
    process.stdout.write(`  ${name} [${status}] -> `);

    const current = await getWebhook(name);
    const currentUrl = current?.url || "(sin webhook)";
    const byEvents = current?.webhookByEvents;
    const isCorrectUrl = currentUrl === CORRECT_WEBHOOK_URL;
    const isCorrectByEvents = byEvents === true;

    if (isCorrectUrl && isCorrectByEvents) {
      console.log(`OK (${currentUrl})`);
      alreadyOk++;
      continue;
    }

    const issues = [];
    if (!isCorrectUrl) issues.push(`URL incorrecta: "${currentUrl}"`);
    if (!isCorrectByEvents) issues.push(`webhookByEvents=${byEvents} (debe ser true)`);
    process.stdout.write(`PROBLEMA: ${issues.join(" | ")} `);

    if (DRY_RUN) {
      console.log("-> [DRY-RUN, sin cambios]");
      failed++;
      continue;
    }

    try {
      await setWebhook(name);
      console.log(`-> REPARADO`);
      fixed++;
    } catch (e) {
      console.log(`-> ERROR: ${e.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("RESUMEN:");
  console.log(`  Ya correctos: ${alreadyOk}`);
  console.log(`  Reparados:    ${fixed}`);
  console.log(`  Con error:    ${failed}`);
  console.log("=".repeat(60));

  console.log("\nVerificacion post-reparacion (barber_593963410409):");
  const check = await getWebhook("barber_593963410409");
  console.log(JSON.stringify(check, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
