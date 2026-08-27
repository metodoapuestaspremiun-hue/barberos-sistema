export type BusinessVertical = "BARBERIA" | "GABINETE" | "SALON" | "NEGOCIO";

export interface TenantTerms {
  brandName: string;
  businessTypeName: string;
  businessTypePlural: string;
  staffTitle: string;
  staffSingular: string;
  rewardUnitSingular: string;
  rewardUnitPlural: string;
  actionButtonText: string;
  heroImage: string;
  accentColor: string;
  accentColorClass: string;
  accentBorderClass: string;
  accentBgClass: string;
}

export function getTenantTerms(vertical?: string | null): TenantTerms {
  const v = (vertical || "BARBERIA").toUpperCase() as BusinessVertical;

  if (v === "GABINETE" || v === "SALON") {
    return {
      brandName: "GabineteOS",
      businessTypeName: "Gabinete de Belleza",
      businessTypePlural: "Gabinetes",
      staffTitle: "Especialistas",
      staffSingular: "Especialista",
      rewardUnitSingular: "servicio",
      rewardUnitPlural: "servicios",
      actionButtonText: "REGISTRAR SERVICIO",
      heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80",
      accentColor: "#FE889F",
      accentColorClass: "text-[#FE889F]",
      accentBorderClass: "border-[#FE889F]",
      accentBgClass: "bg-[#FE889F]",
    };
  }

  if (v === "NEGOCIO") {
    return {
      brandName: "NegocioOS",
      businessTypeName: "Negocio / Comercio",
      businessTypePlural: "Negocios",
      staffTitle: "Colaboradores",
      staffSingular: "Colaborador",
      rewardUnitSingular: "visita",
      rewardUnitPlural: "visitas",
      actionButtonText: "REGISTRAR VISITA",
      heroImage: "https://images.unsplash.com/photo-1556742049-0a67c57750c9?w=1600&q=80",
      accentColor: "#38bdf8",
      accentColorClass: "text-[#38bdf8]",
      accentBorderClass: "border-[#38bdf8]",
      accentBgClass: "bg-[#38bdf8]",
    };
  }

  // Default: BARBERIA
  return {
    brandName: "BarberOS",
    businessTypeName: "Barbería",
    businessTypePlural: "Barberías",
    staffTitle: "Barberos",
    staffSingular: "Barbero",
    rewardUnitSingular: "corte",
    rewardUnitPlural: "cortes",
    actionButtonText: "REGISTRAR CORTE",
    heroImage: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=80",
    accentColor: "#d97644",
    accentColorClass: "text-[#d97644]",
    accentBorderClass: "border-[#d97644]",
    accentBgClass: "bg-[#d97644]",
  };
}
