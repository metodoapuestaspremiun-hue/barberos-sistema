// filepath: src/components/panel/DashboardClient.tsx
"use client";

import { useState, type ReactNode } from "react";
import PanelHero from "@/components/redesign/PanelHero";
import SectionTabs, { type SectionTab } from "@/components/redesign/SectionTabs";
import MetricTile from "@/components/redesign/MetricTile";
import GlassCard from "@/components/redesign/GlassCard";
import ProgressRing from "@/components/redesign/ProgressRing";
import TabsCarousel from "@/components/redesign/TabsCarousel";
import RegisterVisitButton from "@/components/RegisterVisitButton";
import ExportDataButton from "@/components/panel/ExportDataButton";
import ApprovalQueue from "@/components/ApprovalQueue";
import DirectorWidget from "@/components/panel/DirectorWidget";
import { getTenantTerms } from "@/lib/tenant-dictionary";

export interface DashboardClientProps {
  barbershopId: string;
  barbershopName: string;
  vertical?: string | null;
  isPremium: boolean;
  healthScore: number;
  healthStatus: string;
  healthDot: string;
  healthMessage: string;
  avgRating: number;
  totalRatings: number;
  ratingsThisMonth: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  retentionRate: number;
  recurrentCustomers: number;
  overdueCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
    metrics: { status: string; daysSinceLastVisit: number; avgIntervalDays: number };
  }>;
  preCutCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
    metrics: { status: string; daysSinceLastVisit: number; avgIntervalDays: number };
  }>;
  vipCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
  }>;
  recentVisits: Array<{
    id: string;
    customerName: string;
    customerWhatsapp: string;
    cutsCount: number;
    status: string;
    rating: number | null;
    createdAt: string | Date;
  }>;
  /** Widget premium server-rendered (Motor de Conocimiento). */
  motorWidget?: ReactNode;
}

type TabId = "reputacion" | "clientes" | "retencion" | "recupera";

