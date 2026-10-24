import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeWhatsapp } from "@/lib/phone";
import { checkDbRateLimit } from "@/lib/rate-limit";
import {
  createEvolutionInstance,
  configureEvolutionWebhook,
} from "@/lib/evolution";

// Constante única del trial — mantenida alineada con la promesa de /precios (15 días).
const TRIAL_DAYS = 15;

const PublicCreateSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(80),
  whatsappNumber: z.string().min(8, "WhatsApp inválido"),
  requiredCuts: z.number().int().min(1).max(50).default(5),
  ownerPhone: z.string().optional().nullable(),
  googleMapsUrl: z.string().optional().nullable(),
});

/**
 * POST /api/public/crear-barbershop
 *
 * Endpoint público para auto-registro de barberías con 15 días de prueba.
 * - Rate-limit por IP: 5 intentos / hora (protege contra bots sin molestar a usuarios reales).
 * - Plan forzado a PRO + planStatus "TRIAL".
 * - trialEndsAt = ahora + 15 días.
 * - Crea instancia Evolution automáticamente para que el dueño pueda conectar WhatsApp al instante.
 * - Devuelve el PIN de acceso al cliente (sin enviar a nadie más).
 */
export async function POST(request: NextRequest) {
  // 1. Rate-limit por IP (5/hora — holgado para usuarios reales, agresivo contra bots)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rl = await checkDbRateLimit({
    key: `public-create-shop:ip:${ip}`,
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hora
  });

  if (!rl.success) {
    return NextResponse.json(
      {
        error: "Demasiados intentos desde tu conexión. Intenta de nuevo en una hora.",
      },
      { status: 429 }
    );
  }

  try {
    // 2. Validar body
    const body = await request.json();
    const parsed = PublicCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const whatsapp = normalizeWhatsapp(data.whatsappNumber);

    // 3. Verificar que el WhatsApp no exista ya (unique constraint)
    const existing = await prisma.barbershop.findUnique({
      where: { whatsappNumber: whatsapp },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Este número de WhatsApp ya tiene una barbería registrada. Si la creaste antes, ingresa con tu PIN en /login.",
        },
        { status: 409 }
      );
    }

    // 4. Crear instancia Evolution API (mismo flujo que el SuperAdmin)
    const evolutionInstanceName = `barber_${whatsapp}`;
    const instanceCreated = await createEvolutionInstance(evolutionInstanceName);

    if (!instanceCreated) {
      return NextResponse.json(
        {
          error:
            "No pudimos inicializar WhatsApp en este momento. Intenta de nuevo en unos minutos.",
        },
        { status: 500 }
      );
    }

    // 5. Configurar webhook
    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const webhookUrl = isLocal
      ? "https://www.barberosplus.com/api/webhook/whatsapp"
      : `https://${host}/api/webhook/whatsapp`;
    await configureEvolutionWebhook(evolutionInstanceName, webhookUrl);

    // 6. Calcular trial (15 días)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    // 7. Generar PIN único de 6 dígitos (reintentar si choca con uno existente)
    let loginPin = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      const taken = await prisma.barbershop.findFirst({
        where: { loginPin: candidate },
        select: { id: true },
      });
      if (!taken) {
        loginPin = candidate;
        break;
      }
    }
    if (!loginPin) {
      // Fallback extremo: timestamp-based
      loginPin = Date.now().toString().slice(-6);
    }

    // 8. Crear barbería
    const barbershop = await prisma.barbershop.create({
      data: {
        name: data.name.trim(),
        whatsappNumber: whatsapp,
        evolutionInstance: evolutionInstanceName,
        evolutionApiKey: "",
        requiredCuts: data.requiredCuts ?? 5,
        googleMapsUrl: data.googleMapsUrl?.trim() || null,
        ownerPhone: data.ownerPhone?.trim() || null,
        planStatus: "TRIAL",
        planType: "PRO",
        trialEndsAt,
        connectionStatus: "DISCONNECTED",
        loginPin,
      },
      select: {
        id: true,
        name: true,
        whatsappNumber: true,
        loginPin: true,
        trialEndsAt: true,
      },
    });

    // 9. Webhook a barberosplus.com (best-effort, igual que el admin)
    if (data.name && whatsapp) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(
          process.env.BARBEROSPLUS_WEBHOOK_URL ||
            "https://barberosplus.com/api/webhook/new-barbershop",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REFERRAL_WEBHOOK_KEY || "",
            },
            body: JSON.stringify({
              event: "barbershop_created",
              barbershop: {
                name: data.name,
                phoneBusiness: whatsapp,
                phonePersonal: data.ownerPhone || null,
                plan: "PRO",
                source: "public_signup",
              },
              timestamp: new Date().toISOString(),
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
      } catch (error) {
        console.error("[public signup] Webhook barberosplus falló (no bloquea):", error);
      }
    }

    return NextResponse.json(barbershop, { status: 201 });
  } catch (error) {
    console.error("[public signup POST] Error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "El número de WhatsApp ya está registrado." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 }
    );
  }
}