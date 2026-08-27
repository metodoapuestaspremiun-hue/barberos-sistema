import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeWhatsapp } from "@/lib/phone";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SUPER_ADMIN_PASSWORD_LOCAL_TEST";

function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return false;
  }
  return true;
}

import { createEvolutionInstance, configureEvolutionWebhook, deleteEvolutionInstance } from "@/lib/evolution";

const CreateBarbershopSchema = z.object({
  name: z.string().min(1),
  whatsappNumber: z.string().min(1),
  requiredCuts: z.number().default(5),
  googleMapsUrl: z.string().optional(),
  salesAgent: z.string().optional(),
  ownerPhone: z.string().optional(),
  planType: z.enum(["PRO", "PREMIUM"]).default("PRO"),
  vertical: z.enum(["BARBERIA", "GABINETE", "SALON", "NEGOCIO"]).default("BARBERIA"),
});

// GET /api/admin/barbershops - Listar todas las barberías
export async function GET(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const barbershops = await prisma.barbershop.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(barbershops);
  } catch (error) {
    console.error("[Admin GET API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/barbershops - Crear barbería (14 días trial por defecto) + Creación dinámica de WhatsApp
export async function POST(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateBarbershopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const whatsapp = normalizeWhatsapp(data.whatsappNumber);

    // Nombre dinámico de la instancia basada en el nombre de la barbería
    const evolutionInstanceName = `barber_${whatsapp}`;

    // Intentar crear la instancia en Evolution API
    const instanceCreated = await createEvolutionInstance(evolutionInstanceName);
    if (!instanceCreated) {
      return NextResponse.json(
        { error: "No se pudo inicializar la instancia de WhatsApp en el servidor. Revisa credenciales de Evolution API." },
        { status: 500 }
      );
    }

    // Configurar webhook automático apuntando a producción
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "barberos-rho-henna.vercel.app";
    const webhookUrl = `${protocol}://${host}/api/webhook/whatsapp`;
    await configureEvolutionWebhook(evolutionInstanceName, webhookUrl);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días en el futuro

    // Generar un PIN aleatorio numérico único de 6 dígitos
    const loginPin = Math.floor(100000 + Math.random() * 900000).toString();

    const barbershop = await prisma.barbershop.create({
      data: {
        name: data.name,
        whatsappNumber: whatsapp,
        evolutionInstance: evolutionInstanceName,
        evolutionApiKey: "", // Se usará la global por defecto
        requiredCuts: data.requiredCuts,
        googleMapsUrl: data.googleMapsUrl || null,
        ownerPhone: data.ownerPhone || null,
        salesAgent: data.salesAgent?.trim() || null,
        planStatus: "TRIAL",
        planType: data.planType || "PRO",
        vertical: data.vertical || "BARBERIA",
        trialEndsAt,
        connectionStatus: "DISCONNECTED",
        loginPin,
      },
    });

    // Enviar webhook a barberosplus.com (SÍNCRONO - esperamos respuesta)
    let commissionData: {
      hasCommission: boolean;
      commissionStatus: string;
      referredByName: string | null;
      referredByCode: string | null;
    } = {
      hasCommission: false,
      commissionStatus: "PENDING",
      referredByName: null,
      referredByCode: null,
    };

    if (data.name && data.whatsappNumber) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

        const webhookResponse = await fetch(
          process.env.BARBEROSPLUS_WEBHOOK_URL || "https://barberosplus.com/api/webhook/new-barbershop",
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
                phoneBusiness: data.whatsappNumber,
                phonePersonal: data.ownerPhone || null,
                plan: data.planType || "PRO",
              },
              timestamp: new Date().toISOString(),
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (webhookResponse.ok) {
          const result = await webhookResponse.json();
          commissionData = {
            hasCommission: result.hasCommission === true,
            commissionStatus: result.hasCommission ? "CONFIRMED" : "NO_COMMISSION",
            referredByName: result.referredBy?.name || null,
            referredByCode: result.referredBy?.code || null,
          };
        }
      } catch (error) {
        console.error("[Webhook barberosplus] Error o timeout:", error);
        // commissionData queda en PENDING
      }
    }

    // Actualizar barbería con datos de comisión
    const updatedBarbershop = await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: {
        hasCommission: commissionData.hasCommission,
        commissionStatus: commissionData.commissionStatus,
        referredByName: commissionData.referredByName,
        referredByCode: commissionData.referredByCode,
      },
    });

    return NextResponse.json(updatedBarbershop, { status: 201 });
  } catch (error) {
    console.error("[Admin POST API] Error:", error);
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "El número de WhatsApp ya está registrado." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

const UpdateBarbershopSchema = z.object({
  barbershopId: z.string().min(1),
  planStatus: z.enum(["TRIAL", "ACTIVE", "SUSPENDED"]).optional(),
  planType: z.enum(["PRO", "PREMIUM"]).optional(),
  name: z.string().min(1).optional(),
  whatsappNumber: z.string().min(1).optional(),
  requiredCuts: z.number().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  salesAgent: z.string().nullable().optional(),
  vertical: z.enum(["BARBERIA", "GABINETE", "SALON", "NEGOCIO"]).optional(),
});

// PATCH /api/admin/barbershops - Cambiar planStatus/planType manualmente o editar datos de la barbería
export async function PATCH(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateBarbershopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { barbershopId, planStatus, planType, name, whatsappNumber, requiredCuts, googleMapsUrl, salesAgent, vertical } = parsed.data;

    // Construir data de actualización de forma dinámica
    const updateData: any = {};
    if (planStatus !== undefined) updateData.planStatus = planStatus;
    if (planType !== undefined) updateData.planType = planType;
    if (name !== undefined) updateData.name = name;
    if (requiredCuts !== undefined) updateData.requiredCuts = requiredCuts;
    if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl;
    if (salesAgent !== undefined) updateData.salesAgent = salesAgent;
    if (vertical !== undefined) updateData.vertical = vertical;
    
    if (whatsappNumber !== undefined) {
      updateData.whatsappNumber = normalizeWhatsapp(whatsappNumber);
    }

    const updated = await prisma.barbershop.update({
      where: { id: barbershopId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin PATCH API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/barbershops - Eliminar barbería + instancia Evolution
export async function DELETE(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const barbershopId = searchParams.get("id");

    if (!barbershopId) {
      return NextResponse.json({ error: "Se requiere el ID de la barbería" }, { status: 400 });
    }

    // Buscar la barbería para obtener la instancia de Evolution
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
    });

    if (!barbershop) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }

    // Eliminar la instancia de Evolution API
    await deleteEvolutionInstance(barbershop.evolutionInstance);

    // Obtener los IDs de clientes asociados a la barbería para borrar sus visitas
    const customers = await prisma.barberCustomer.findMany({
      where: { barbershopId },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    // Eliminar datos relacionados en orden
    await prisma.barberVisit.deleteMany({
      where: {
        customerId: {
          in: customerIds,
        },
      },
    });
    await prisma.barberCustomer.deleteMany({ where: { barbershopId } });
    await prisma.barberStaff.deleteMany({ where: { barbershopId } });
    await prisma.magicToken.deleteMany({ where: { barbershopId } });

    // Eliminar la barbería
    await prisma.barbershop.delete({ where: { id: barbershopId } });

    return NextResponse.json({ success: true, message: `Barbería "${barbershop.name}" eliminada correctamente.` });
  } catch (error) {
    console.error("[Admin DELETE API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

