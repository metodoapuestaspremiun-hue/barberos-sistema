import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEvolutionInstanceDetails } from "@/lib/evolution";

export async function GET(request: NextRequest) {
  try {
    const barbershopId = request.headers.get("x-barbershop-id");
    if (!barbershopId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { evolutionInstance: true, connectionStatus: true, whatsappConnected: true, vertical: true },
    });

    if (!barbershop) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }

    // Consultar el estado real y el número conectado directo de Evolution API
    const realDetails = await getEvolutionInstanceDetails(barbershop.evolutionInstance);

    // Mapear estado al enum interno
    let internalStatus = "DISCONNECTED";
    if (realDetails.state === "open" || realDetails.state === "connected") {
      internalStatus = "CONNECTED";
    } else if (realDetails.state === "connecting" || realDetails.state === "qrcode") {
      internalStatus = "WAITING_QR";
    }

    const newConnectedPhone = realDetails.ownerPhone || (internalStatus === "CONNECTED" ? barbershop.whatsappConnected : null);

    // Sincronizar en DB si difiere el estado o el número conectado
    const shouldUpdateStatus = internalStatus !== barbershop.connectionStatus;
    const shouldUpdatePhone = newConnectedPhone && newConnectedPhone !== barbershop.whatsappConnected;

    if (shouldUpdateStatus || shouldUpdatePhone) {
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          connectionStatus: internalStatus,
          ...(newConnectedPhone ? { whatsappConnected: newConnectedPhone } : {}),
        },
      });
    }

    return NextResponse.json({
      status: internalStatus,
      whatsappConnected: newConnectedPhone || barbershop.whatsappConnected,
      barbershopId: barbershopId,
      vertical: barbershop.vertical,
    });
  } catch (error) {
    console.error("[GET /api/barbershop/status] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
