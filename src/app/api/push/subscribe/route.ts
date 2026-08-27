import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configurar credenciales VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:soporte@barberosoftware.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barbershopId, subscription } = body;

    if (!barbershopId || !subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Suscripción incompleta." }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    if (!keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: "Llaves criptográficas de push no provistas." }, { status: 400 });
    }

    // Verificar si ya existe esta suscripción
    const existingSub = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    const isNewSubscription = !existingSub;

    // Almacenar o actualizar la suscripción del dispositivo
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        barbershopId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        barbershopId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    // Enviar notificación Push de bienvenida SOLO cuando es una suscripción nueva
    if (isNewSubscription) {
      try {
        const welcomePayload = JSON.stringify({
          title: "🔔 Alertas Activadas",
          body: "¡Listo! Recibirás una notificación al instante cuando un cliente pida registrar su visita o check-in.",
          url: "/panel",
        });

        await webpush.sendNotification(
          {
            endpoint,
            keys: {
              p256dh: keys.p256dh,
              auth: keys.auth,
            },
          },
          welcomePayload
        );
      } catch (pushErr) {
        console.error("[WebPush] Error al enviar notificación de bienvenida:", pushErr);
      }
    }

    return NextResponse.json({ success: true, message: "Dispositivo suscrito a notificaciones push." });
  } catch (error) {
    console.error("[Subscribe Push API] Error:", error);
    return NextResponse.json({ error: "Error interno al guardar la suscripción push." }, { status: 500 });
  }
}
