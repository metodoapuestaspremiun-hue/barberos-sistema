// filepath: src/app/(panel)/panel/clientes/page.tsx
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import PanelHero from "@/components/redesign/PanelHero";
import MetricTile from "@/components/redesign/MetricTile";
import ClientesTabs from "@/components/panel/ClientesTabs";
import ExportDataButton from "@/components/panel/ExportDataButton";
import CustomerRegistrationQRCard from "@/components/panel/CustomerRegistrationQRCard";
import { getTenantTerms } from "@/lib/tenant-dictionary";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await verifySession();
  const barbershopId = session.barbershopId;
  const isPremium = await isPremiumBarbershop(barbershopId);
  const { tab } = await searchParams;

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
  });

  // Obtener todos los PERFILES con datos completos
  const profiles = await prisma.customerProfile.findMany({
    where: { barbershopId, isActive: true },
    include: {
      customer: true, // Para obtener el whatsapp y cutsCount de la cuenta
    },
    orderBy: { createdAt: "desc" },
  });

  const profileIds = profiles.map((p) => p.id);

  // Obtener el equipo de la barbería para mapear los nombres de los profesionales
  const staffList = await prisma.barberStaff.findMany({
    where: { barbershopId },
    select: { id: true, name: true },
  });
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));

  // Obtener historial de redenciones y transferencias de la barbería
  const redemptions = await prisma.loyaltyRedemption.findMany({
    where: { barbershopId },
    orderBy: { redeemedAt: "desc" },
  });

  const transfers = await prisma.cutTransfer.findMany({
    where: { barbershopId },
    orderBy: { createdAt: "desc" },
  });

  // Obtener todas las visitas aprobadas de la barbería
  const allVisits = await prisma.barberVisit.findMany({
    where: {
      barbershopId,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Enriquecer cada PERFIL con sus estadísticas e historial detallado de visitas
  const enrichedProfiles = profiles.map((profile) => {
    const visits = allVisits.filter((v) => v.profileId === profile.id);
    const approvedVisits = visits.filter((v) => v.status === "APPROVED");
    const ratedVisits = approvedVisits.filter((v) => v.rating !== null);
    const avgRating =
      ratedVisits.length > 0
        ? ratedVisits.reduce((acc, v) => acc + (v.rating ?? 0), 0) / ratedVisits.length
        : null;

    const lastVisit = approvedVisits[0] ?? null;
    const isNewThisMonth =
      lastVisit !== null && lastVisit.createdAt >= startOfMonth;

    // Loyalty logic
    const activeCutsCount =
      barbershop?.loyaltyMode === "BY_ACCOUNT"
        ? profile.customer.cutsCount
        : profile.cutsCount;
    const isRecurrent = activeCutsCount >= 2;

    const profileRedemptions = redemptions
      .filter((r) => r.profileId === profile.id)
      .map((r) => ({
        id: r.id,
        cutsAtRedemption: r.cutsAtRedemption,
        redeemedAt: r.redeemedAt.toISOString(),
      }));

    const profileTransfersGiven = transfers
      .filter((t) => t.fromProfileId === profile.id)
      .map((t) => ({
        id: t.id,
        toProfileId: t.toProfileId,
        createdAt: t.createdAt.toISOString(),
      }));

    const profileTransfersReceived = transfers
      .filter((t) => t.toProfileId === profile.id)
      .map((t) => ({
        id: t.id,
        fromProfileId: t.fromProfileId,
        createdAt: t.createdAt.toISOString(),
      }));

    const history = visits.map((v) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      status: v.status,
      rating: v.rating,
      comment: v.comment,
      staffName: v.staffId ? staffMap.get(v.staffId) || "Profesional no encontrado" : null,
    }));

    return {
      id: profile.id,
      whatsapp: profile.customer.whatsapp,
      name: profile.name,
      customerName: profile.customer.name,
      cutsCount: activeCutsCount,
      avgRating,
      sessionState: profile.customer.sessionState,
      lastVisitAt: lastVisit?.createdAt ?? null,
      isNewThisMonth,
      isRecurrent,
      totalVisits: approvedVisits.length,
      history,
      redemptions: profileRedemptions,
      transfersGiven: profileTransfersGiven,
      transfersReceived: profileTransfersReceived,
    };
  });

  // Agrupar todas las visitas de Consumidor Final (CF) en una única entrada consolidada
  const cfVisits = allVisits.filter((v) => !v.customerId || !v.profileId);
  if (cfVisits.length > 0) {
    const lastCfVisit = cfVisits[0];
    enrichedProfiles.unshift({
      id: "cf-profile-synthetic",
      whatsapp: "CF",
      name: "Consumidor Final (CF)",
      customerName: "Consumidor Final (CF)",
      cutsCount: cfVisits.length,
      avgRating: null,
      sessionState: "CF",
      lastVisitAt: lastCfVisit.createdAt,
      isNewThisMonth: false,
      isRecurrent: false,
      totalVisits: cfVisits.length,
      history: cfVisits.map((v) => ({
        id: v.id,
        createdAt: v.createdAt.toISOString(),
        status: v.status,
        rating: v.rating,
        comment: v.comment,
        staffName: v.staffId ? staffMap.get(v.staffId) || "Sin asignar" : "Sin asignar",
      })),
      redemptions: [],
      transfersGiven: [],
      transfersReceived: [],
    });
  }

  const requiredCuts = barbershop?.requiredCuts ?? 5;

  const totalProfiles = enrichedProfiles.length;
  const recurrentProfiles = enrichedProfiles.filter((p) => p.isRecurrent).length;
  const newThisMonth = enrichedProfiles.filter((p) => p.isNewThisMonth).length;

  const terms = getTenantTerms(barbershop?.vertical);
  const isGabinete = (barbershop?.vertical || "").toUpperCase() === "GABINETE" || (barbershop?.vertical || "").toUpperCase() === "SALON";
  const accentOv = isGabinete ? terms.accentColor : undefined;

  const heroImage = isGabinete
    ? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=80"
    : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* HERO */}
      <PanelHero
        imageUrl={heroImage}
        imagePosition="center 35%"
        eyebrow="Tu Base Viva"
        badge={
          <span className="bg-[#f3ece1]/10 text-[#f3ece1] border border-[#f3ece1]/20 px-2 py-0.5 text-[9px] font-mono rounded-full uppercase tracking-[0.2em]">
            {totalProfiles} Perfiles
          </span>
        }
        title="Clientes"
        subtitle="Base de clientes, fidelización e historial de visitas."
        action={
          isPremium && <ExportDataButton variant="compact" />
        }
        minHeight={260}
      />

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Total Perfiles"
          value={totalProfiles}
          caption="Clientes en tu base"
          icon="◐"
          accent="orange"
          accentOverride={accentOv}
        />
        <MetricTile
          label="Recurrentes"
          value={recurrentProfiles}
          caption={`2+ ${terms.rewardUnitPlural} realizados`}
          icon="↻"
          accent="amber"
          accentOverride={accentOv}
        />
        <MetricTile
          label="Nuevos del Mes"
          value={newThisMonth}
          caption={`Primer ${terms.rewardUnitSingular} este mes`}
          icon="✦"
          accent="green"
        />
      </div>

      {/* TARJETA QR DE REGISTRO DE CLIENTES */}
      <CustomerRegistrationQRCard
        barbershopId={barbershopId}
        barbershopName={barbershop?.name || "Tu Negocio"}
        vertical={barbershop?.vertical}
      />

      {/* TABS DE CLIENTES */}
      <ClientesTabs
        customers={enrichedProfiles}
        initialTab={tab ?? "todos"}
        requiredCuts={requiredCuts}
        loyaltyMode={barbershop?.loyaltyMode ?? "BY_PROFILE"}
        vertical={barbershop?.vertical}
      />
    </div>
  );
}