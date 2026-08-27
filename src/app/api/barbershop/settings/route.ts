import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  riskThresholdNormal: z.number().min(0.1).max(5).optional(),
  riskThresholdAt: z.number().min(0.2).max(10).optional(),
  loyaltyMode: z.enum(["BY_PROFILE", "BY_ACCOUNT"]).optional(),
  visitDurationMin: z.number().min(5).max(480).nullable().optional(),
  businessInfo: z.string().max(2000).nullable().optional(),
  requiredCuts: z.number().min(2).max(50).optional(),
  vertical: z.enum(["BARBERIA", "GABINETE", "SALON", "NEGOCIO"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const barbershopId = request.headers.get("x-barbershop-id");
    if (!barbershopId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    
    // Solo actualizar los campos que se han enviado
    const updateData: any = {};
    if (data.riskThresholdNormal !== undefined) updateData.riskThresholdNormal = data.riskThresholdNormal;
    if (data.riskThresholdAt !== undefined) updateData.riskThresholdAt = data.riskThresholdAt;
    if (data.loyaltyMode !== undefined) updateData.loyaltyMode = data.loyaltyMode;
    if (data.visitDurationMin !== undefined) updateData.visitDurationMin = data.visitDurationMin;
    if (data.businessInfo !== undefined) updateData.businessInfo = data.businessInfo;
    if (data.requiredCuts !== undefined) updateData.requiredCuts = data.requiredCuts;
    if (data.vertical !== undefined) updateData.vertical = data.vertical;

    const updated = await prisma.barbershop.update({
      where: { id: barbershopId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        riskThresholdNormal: updated.riskThresholdNormal,
        riskThresholdAt: updated.riskThresholdAt,
        loyaltyMode: updated.loyaltyMode,
        visitDurationMin: updated.visitDurationMin,
        businessInfo: updated.businessInfo,
        requiredCuts: updated.requiredCuts,
        vertical: updated.vertical,
      },
    });
  } catch (error) {
    console.error("[Barbershop Settings PATCH Error]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
