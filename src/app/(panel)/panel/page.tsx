// filepath: src/app/(panel)/panel/page.tsx
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import { calculateCustomerMetrics } from "@/lib/customer-intervals";
import DashboardClient from "@/components/panel/DashboardClient";
import MotorSummaryWidget from "@/components/panel/MotorSummaryWidget";
import { getTenantTerms } from "@/lib/tenant-dictionary";

export default async function DashboardPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;
  const isPremium = await isPremiumBarbershop(barbershopId);

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
  });

  if (!barbershop) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl text-[#d97644]">Error: Barbería no encontrada</h2>
      </div>
    );
  }

  const customers = await prisma.barberCustomer.findMany({
    where: { barbershopId },
    orderBy: { cutsCount: "desc" },
  });

  const allApprovedVisits = await prisma.barberVisit.findMany({
    where: {
      barbershopId,
      status: "APPROVED",
      customerId: { not: null },
    },
    select: {
      customerId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const customerVisitsMap = new Map<string, Date[]>();
  allApprovedVisits.forEach((v) => {
    if (v.customerId) {
      if (!customerVisitsMap.has(v.customerId)) customerVisitsMap.set(v.customerId, []);
      customerVisitsMap.get(v.customerId)!.push(new Date(v.createdAt));
    }
  });

  const customersWithMetrics = customers.map((cust) => {
    const dates = customerVisitsMap.get(cust.id) || [];
    const metrics = calculateCustomerMetrics(dates, cust.lastVisitAt);
    return {
      id: cust.id,
      name: cust.name,
      whatsapp: cust.whatsapp,
      cutsCount: cust.cutsCount,
      metrics: {
        status: metrics.status,
        daysSinceLastVisit: metrics.daysSinceLastVisit ?? 0,
        avgIntervalDays: metrics.avgIntervalDays ?? 0,
      },
    };
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.barberVisit.count({
    where: {
      barbershopId,
      status: "APPROVED",
      createdAt: { gte: startOfDay },
    },
  });

  const totalCustomers = customers.length;

  const newCustomersThisMonth = await prisma.barberCustomer.count({
    where: {
      barbershopId,
      lastVisitAt: { gte: startOfMonth },
    },
  });

  const recurrentCustomers = customers.filter((c) => c.cutsCount >= 2).length;
  const retentionRate =
    totalCustomers > 0 ? Math.round((recurrentCustomers / totalCustomers) * 100) : 0;

  const ratedVisits = await prisma.barberVisit.findMany({
    where: {
      barbershopId,
      status: "APPROVED",
      rating: { not: null },
    },
    select: { rating: true, createdAt: true },
  });

  const totalRatings = ratedVisits.length;
  const avgRating =
    totalRatings > 0
      ? ratedVisits.reduce((acc, v) => acc + (v.rating || 0), 0) / totalRatings
      : 5.0;

  const ratingsThisMonth = ratedVisits.filter((v) => new Date(v.createdAt) >= startOfMonth)
    .length;

  const overdueCustomers = customersWithMetrics.filter((c) => c.metrics.status === "OVERDUE");
  const preCutCustomers = customersWithMetrics.filter(
    (c) => c.metrics.status === "PRE_CUT_DUE",
  );

  // Score de Salud
  const repScore = (avgRating / 5) * 25;
  const retScore = (retentionRate / 100) * 30;
  const newScore = Math.min(newCustomersThisMonth / 10, 1) * 20;
  const inactiveRatio = totalCustomers > 0 ? overdueCustomers.length / totalCustomers : 0;
  const inactiveScore = Math.max(0, 15 - inactiveRatio * 30);
  const revScore = Math.min(totalRatings / 5, 1) * 10;

  const rawHealthScore = Math.round(repScore + retScore + newScore + inactiveScore + revScore);
  const healthScore = Math.min(100, Math.max(0, rawHealthScore));

  const terms = getTenantTerms(barbershop.vertical);

  let healthStatus = "Excelente";
  let healthDot = "bg-emerald-400";
  let healthMessage = "Retorno constante y clientes al día.";

  if (healthScore < 60) {
    healthStatus = "En Atención";
    healthDot = "bg-red-400";
    healthMessage = `${overdueCustomers.length} clientes fuera de su ciclo habitual.`;
  } else if (healthScore < 80) {
    healthStatus = "Estable";
    healthDot = "bg-amber-400";
    healthMessage = "Frecuencia estable con clientes por retornar.";
  }

  // VIPs
  const vipCustomers = customers.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    cutsCount: c.cutsCount,
  }));

  // Visitas recientes
  const recentVisitsData = await prisma.barberVisit.findMany({
    where: { barbershopId, createdAt: { gte: startOfDay } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentVisits = recentVisitsData.map((visit) => {
    const customer = visit.customerId ? customers.find((c) => c.id === visit.customerId) : null;
    return {
      id: visit.id,
      customerName: customer ? customer.name || "Cliente Registrado" : "Consumidor Final (CF)",
      customerWhatsapp: customer ? customer.whatsapp : "CF",
      cutsCount: customer ? customer.cutsCount : 1,
      status: visit.status,
      rating: visit.rating,
      createdAt: visit.createdAt.toISOString(),
    };
  });

  return (
    <DashboardClient
      barbershopId={barbershopId}
      barbershopName={barbershop.name}
      vertical={barbershop.vertical}
      isPremium={isPremium}
      healthScore={healthScore}
      healthStatus={healthStatus}
      healthDot={healthDot}
      healthMessage={healthMessage}
      avgRating={avgRating}
      totalRatings={totalRatings}
      ratingsThisMonth={ratingsThisMonth}
      totalCustomers={totalCustomers}
      newCustomersThisMonth={newCustomersThisMonth}
      retentionRate={retentionRate}
      recurrentCustomers={recurrentCustomers}
      overdueCustomers={overdueCustomers}
      preCutCustomers={preCutCustomers}
      vipCustomers={vipCustomers}
      recentVisits={recentVisits}
      motorWidget={<MotorSummaryWidget barbershopId={barbershopId} />}
    />
  );
}