export default function DashboardClient({
  barbershopId,
  barbershopName,
  vertical,
  isPremium,
  healthScore,
  healthStatus,
  healthDot,
  healthMessage,
  avgRating,
  totalRatings,
  ratingsThisMonth,
  totalCustomers,
  newCustomersThisMonth,
  retentionRate,
  recurrentCustomers,
  overdueCustomers,
  preCutCustomers,
  vipCustomers,
  recentVisits,
  motorWidget,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("reputacion");
  const terms = getTenantTerms(vertical);

  const isGabinete = (vertical || "").toUpperCase() === "GABINETE" || (vertical || "").toUpperCase() === "SALON";

  const heroImages: Record<TabId, { url: string; position: string }> = {
    reputacion: {
      url: isGabinete
        ? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80"
        : "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80",
      position: "center",
    },
    clientes: {
      url: isGabinete
        ? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=80"
        : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80",
      position: "center",
    },
    retencion: {
      url: isGabinete
        ? "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1600&q=80"
        : "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=80",
      position: "center 30%",
    },
    recupera: {
      url: isGabinete
        ? "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1600&q=80"
        : "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1600&q=80",
      position: "center",
    },
  };

  const customersToRecover = [...overdueCustomers, ...preCutCustomers];

  const tabs: SectionTab[] = [
    { id: "reputacion", label: "Reputación", icon: "★", badge: avgRating.toFixed(1) },
    { id: "clientes", label: "Clientes", icon: "◐", badge: totalCustomers },
    { id: "retencion", label: "Retención", icon: "↻", badge: `${retentionRate}%` },
    { id: "recupera", label: "Recupera", icon: "⚠", badge: customersToRecover.length },
  ];

  const heroImage = heroImages[activeTab];

  // Override de color para MetricTiles cuando es Gabinete
  const accentOv = isGabinete ? terms.accentColor : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* HERO PRINCIPAL CON TABS DENTRO */}
      <PanelHero
        imageUrl={heroImage.url}
        imagePosition={heroImage.position}
        minHeight={360}
        eyebrow="Espejo del Negocio"
        badge={
          isPremium && (
            <span className="bg-[#d97644]/15 text-[#d97644] border border-[#d97644]/30 px-2 py-0.5 text-[9px] font-mono rounded-full uppercase tracking-[0.2em]">
              Plan Premium
            </span>
          )
        }
        title={barbershopName}
        subtitle={healthMessage}
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* BLOQUE DE SALUD — anillo + estado en una glass card más espaciosa.
                El anillo ahora es 112px (antes 86) para que "/100" quepa
                sin chocar contra el stroke. */}
            <div className="flex items-center gap-4 bg-[#1a1614]/65 border border-[#3a2f25]/80 backdrop-blur-md rounded-2xl px-5 py-4">
              <ProgressRing
                value={healthScore}
                label={String(healthScore)}
                suffix="/100"
                size={112}
                stroke={9}
                color={terms.accentColor}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-display text-xl text-[#f3ece1]">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${healthDot}`} />
                  <span className="truncate">{healthStatus}</span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#a89e90] mt-1">
                  Salud del Negocio
                </p>
              </div>
            </div>
            <RegisterVisitButton barbershopId={barbershopId} vertical={vertical} />
          </div>
        }
        overlay={
          // Wrapper con scroll horizontal en móvil + indicador visual de "desliza"
          // - En móvil (< md): scroll horizontal con snap, flecha pulsante y
          //   gradiente negro en el borde derecho que se desvanece al scrollear.
          // - En desktop (≥ md): tabs centrados a la izquierda, sin flecha.
          <TabsCarousel>
            <SectionTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              variant="pill"
              accentColor={terms.accentColor}
            />
          </TabsCarousel>
        }
      />

      {/* CONTENIDO DE LA TAB ACTIVA */}
      {activeTab === "reputacion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Calificación"
              value={avgRating.toFixed(1)}
              caption={`${totalRatings} reseñas registradas`}
              icon="★"
              accent="amber"
              accentOverride={accentOv}
              footer={
                <>
                  <span>↑</span>
                  <span>+{ratingsThisMonth} este mes</span>
                </>
              }
            />
            <MetricTile
              label="Reseñas"
              value={totalRatings}
              caption="Votos recibidos de clientes"
              icon="✎"
              accent="amber"
              accentOverride={accentOv}
            />
            <MetricTile
              label="Tendencia"
              value={ratingsThisMonth > 0 ? `+${ratingsThisMonth}` : "—"}
              caption="Reseñas nuevas este mes"
              icon="↗"
              accent={ratingsThisMonth > 0 ? "green" : "neutral"}
            />
          </div>
        </div>
      )}

      {activeTab === "clientes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Base Activa"
              value={totalCustomers}
              caption="Clientes en tu base"
              icon="◐"
              accent="orange"
              accentOverride={accentOv}
              href="/panel/clientes?tab=todos"
              footer={
                <>
                  <span>+</span>
                  <span>{newCustomersThisMonth} nuevos este mes</span>
                </>
              }
            />
            <MetricTile
              label="Nuevos del Mes"
              value={newCustomersThisMonth}
              caption={`Primer ${terms.rewardUnitSingular} este mes`}
              icon="✦"
              accent="green"
            />
            <MetricTile
              label="Recurrentes"
              value={recurrentCustomers}
              caption={`2+ ${terms.rewardUnitPlural} registrados`}
              icon="↻"
              accent="neutral"
              href="/panel/clientes?tab=recurrentes"
            />
          </div>

          {/* VIPs */}
          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light text-[#f3ece1] flex items-center gap-2">
                <span>⭐</span> Tus Mejores Clientes (VIPs)
              </h3>
              <span className="font-mono text-[10px] text-[#5c554c] uppercase tracking-wider">
                Top 5
              </span>
            </div>
            {vipCustomers.length === 0 ? (
              <p className="font-mono text-xs text-[#5c554c] italic">
                Aún no hay suficientes registros.
              </p>
            ) : (
              <div className="space-y-2">
                {vipCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="flex justify-between items-center p-3 bg-[#0a0807]/60 border border-[#2a2520] hover:border-[#3a2f25] transition-colors rounded-xl"
                  >
                    <div>
                      <p className="font-display text-sm text-[#f3ece1] font-light flex items-center gap-2">
                        {cust.name || "Cliente Registrado"}
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40 uppercase tracking-wider">
                          VIP
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-[#5c554c] mt-0.5">
                        {cust.cutsCount} visitas realizadas
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${cust.whatsapp}?text=${encodeURIComponent(
                        `¡Hola ${cust.name || ""}! Gracias por ser uno de nuestros clientes VIP en ${barbershopName}. Te esperamos pronto.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === "retencion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Tasa de Retención"
              value={`${retentionRate}%`}
              caption="Clientes que regresan"
              icon="↻"
              accent={retentionRate >= 50 ? "green" : "amber"}
              footer={
                <>
                  <span>●</span>
                  <span>{recurrentCustomers} recurrentes</span>
                </>
              }
            />
            <MetricTile
              label="Total Recurrentes"
              value={recurrentCustomers}
              caption="2+ cortes registrados"
              icon="✓"
              accent="green"
            />
            <MetricTile
              label="En Riesgo"
              value={overdueCustomers.length}
              caption="Excedieron 1.2x su patrón"
              icon="!"
              accent={overdueCustomers.length > 0 ? "amber" : "neutral"}
              href="/panel/clientes?tab=recurrentes"
            />
          </div>
        </div>
      )}

      {activeTab === "recupera" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="A Recuperar"
              value={customersToRecover.length}
              caption="Total fuera de patrón"
              icon="⚠"
              accent={customersToRecover.length > 0 ? "amber" : "neutral"}
            />
            <MetricTile
              label="1.2x Excedido"
              value={overdueCustomers.length}
              caption="Superaron su ciclo"
              icon="↘"
              accent="orange"
              accentOverride={accentOv}
            />
            <MetricTile
              label={`0.8x Pre-${terms.rewardUnitSingular}`}
              value={preCutCustomers.length}
              caption="Pronto a salir"
              icon="⏰"
              accent="amber"
              accentOverride={accentOv}
            />
          </div>

          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-light text-[#f3ece1] flex items-center gap-2">
                  <span className="text-amber-400">🚨</span> Clientes que te extrañan
                </h3>
                <p className="font-mono text-[9px] text-[#5c554c] uppercase tracking-widest mt-1">
                  Frecuencia Inteligente (0.8x / 1.2x)
                </p>
              </div>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider">
                PWA 8:00 AM
              </span>
            </div>

            {customersToRecover.length === 0 ? (
              <p className="font-mono text-xs text-emerald-400 italic">
                ¡Excelente! Todos tus clientes están dentro de su ciclo habitual de {terms.rewardUnitSingular}.
              </p>
            ) : (
              <div className="space-y-2">
                {customersToRecover.slice(0, 6).map((cust) => {
                  const isOverdue = cust.metrics.status === "OVERDUE";
                  const days = cust.metrics.daysSinceLastVisit || 0;
                  const pattern = cust.metrics.avgIntervalDays;

                  const msgText = isOverdue
                    ? `¡Hola ${cust.name || ""}! Te extrañamos en ${barbershopName}. Tu tiempo habitual de ${terms.rewardUnitSingular} es cada ${pattern} días y han pasado ${days} días. ¡Te esperamos para renovar tu estilo!`
                    : `¡Hola ${cust.name || ""}! En ${barbershopName} recordamos que ya casi se cumple tu ciclo habitual de ${terms.rewardUnitSingular} (hace ${days} días). ¿Te agendamos un espacio?`;

                  return (
                    <div
                      key={cust.id}
                      className="flex justify-between items-center p-3 bg-[#0a0807]/60 border border-[#2a2520] hover:border-[#3a2f25] transition-colors rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm text-[#f3ece1] font-light">
                            {cust.name || "Cliente Registrado"}
                          </p>
                          <span
                            className={[
                              "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider",
                              isOverdue
                                ? "bg-red-950/40 text-red-400 border-red-800"
                                : "bg-amber-950/40 text-amber-400 border-amber-800",
                            ].join(" ")}
                          >
                            {isOverdue ? "1.2x Excedido" : `0.8x Pre-${terms.rewardUnitSingular}`}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-[#5c554c] mt-0.5">
                          ⚠️ Hace {days}d (Patrón habitual: c/{pattern}d)
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${cust.whatsapp}?text=${encodeURIComponent(msgText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                          "font-mono text-[10px] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0 uppercase tracking-wider",
                          isOverdue
                            ? "text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800"
                            : "text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800",
                        ].join(" ")}
                      >
                        {isOverdue ? "📩 Invitar" : "⏰ Avisar"}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* COLA DE APROBACIONES (siempre visible) */}
      <ApprovalQueue barbershopId={barbershopId} />

      {/* DIRECTOR IA — EXCLUSIVO PARA PREMIUM */}
      {isPremium && <DirectorWidget />}

      {/* LIBRO DIARIO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-display text-xl sm:text-2xl font-light text-[#f3ece1]">
            Libro Diario{" "}
            <span className="text-[#5c554c] text-sm font-mono">/ Historial de Hoy</span>
          </h3>
          {isPremium && <ExportDataButton variant="compact" />}
        </div>

        {recentVisits.length === 0 ? (
          <GlassCard padding="lg">
            <p className="font-display italic text-lg text-[#5c554c] mb-2 text-center">
              No hay visitas registradas el día de hoy
            </p>
            <p className="font-mono text-[10px] text-[#5c554c] tracking-widest uppercase text-center">
              Usa el botón &quot;{terms.actionButtonText}&quot; arriba para añadir un registro manual.
            </p>
          </GlassCard>
        ) : (
          <GlassCard padding="sm" className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#a89e90]">
              <thead>
                <tr className="border-b border-[#3a2f25]/60 text-[#5c554c] uppercase">
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">WhatsApp</th>
                  <th className="py-3 px-3" style={{ textTransform: 'capitalize' }}>{terms.rewardUnitPlural}</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Calificación</th>
                  <th className="py-3 px-3 text-right">Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="border-b border-[#2a2520]/40 hover:bg-[#0a0807]/30 transition-colors"
                  >
                    <td className="py-3 px-3 font-display text-base text-[#f3ece1] font-light">
                      {visit.customerName}
                    </td>
                    <td className="py-3 px-3">+{visit.customerWhatsapp}</td>
                    <td className="py-3 px-3">{visit.cutsCount}</td>
                    <td className="py-3 px-3">
                      <span
                        className={[
                          "px-2 py-0.5 rounded-full text-[10px]",
                          visit.status === "APPROVED"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800"
                            : visit.status === "PENDING"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-800 animate-pulse"
                              : "bg-red-950/40 text-red-400 border border-red-800",
                        ].join(" ")}
                      >
                        {visit.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-400">
                      {visit.rating
                        ? "★".repeat(visit.rating) + "☆".repeat(5 - visit.rating)
                        : "Sin calificar"}
                    </td>
                    <td className="py-3 px-3 text-right text-[#5c554c]" suppressHydrationWarning>
                      {(() => {
                        const d = new Date(visit.createdAt);
                        const hh = String(d.getUTCHours() - 5).padStart(2, "0"); // EC = UTC-5
                        const mm = String(d.getUTCMinutes()).padStart(2, "0");
                        return `${hh}:${mm}`;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* MOTOR DE CONOCIMIENTO (PREMIUM) — al final como referencia histórica */}
      {motorWidget}
    </div>
  );
}