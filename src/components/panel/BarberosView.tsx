"use client";

import { useState } from "react";
import DownloadQRButton from "@/components/DownloadQRButton";

import { getTenantTerms } from "@/lib/tenant-dictionary";

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerName: string;
  customerWhatsapp: string;
}

interface StaffStat {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
  avgRating: number;
  totalRatings: number;
  distribution: number[]; // [1★, 2★, 3★, 4★, 5★]
  reviews: ReviewItem[];
}

interface BarberosViewProps {
  generalAvg: number;
  generalCount: number;
  generalDistribution: number[];
  staffStats: StaffStat[];
  unassignedCount: number;
  whatsappNumber: string;
  currentBoxCode: string;
  vertical?: string | null;
}

function buildStaffQrUrl(whatsappNumber: string, boxCode: string, staffName: string) {
  const message = `Hola, mi código de caja es ${boxCode}. Me atendió ${staffName}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  )}`;
}

function StarDisplay({ rating, starColor = "#f59e0b" }: { rating: number; starColor?: string }) {
  return (
    <span style={{ color: starColor }} className="tracking-wider">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

function RatingBar({ stars, count, total, barColor = "#f59e0b" }: { stars: number; count: number; total: number; barColor?: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-[#5c554c] w-4 text-right">{stars}</span>
      <span style={{ color: barColor }}>★</span>
      <div className="flex-1 h-2 bg-[#1c1917] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-[#5c554c] w-8 text-right">{count}</span>
    </div>
  );
}

function StaffCard({
  staff,
  isSelected,
  onClick,
  qrUrl,
  accentColor,
  staffSingular,
  icon,
}: {
  staff: StaffStat;
  isSelected: boolean;
  onClick: () => void;
  qrUrl: string;
  accentColor: string;
  staffSingular: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      style={isSelected ? { borderColor: accentColor } : undefined}
      className={`w-full text-left p-4 sm:p-5 border transition-all duration-200 ${
        isSelected
          ? "bg-[#131110]"
          : "bg-[#0a0807] border-[#2a2520] hover:border-[#3a3530]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Foto rectangular */}
        <div className="w-16 h-20 bg-[#131110] border border-[#2a2520] shrink-0 overflow-hidden relative">
          {staff.photoUrl ? (
            <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl bg-[#131110]">
              {icon}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-display text-lg font-light text-[#f3ece1] truncate">{staff.name}</h4>
            {staff.totalRatings > 0 && (
              <span style={{ color: accentColor }} className="font-display text-2xl font-light ml-2">
                {staff.avgRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#5c554c] uppercase tracking-wider">
              {staff.role === "OWNER" ? "Dueño" : staffSingular}
            </span>
            {staff.totalRatings > 0 ? (
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={staff.avgRating} starColor={accentColor} />
                <span className="font-mono text-[10px] text-[#5c554c]">
                  ({staff.totalRatings})
                </span>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-[#5c554c] italic">
                Sin calificaciones
              </span>
            )}
          </div>
        </div>

        {/* QR mini */}
        <div className="shrink-0 bg-[#f3ece1] p-1 w-12 h-12 sm:w-14 sm:h-14">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url('${qrUrl}')`,
              backgroundSize: "cover",
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default function BarberosView({
  generalAvg,
  generalCount,
  generalDistribution,
  staffStats,
  unassignedCount,
  whatsappNumber,
  currentBoxCode,
  vertical,
}: BarberosViewProps) {
  const [selectedView, setSelectedView] = useState<"general" | string>("general");
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(10);
  const terms = getTenantTerms(vertical);
  const isGabinete = (vertical || "").toUpperCase() === "GABINETE" || (vertical || "").toUpperCase() === "SALON";
  const isNegocio = (vertical || "").toUpperCase() === "NEGOCIO";
  const icon = isGabinete ? "💅" : isNegocio ? "🏪" : "💈";

  const selectedStaff = selectedView !== "general"
    ? staffStats.find((s) => s.id === selectedView)
    : null;

  const currentAvg = selectedStaff ? selectedStaff.avgRating : generalAvg;
  const currentCount = selectedStaff ? selectedStaff.totalRatings : generalCount;
  const currentDistribution = selectedStaff ? selectedStaff.distribution : generalDistribution;

  const handleSelectTab = (view: string) => {
    setSelectedView(view);
    setVisibleReviewsCount(10);
  };

  const reviewsList = selectedStaff ? selectedStaff.reviews : [];
  const visibleReviews = reviewsList.slice(0, visibleReviewsCount);

  // QR General de Caja
  const generalQrUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://wa.me/${whatsappNumber}?text=Hola,%20mi%20código%20de%20caja%20es%20${currentBoxCode}`
      )}`
    : "";

  // Ordenar staff para Ranking
  const rankedStaff = [...staffStats].sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.totalRatings - a.totalRatings;
  });

  return (
    <div className="space-y-6">
      {/* QR General */}
      {selectedView === "general" && whatsappNumber && (
        <div className="bg-[#131110] border border-[#2a2520] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center sm:text-left">
            <span style={{ color: terms.accentColor }} className="font-mono text-[10px] tracking-[0.25em] uppercase">
              QR PRINCIPAL DE CAJA
            </span>
            <h3 className="font-display text-2xl font-light text-[#f3ece1]">
              QR General para Clientes
            </h3>
            <p className="font-mono text-xs text-[#5c554c]">
              Código activo: <strong style={{ color: terms.accentColor }} className="font-bold">{currentBoxCode}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="bg-[#f3ece1] p-2 w-24 h-24 sm:w-28 sm:h-28">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${generalQrUrl}')`,
                  backgroundSize: "cover",
                }}
              />
            </div>
            <DownloadQRButton qrUrl={generalQrUrl} barbershopName={terms.businessTypeName} />
          </div>
        </div>
      )}

      {/* Tabs superiores */}
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
        <button
          onClick={() => handleSelectTab("general")}
          style={selectedView === "general" ? { backgroundColor: terms.accentColor, borderColor: terms.accentColor, color: "#0a0807" } : undefined}
          className={`px-5 py-2 font-mono text-xs tracking-[0.2em] uppercase whitespace-nowrap border transition-colors ${
            selectedView === "general"
              ? "font-bold"
              : "bg-transparent text-[#5c554c] border-[#2a2520] hover:text-[#a89e90] hover:border-[#3a3530]"
          }`}
        >
          TODOS
        </button>
        {staffStats.map((staff) => (
          <button
            key={staff.id}
            onClick={() => handleSelectTab(staff.id)}
            style={selectedView === staff.id ? { backgroundColor: terms.accentColor, borderColor: terms.accentColor, color: "#0a0807" } : undefined}
            className={`px-5 py-2 font-mono text-xs tracking-[0.2em] uppercase whitespace-nowrap border transition-colors ${
              selectedView === staff.id
                ? "font-bold shadow-sm"
                : "bg-[#0a0807] text-[#5c554c] border-[#2a2520] hover:text-[#a89e90] hover:border-[#3a3530]"
            }`}
          >
            {staff.name}
          </button>
        ))}
      </div>

      {/* 🏆 RANKING DEL MES (Solo en vista General) */}
      {selectedView === "general" && rankedStaff.length > 0 && (
        <div className="bg-[#131110] border border-[#2a2520] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2520] pb-3">
            <h3 className="font-display text-xl font-light text-[#f3ece1] flex items-center gap-2">
              <span>🏆</span> Ranking del Mes
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rankedStaff.slice(0, 3).map((staff, idx) => {
              const medals = ["🥇 1º Lugar", "🥈 2º Lugar", "🥉 3º Lugar"];
              const borderColors = [
                "border-amber-500/60 bg-amber-950/20",
                "border-slate-400/60 bg-slate-900/20",
                "border-amber-700/60 bg-amber-950/10",
              ];

              return (
                <div
                  key={staff.id}
                  onClick={() => handleSelectTab(staff.id)}
                  className={`p-4 border ${borderColors[idx]} space-y-2 cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#f3ece1]">
                      {medals[idx]}
                    </span>
                    <span className="font-display text-xl font-light text-amber-400">
                      {staff.avgRating.toFixed(1)} ★
                    </span>
                  </div>
                  <p className="font-display text-lg font-light text-[#f3ece1] truncate">
                    {staff.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#5c554c]">
                    {staff.totalRatings} reseñas
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner Principal del Barbero */}
      {selectedStaff && whatsappNumber && (
        <div className="bg-[#131110] border border-[#2a2520] relative overflow-hidden flex flex-col md:flex-row items-stretch">
          {/* Lado Izquierdo + Centro: QR y Título */}
          <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between space-y-4 z-10">
            <div className="flex flex-row items-start justify-between md:justify-start gap-4 sm:gap-6">
              {/* QR + Botón Descargar */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {(() => {
                  const qrUrl = buildStaffQrUrl(whatsappNumber, currentBoxCode, selectedStaff.name);
                  return (
                    <>
                      <div className="bg-[#f3ece1] p-2 w-28 h-28 sm:w-32 sm:h-32">
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage: `url('${qrUrl}')`,
                            backgroundSize: "cover",
                          }}
                        />
                      </div>
                      <DownloadQRButton qrUrl={qrUrl} barbershopName={selectedStaff.name} />
                    </>
                  );
                })()}
              </div>

              {/* Foto del Barbero AL LADO del QR (Móvil) */}
              <div className="md:hidden w-28 h-36 sm:w-32 sm:h-40 shrink-0 border border-[#2a2520] bg-[#0a0807] overflow-hidden relative shadow-md">
                {selectedStaff.photoUrl ? (
                  <img
                    src={selectedStaff.photoUrl}
                    alt={selectedStaff.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                    <span className="text-3xl opacity-40 mb-1">{icon}</span>
                    <span className="font-mono text-[9px] text-[#5c554c]">Sin Foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Identificación y Código activo */}
            <div className="space-y-1">
              <span style={{ color: terms.accentColor }} className="font-mono text-[10px] tracking-[0.25em] uppercase">
                QR PERSONAL
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-light text-[#f3ece1]">
                {selectedStaff.name}
              </h3>
              <p className="font-mono text-xs text-[#5c554c]">
                Código de caja activo: <span style={{ color: terms.accentColor }} className="font-bold">{currentBoxCode}</span>
              </p>
            </div>
          </div>

          {/* Lado Derecho: Foto (Escritorio) */}
          <div className="hidden md:flex w-72 lg:w-80 shrink-0 relative min-h-full overflow-hidden items-center justify-center bg-[#0a0807]">
            {selectedStaff.photoUrl ? (
              <>
                <img
                  src={selectedStaff.photoUrl}
                  alt={selectedStaff.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#131110] via-transparent to-transparent opacity-80" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0a0807] border-l border-[#2a2520]">
                <span className="text-4xl opacity-40 mb-2">{icon}</span>
                <p className="font-mono text-xs text-[#5c554c]">Sin foto configurada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel principal de calificación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score grande */}
        <div className="bg-[#131110] border border-[#2a2520] p-6 sm:p-8 flex flex-col items-center justify-center">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5c554c] mb-3">
            {selectedStaff ? selectedStaff.name : "Calificación General"}
          </p>
          {currentCount > 0 ? (
            <>
              <p style={{ color: terms.accentColor }} className="font-display text-7xl sm:text-8xl font-light">
                {currentAvg.toFixed(1)}
              </p>
              <div className="mt-2">
                <StarDisplay rating={currentAvg} starColor={terms.accentColor} />
              </div>
              <p className="font-mono text-[10px] text-[#5c554c] mt-2">
                {currentCount} calificaciones
              </p>
            </>
          ) : (
            <p className="font-mono text-sm text-[#5c554c] italic text-center">
              Sin calificaciones aún
            </p>
          )}
        </div>

        {/* Distribución de estrellas */}
        <div className="bg-[#131110] border border-[#2a2520] p-6 sm:col-span-2 flex flex-col justify-center gap-2">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5c554c] mb-2">
            Distribución
          </p>
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={currentDistribution[stars - 1]}
              total={currentCount}
              barColor={terms.accentColor}
            />
          ))}
        </div>
      </div>

      {/* Lista de reseñas específicas del barbero seleccionado */}
      {selectedStaff && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5c554c]">
              Calificaciones de {selectedStaff.name} ({reviewsList.length})
            </p>
          </div>

          {reviewsList.length === 0 ? (
            <div className="border border-[#2a2520] bg-[#131110] p-8 text-center">
              <p className="font-display italic text-[#5c554c]">
                Este profesional aún no tiene calificaciones registradas.
              </p>
            </div>
          ) : (
            <>
              <div className="border border-[#2a2520] bg-[#131110] divide-y divide-[#1c1917]">
                {visibleReviews.map((rev) => (
                  <div key={rev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base text-[#f3ece1] font-light">
                          {rev.customerName}
                        </p>
                        {rev.customerWhatsapp && (
                          <span className="font-mono text-[10px] text-[#5c554c]">
                            (+{rev.customerWhatsapp})
                          </span>
                        )}
                      </div>
                      {rev.comment && (
                        <p className="font-sans text-xs text-[#a89e90] bg-[#0a0807] border border-[#2a2520] p-2.5 rounded-sm italic max-w-xl">
                          &quot;{rev.comment}&quot;
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <StarDisplay rating={rev.rating} />
                      <p className="font-mono text-[10px] text-[#5c554c] mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString("es-EC", {
                          timeZone: "America/Guayaquil",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {visibleReviewsCount < reviewsList.length && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleReviewsCount((prev) => prev + 20)}
                    className="font-mono text-xs tracking-[0.2em] uppercase text-[#d97644] hover:text-[#f3ece1] border border-[#d97644]/40 hover:border-[#d97644] px-6 py-2 transition-colors"
                  >
                    Ver más (+20)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lista de barberos (solo en vista general) */}
      {selectedView === "general" && staffStats.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5c554c] mb-3">
            Por Profesional
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {staffStats
              .sort((a, b) => b.avgRating - a.avgRating)
              .map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  isSelected={false}
                  onClick={() => handleSelectTab(staff.id)}
                  qrUrl={
                    whatsappNumber
                      ? buildStaffQrUrl(whatsappNumber, currentBoxCode, staff.name)
                      : ""
                  }
                  accentColor={terms.accentColor}
                  staffSingular={terms.staffSingular}
                  icon={icon}
                />
              ))}
          </div>
        </div>
      )}

      {/* Nota de calificaciones sin asignar */}
      {unassignedCount > 0 && selectedView === "general" && (
        <div className="p-3 bg-[#131110]/70 border border-[#2a2520] text-center sm:text-left">
          <p className="font-mono text-[10px] text-[#5c554c]">
            ℹ️ {unassignedCount} calificaciones sin asignar incluidas en el promedio general.
          </p>
        </div>
      )}

      {/* Sin staff registrado */}
      {staffStats.length === 0 && (
        <div className="border border-[#2a2520] bg-[#131110] p-10 text-center">
          <p className="font-display italic text-lg text-[#5c554c] mb-2">
            No hay barberos registrados
          </p>
          <p className="font-mono text-[10px] text-[#5c554c] tracking-widest">
            Ve a{" "}
            <a href="/panel/whatsapp" className="text-[#d97644] hover:underline">
              Configuración
            </a>{" "}
            para agregar a tu equipo de trabajo.
          </p>
        </div>
      )}
    </div>
  );
}
