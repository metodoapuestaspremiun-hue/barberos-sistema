"use client";

import { useState, useEffect } from "react";
import { getQrDataUrl } from "@/lib/qr-generator";
import DownloadQRButton from "@/components/DownloadQRButton";

interface Barbershop {
  id: string;
  name: string;
  whatsappNumber: string;
  evolutionInstance: string;
  planStatus: string;
  planType: string;
  trialEndsAt: string | null;
  createdAt: string;
  loginPin: string;
  googleMapsUrl: string | null;
  requiredCuts: number;
  salesAgent: string | null;
  hasCommission: boolean;
  commissionStatus: string;
  referredByName: string | null;
  referredByCode: string | null;
  vertical: string;
}

export default function AdminDashboard() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [filterVertical, setFilterVertical] = useState<"ALL" | "BARBERIA" | "GABINETE" | "NEGOCIO">("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Formulario de creación
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [requiredCuts, setRequiredCuts] = useState(5);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [salesAgent, setSalesAgent] = useState("");
  const [planType, setPlanType] = useState<"PRO" | "PREMIUM">("PRO");
  const [vertical, setVertical] = useState<"BARBERIA" | "GABINETE" | "NEGOCIO">("BARBERIA");

  // Estado para la barbería en edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editRequiredCuts, setEditRequiredCuts] = useState(5);
  const [editGoogleMapsUrl, setEditGoogleMapsUrl] = useState("");
  const [editSalesAgent, setEditSalesAgent] = useState("");
  const [editVertical, setEditVertical] = useState<"BARBERIA" | "GABINETE" | "NEGOCIO">("BARBERIA");

  // Estado para tab de vendedores
  const [activeTab, setActiveTab] = useState<"barbershops" | "vendedores">("barbershops");
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [showVendedorModal, setShowVendedorModal] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<any>(null);
  const [vendedorForm, setVendedorForm] = useState({ nombre: "", celular: "", negocio: "", direccion: "" });

  // Éxito de creación reciente
  const [createdPin, setCreatedPin] = useState("");
  const [createdShopName, setCreatedShopName] = useState("");

  const fetchBarbershops = async (secret: string) => {
    try {
      const response = await fetch("/api/admin/barbershops", {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBarbershops(data);
        setIsAuthenticated(true);
        setAdminSecret(secret);
        setError("");
        // Persistir sesión
        try { localStorage.setItem("admin_secret", secret); } catch {}
      } else {
        setError("Secreto de administración inválido.");
        try { localStorage.removeItem("admin_secret"); } catch {}
      }
    } catch {
      setError("Error de red.");
    }
  };

  const fetchVendedores = async () => {
    try {
      const response = await fetch("/api/referidos", {
        headers: { Authorization: `Bearer ${adminSecret}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVendedores(data);
      }
    } catch {
      console.error("Error fetching vendedores");
    }
  };

  const handleCreateVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/referidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify(vendedorForm),
      });
      if (response.ok) {
        setVendedorForm({ nombre: "", celular: "", negocio: "", direccion: "" });
        setShowVendedorModal(false);
        fetchVendedores();
      } else {
        alert("Error al crear vendedor");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleDeleteVendedor = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar vendedor "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/referidos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminSecret}` },
      });
      if (response.ok) fetchVendedores();
    } catch {
      alert("Error de conexión");
    }
  };

  const handleToggleVendedorActivo = async (vendedor: any) => {
    try {
      const response = await fetch(`/api/referidos/${vendedor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ activo: !vendedor.activo }),
      });
      if (response.ok) fetchVendedores();
    } catch {
      alert("Error de conexión");
    }
  };

  // Auto-login al cargar la página si hay sesión guardada
  useEffect(() => {
    const saved = localStorage.getItem("admin_secret");
    if (saved) {
      setAdminSecret(saved);
      fetchBarbershops(saved).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar vendedores cuando se cambia al tab
  useEffect(() => {
    if (isAuthenticated && activeTab === "vendedores") {
      fetchVendedores();
    }
  }, [isAuthenticated, activeTab]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBarbershops(adminSecret);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/barbershops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          name,
          whatsappNumber,
          requiredCuts: Number(requiredCuts),
          googleMapsUrl,
          ownerPhone: ownerPhone.trim() || undefined,
          salesAgent: salesAgent.trim() || undefined,
          planType,
          vertical,
        }),
      });

      if (response.ok) {
        const newShop = await response.json();
        setCreatedPin(newShop.loginPin || "");
        setCreatedShopName(newShop.name || "");

        // Limpiar form y refrescar lista
        setName("");
        setWhatsappNumber("");
        setGoogleMapsUrl("");
        setOwnerPhone("");
        setSalesAgent("");
        setVertical("BARBERIA");
        fetchBarbershops(adminSecret);
      } else {
        const errData = await response.json();
        alert(errData.error || "Error al crear barbería.");
      }
    } catch {
      alert("Error al conectar con la API.");
    }
  };

  const handleChangeStatus = async (barbershopId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/barbershops", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          barbershopId,
          planStatus: newStatus,
        }),
      });

      if (response.ok) {
        fetchBarbershops(adminSecret);
      } else {
        alert("Error al cambiar estado.");
      }
    } catch {
      alert("Error de conexión.");
    }
  };

  const handleChangePlanType = async (barbershopId: string, newPlanType: "PRO" | "PREMIUM") => {
    try {
      const response = await fetch("/api/admin/barbershops", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          barbershopId,
          planType: newPlanType,
        }),
      });

      if (response.ok) {
        fetchBarbershops(adminSecret);
      } else {
        alert("Error al cambiar el tipo de plan.");
      }
    } catch {
      alert("Error de conexión.");
    }
  };

  const handleDelete = async (barbershopId: string, shopName: string) => {
    const confirmed = confirm(`¿Estás seguro de eliminar la barbería "${shopName}"?\n\nEsto eliminará:\n- La barbería y todos sus datos\n- Sus clientes y visitas\n- La instancia de WhatsApp en Evolution API\n\nEsta acción NO se puede deshacer.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/barbershops?id=${barbershopId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminSecret}`,
        },
      });

      if (response.ok) {
        fetchBarbershops(adminSecret);
      } else {
        const errData = await response.json();
        alert(errData.error || "Error al eliminar barbería.");
      }
    } catch {
      alert("Error de conexión.");
    }
  };

  const handleStartEdit = (shop: Barbershop) => {
    setEditingId(shop.id);
    setEditName(shop.name);
    setEditWhatsappNumber(shop.whatsappNumber);
    setEditRequiredCuts(shop.requiredCuts);
    setEditGoogleMapsUrl(shop.googleMapsUrl || "");
    setEditSalesAgent(shop.salesAgent || "");
    setEditVertical(
      shop.vertical === "GABINETE" || shop.vertical === "SALON"
        ? "GABINETE"
        : shop.vertical === "NEGOCIO"
        ? "NEGOCIO"
        : "BARBERIA"
    );
  };

  const handleSaveEdit = async (barbershopId: string) => {
    if (!editName.trim() || !editWhatsappNumber.trim()) {
      alert("Nombre y WhatsApp son requeridos.");
      return;
    }

    try {
      const response = await fetch("/api/admin/barbershops", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          barbershopId,
          name: editName,
          whatsappNumber: editWhatsappNumber,
          requiredCuts: Number(editRequiredCuts),
          googleMapsUrl: editGoogleMapsUrl.trim() || null,
          salesAgent: editSalesAgent.trim() || null,
          vertical: editVertical,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        fetchBarbershops(adminSecret);
      } else {
        const errData = await response.json();
        alert(errData.error || "Error al actualizar barbería.");
      }
    } catch {
      alert("Error de conexión.");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0a0807] text-[#f3ece1] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-10 bg-[#131110] border border-[#2a2520]">
          <h2 className="font-display text-3xl font-light mb-8 text-[#d97644] text-center">
            SuperAdmin BarberOS
          </h2>
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-xs tracking-[0.2em] uppercase text-[#5c554c] mb-2">
                ADMIN SECRET KEY
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Ingresa la clave maestra"
                className="w-full px-4 py-3 font-mono text-sm bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
              />
            </div>
            {error && <p className="font-display italic text-xs text-[#d97644]">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 font-mono text-xs tracking-[0.2em] uppercase text-[#0a0807] bg-[#d97644] hover:bg-[#e8854f] transition-colors"
            >
              Autenticar Panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  const barberiasCount = barbershops.filter(
    (s) => s.vertical !== "GABINETE" && s.vertical !== "SALON" && s.vertical !== "NEGOCIO"
  ).length;

  const gabinetesCount = barbershops.filter(
    (s) => s.vertical === "GABINETE" || s.vertical === "SALON"
  ).length;

  const negociosCount = barbershops.filter(
    (s) => s.vertical === "NEGOCIO"
  ).length;

  const filteredBarbershops = barbershops.filter((shop) => {
    if (filterVertical === "BARBERIA") {
      return shop.vertical !== "GABINETE" && shop.vertical !== "SALON" && shop.vertical !== "NEGOCIO";
    }
    if (filterVertical === "GABINETE") {
      return shop.vertical === "GABINETE" || shop.vertical === "SALON";
    }
    if (filterVertical === "NEGOCIO") {
      return shop.vertical === "NEGOCIO";
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0a0807] text-[#f3ece1] p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-[#2a2520] pb-6">
          <div>
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#5c554c] block mb-2">
              Panel Maestro
            </span>
            <h1 className="font-display text-5xl font-light">SuperAdmin</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex border border-[#2a2520]">
              <button
                onClick={() => setActiveTab("barbershops")}
                className={`px-4 py-2 font-mono text-xs tracking-wider uppercase transition-colors ${
                  activeTab === "barbershops"
                    ? "bg-[#d97644] text-[#0a0807]"
                    : "text-[#5c554c] hover:text-[#f3ece1]"
                }`}
              >
                Negocios
              </button>
              <button
                onClick={() => setActiveTab("vendedores")}
                className={`px-4 py-2 font-mono text-xs tracking-wider uppercase transition-colors border-l border-[#2a2520] ${
                  activeTab === "vendedores"
                    ? "bg-[#d97644] text-[#0a0807]"
                    : "text-[#5c554c] hover:text-[#f3ece1]"
                }`}
              >
                Vendedores
              </button>
            </div>
            <button
            onClick={() => {
              try { localStorage.removeItem("admin_secret"); } catch {}
              setIsAuthenticated(false);
              setAdminSecret("");
            }}
            className="font-mono text-xs tracking-[0.2em] uppercase text-[#5c554c] hover:text-[#d97644] transition-colors"
          >
            Cerrar Sesión
          </button>
          </div>
        </header>

        {/* Contenido según tab */}
        {activeTab === "barbershops" ? (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Formulario de Onboarding */}
          <div className="lg:col-span-1 bg-[#131110] border border-[#2a2520] p-8 space-y-6">
            <h3 className="font-display text-2xl font-light text-[#d97644]">
              Nuevo Negocio (Onboarding)
            </h3>

            {createdPin && (
              <div className="p-4 bg-green-950/40 border border-green-800 text-green-400 font-mono text-xs rounded space-y-2 animate-pulse-short">
                <p className="font-bold text-[10px] tracking-wider uppercase">✨ ¡NEGOCIO CREADO CON ÉXITO!</p>
                <p>Nombre: <span className="text-white">{createdShopName}</span></p>
                <div className="p-3 bg-[#0a0807] border border-green-900 text-center rounded">
                  <p className="text-[10px] uppercase text-[#5c554c] tracking-wider mb-1">CÓDIGO PIN DE ACCESO</p>
                  <p className="text-2xl font-bold text-white tracking-[0.2em]">{createdPin}</p>
                </div>
                <p className="text-[9px] text-[#5c554c] text-center">Pásale este código al dueño/administrador para que ingrese desde /login.</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Barbería Elite / Salón Glamour"
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  WhatsApp (con prefijo país)
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ej. 593963410409"
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Cortes Requeridos para Premio
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={requiredCuts}
                  onChange={(e) => setRequiredCuts(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Link Reseña Google (Opcional)
                </label>
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="Pegar enlace directo de reseña Google"
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Teléfono Personal del Dueño (Opcional)
                </label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="Ej. 593991234567"
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Tipo de Plan
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as "PRO" | "PREMIUM")}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                >
                  <option value="PRO">⚡ BarberOS PRO (Estándar)</option>
                  <option value="PREMIUM">👑 BarberOS PREMIUM (IA Avanzada)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Tipo de Negocio
                </label>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value as "BARBERIA" | "GABINETE" | "NEGOCIO")}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                >
                  <option value="BARBERIA">💈 Barbería (BarberOS)</option>
                  <option value="GABINETE">💅 Gabinete / Salón (GabineteOS)</option>
                  <option value="NEGOCIO">🏪 Negocio / Comercio (NegocioOS)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">
                  Vendedor / Referido por (Opcional)
                </label>
                <input
                  type="text"
                  value={salesAgent}
                  onChange={(e) => setSalesAgent(e.target.value)}
                  placeholder="Ej. Juan Pérez / Código Vendedor"
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 font-mono text-xs tracking-[0.2em] uppercase text-[#0a0807] bg-[#d97644] hover:bg-[#e8854f] transition-colors pt-2"
              >
                Crear Negocio
              </button>
            </form>
          </div>

          {/* Listado y Gestión */}
          <div className="lg:col-span-2 bg-[#131110] border border-[#2a2520] p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2520] pb-4">
              <h3 className="font-display text-2xl font-light text-[#f3ece1]">
                {filterVertical === "ALL"
                  ? `Todos los Negocios (${filteredBarbershops.length})`
                  : filterVertical === "BARBERIA"
                  ? `Barberías (${filteredBarbershops.length})`
                  : filterVertical === "GABINETE"
                  ? `Gabinetes (${filteredBarbershops.length})`
                  : `Negocios (${filteredBarbershops.length})`}
              </h3>

              {/* Filtro por tipo de negocio (Vertical) */}
              <div className="flex items-center gap-1 bg-[#0a0807] border border-[#2a2520] p-1 rounded">
                <button
                  type="button"
                  onClick={() => setFilterVertical("ALL")}
                  className={`px-3 py-1.5 font-mono text-xs rounded transition-all ${
                    filterVertical === "ALL"
                      ? "bg-[#d97644] text-[#0a0807] font-bold"
                      : "text-[#a89e90] hover:text-[#f3ece1] hover:bg-[#1a1714]"
                  }`}
                >
                  Todos ({barbershops.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVertical("BARBERIA")}
                  className={`px-3 py-1.5 font-mono text-xs rounded flex items-center gap-1 transition-all ${
                    filterVertical === "BARBERIA"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold"
                      : "text-[#a89e90] hover:text-[#f3ece1] hover:bg-[#1a1714]"
                  }`}
                >
                  💈 Barberías ({barberiasCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVertical("GABINETE")}
                  className={`px-3 py-1.5 font-mono text-xs rounded flex items-center gap-1 transition-all ${
                    filterVertical === "GABINETE"
                      ? "bg-pink-500/20 text-pink-300 border border-pink-500/50 font-bold"
                      : "text-[#a89e90] hover:text-[#f3ece1] hover:bg-[#1a1714]"
                  }`}
                >
                  💅 Gabinetes ({gabinetesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVertical("NEGOCIO")}
                  className={`px-3 py-1.5 font-mono text-xs rounded flex items-center gap-1 transition-all ${
                    filterVertical === "NEGOCIO"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold"
                      : "text-[#a89e90] hover:text-[#f3ece1] hover:bg-[#1a1714]"
                  }`}
                >
                  🏪 Negocios ({negociosCount})
                </button>
              </div>
            </div>

            {barbershops.length === 0 ? (
              <p className="font-mono text-xs text-[#5c554c]">No hay negocios registrados aún.</p>
            ) : filteredBarbershops.length === 0 ? (
              <p className="font-mono text-xs text-[#5c554c] py-4 text-center">
                No hay registros de tipo {filterVertical === "BARBERIA" ? "Barbería" : filterVertical === "GABINETE" ? "Gabinete" : "Negocio"}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-[#a89e90]">
                  <thead>
                    <tr className="border-b border-[#2a2520] text-[#5c554c] uppercase">
                      <th className="py-3">Negocio</th>
                      <th className="py-3">WhatsApp</th>
                      <th className="py-3">Código PIN</th>
                    <th className="py-3">Comisión</th>
                      <th className="py-3">Plan</th>
                      <th className="py-3">Vence</th>
                      <th className="py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBarbershops.map((shop) => (
                      <tr key={shop.id} className="border-b border-[#1c1917] hover:bg-[#0a0807]">
                        {editingId === shop.id ? (
                          <>
                            {/* Formulario Inline de Edición */}
                            <td className="py-4" colSpan={6}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0a0807] border border-[#2a2520]">
                                <div>
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">Nombre</label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">WhatsApp</label>
                                  <input
                                    type="text"
                                    value={editWhatsappNumber}
                                    onChange={(e) => setEditWhatsappNumber(e.target.value)}
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">Cortes Meta</label>
                                  <input
                                    type="number"
                                    value={editRequiredCuts}
                                    onChange={(e) => setEditRequiredCuts(Number(e.target.value))}
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">Vendedor / Referido</label>
                                  <input
                                    type="text"
                                    value={editSalesAgent}
                                    onChange={(e) => setEditSalesAgent(e.target.value)}
                                    placeholder="Nombre del vendedor"
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">Tipo de Negocio</label>
                                  <select
                                    value={editVertical}
                                    onChange={(e) => setEditVertical(e.target.value as "BARBERIA" | "GABINETE" | "NEGOCIO")}
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  >
                                    <option value="BARBERIA">💈 Barbería</option>
                                    <option value="GABINETE">💅 Gabinete / Salón</option>
                                    <option value="NEGOCIO">🏪 Negocio / Comercio</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block font-mono text-[9px] uppercase text-[#5c554c] mb-1">Link Reseña Google</label>
                                  <input
                                    type="text"
                                    value={editGoogleMapsUrl}
                                    onChange={(e) => setEditGoogleMapsUrl(e.target.value)}
                                    placeholder="Pegar enlace directo de reseña Google"
                                    className="w-full px-2 py-1 font-mono text-xs bg-[#131110] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right space-y-2">
                              <button
                                onClick={() => handleSaveEdit(shop.id)}
                                className="w-full px-2 py-1 bg-green-900/30 text-green-400 hover:bg-green-800 border border-green-700 rounded block text-center font-bold"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="w-full px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-800/60 border border-red-700 rounded block text-center"
                              >
                                Cancelar
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Fila de Lectura Normal */}
                            <td className="py-4 font-display text-base text-[#f3ece1] font-light">
                              <div className="flex items-center gap-2">
                                {shop.name}
                                <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                                  shop.vertical === "GABINETE" || shop.vertical === "SALON"
                                    ? "bg-pink-950/40 text-pink-300 border border-pink-800"
                                    : shop.vertical === "NEGOCIO"
                                    ? "bg-sky-950/40 text-sky-300 border border-sky-800"
                                    : "bg-amber-950/40 text-amber-300 border border-amber-800"
                                }`}>
                                  {shop.vertical === "GABINETE" || shop.vertical === "SALON"
                                    ? "💅 Gabinete"
                                    : shop.vertical === "NEGOCIO"
                                    ? "🏪 Negocio"
                                    : "💈 Barbería"}
                                </span>
                              </div>
                              {shop.googleMapsUrl ? (
                                <a
                                  href={shop.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-[#d97644] hover:underline block mt-0.5"
                                >
                                  Ver Reseña Google ↗
                                </a>
                              ) : (
                                <span className="text-[9px] text-[#5c554c] block mt-0.5">Sin Link de Reseña</span>
                              )}
                            </td>
                            <td className="py-4">+{shop.whatsappNumber}</td>
                            <td className="py-4 font-mono font-bold text-amber-500">{shop.loginPin || "---"}</td>
                            <td className="py-4 text-xs font-mono">
                              {shop.hasCommission ? (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 bg-green-950/40 text-green-400 border border-green-800 rounded text-[10px] block w-fit">
                                    💰 SÍ
                                  </span>
                                  {shop.referredByName && (
                                    <span className="text-[10px] text-[#a89e90] block">
                                      {shop.referredByName}
                                    </span>
                                  )}
                                </div>
                              ) : shop.commissionStatus === "PENDING" ? (
                                <span className="px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-800 rounded text-[10px]">
                                  ⏳ Pendiente
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-800 rounded text-[10px]">
                                  ❌ No
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-xs font-mono text-[#a89e90]">
                              {shop.salesAgent ? (
                                <span className="px-2 py-0.5 bg-[#2a2520] border border-[#3a3530] rounded text-[10px] text-[#d97644]">
                                  👤 {shop.salesAgent}
                                </span>
                              ) : (
                                <span className="text-[#5c554c] text-[10px]">Directo</span>
                              )}
                            </td>
                            <td className="py-4 space-y-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    shop.planStatus === "ACTIVE"
                                      ? "bg-green-950/40 text-green-400 border border-green-800"
                                      : shop.planStatus === "TRIAL"
                                      ? "bg-blue-950/40 text-blue-400 border border-blue-800"
                                      : "bg-red-950/40 text-red-400 border border-red-800"
                                  }`}
                                >
                                  {shop.planStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                                    shop.planType === "PREMIUM"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                      : "bg-[#2a2520] text-[#a89e90] border border-[#3a3530]"
                                  }`}
                                >
                                  {shop.planType === "PREMIUM" ? "👑 PREMIUM" : "⚡ PRO"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4">
                              {shop.trialEndsAt
                                ? new Date(shop.trialEndsAt).toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" })
                                : "N/A"}
                            </td>
                            <td className="py-4 text-right space-x-1 space-y-1">
                              <button
                                onClick={() => handleStartEdit(shop)}
                                className="px-2 py-1 bg-[#2a2520] text-[#a89e90] hover:text-[#f3ece1] border border-[#2a2520] rounded"
                              >
                                Editar
                              </button>
                              {shop.planType === "PRO" ? (
                                <button
                                  onClick={() => handleChangePlanType(shop.id, "PREMIUM")}
                                  className="px-2 py-1 bg-amber-950/40 text-amber-400 hover:bg-amber-800/50 border border-amber-700/60 rounded font-bold"
                                  title="Pasar a Plan Premium"
                                >
                                  Hacer Premium
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleChangePlanType(shop.id, "PRO")}
                                  className="px-2 py-1 bg-gray-900/60 text-gray-400 hover:bg-gray-800 border border-gray-700 rounded"
                                  title="Pasar a Plan Pro"
                                >
                                  Bajar a Pro
                                </button>
                              )}
                              <button
                                onClick={() => handleChangeStatus(shop.id, "ACTIVE")}
                                className="px-2 py-1 bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-green-900/60 rounded"
                              >
                                Activar
                              </button>
                              <button
                                onClick={() => handleChangeStatus(shop.id, "SUSPENDED")}
                                className="px-2 py-1 bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/60 rounded"
                              >
                                Pausar
                              </button>
                              <button
                                onClick={() => handleDelete(shop.id, shop.name)}
                                className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-800/60 border border-red-700 rounded"
                              >
                                Eliminar
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        ) : (
        /* Sección Vendedores */
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-3xl font-light">
              Vendedores ({vendedores.length})
            </h2>
            <button
              onClick={() => {
                setEditingVendedor(null);
                setVendedorForm({ nombre: "", celular: "", negocio: "", direccion: "" });
                setShowVendedorModal(true);
              }}
              className="px-4 py-2 font-mono text-xs tracking-wider uppercase bg-[#d97644] text-[#0a0807] hover:bg-[#e8854f] transition-colors"
            >
              + Nuevo Vendedor
            </button>
          </div>

          {vendedores.length === 0 ? (
            <p className="font-mono text-xs text-[#5c554c] text-center py-12">
              No hay vendedores registrados.
            </p>
          ) : (
            <div className="bg-[#131110] border border-[#2a2520] overflow-hidden">
              <table className="w-full text-left font-mono text-xs text-[#a89e90]">
                <thead>
                  <tr className="border-b border-[#2a2520] text-[#5c554c] uppercase">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Celular</th>
                    <th className="py-3 px-4">Negocio</th>
                    <th className="py-3 px-4">Dirección</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Scans</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map((v) => (
                    <tr key={v.id} className="border-b border-[#1c1917] hover:bg-[#0a0807]">
                      <td className="py-3 px-4 text-[#f3ece1]">{v.nombre}</td>
                      <td className="py-3 px-4">+{v.celular}</td>
                      <td className="py-3 px-4">{v.negocio}</td>
                      <td className="py-3 px-4 text-[10px]">{v.direccion}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#2a2520] border border-[#3a3530] rounded text-[#d97644] font-bold tracking-wider">
                          {v.codigoUnico}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{v.scansCount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          v.activo
                            ? "bg-green-950/40 text-green-400 border border-green-800"
                            : "bg-red-950/40 text-red-400 border border-red-800"
                        }`}>
                          {v.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <DownloadQRButton
                          qrUrl={getQrDataUrl(v.codigoUnico, 300)}
                          barbershopName={v.codigoUnico}
                          filePrefix="QR"
                          variant="panel"
                          label="QR"
                        />
                        <button
                          onClick={() => handleToggleVendedorActivo(v)}
                          className={`px-2 py-1 border rounded ${
                            v.activo
                              ? "bg-red-950/40 text-red-400 hover:bg-red-800/60 border-red-700"
                              : "bg-green-900/20 text-green-500 hover:bg-green-900/40 border-green-900/60"
                          }`}
                        >
                          {v.activo ? "Desact." : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDeleteVendedor(v.id, v.nombre)}
                          className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-800/60 border border-red-700 rounded"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Modal Crear Vendedor */}
        {showVendedorModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="w-full max-w-md bg-[#131110] border border-[#2a2520] p-8">
              <h3 className="font-display text-2xl font-light text-[#d97644] mb-6">
                Nuevo Vendedor
              </h3>
              <form onSubmit={handleCreateVendedor} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={vendedorForm.nombre}
                    onChange={(e) => setVendedorForm({ ...vendedorForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">Celular</label>
                  <input
                    type="tel"
                    required
                    value={vendedorForm.celular}
                    onChange={(e) => setVendedorForm({ ...vendedorForm, celular: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">Negocio</label>
                  <input
                    type="text"
                    required
                    value={vendedorForm.negocio}
                    onChange={(e) => setVendedorForm({ ...vendedorForm, negocio: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5c554c] mb-1">Dirección</label>
                  <input
                    type="text"
                    required
                    value={vendedorForm.direccion}
                    onChange={(e) => setVendedorForm({ ...vendedorForm, direccion: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] focus:outline-none focus:border-[#d97644]"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 font-mono text-xs tracking-[0.2em] uppercase text-[#0a0807] bg-[#d97644] hover:bg-[#e8854f] transition-colors"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVendedorModal(false)}
                    className="flex-1 py-3 font-mono text-xs tracking-[0.2em] uppercase text-[#5c554c] border border-[#2a2520] hover:border-[#d97644] hover:text-[#d97644] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
