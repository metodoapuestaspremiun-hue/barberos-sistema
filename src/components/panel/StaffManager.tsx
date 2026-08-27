"use client";

import { useState, useEffect, useRef } from "react";
import { getTenantTerms } from "@/lib/tenant-dictionary";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

export default function StaffManager({ vertical }: { vertical?: string | null }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newName, setNewName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terms = getTenantTerms(vertical);
  const isGabinete = (vertical || "").toUpperCase() === "GABINETE" || (vertical || "").toUpperCase() === "SALON";
  const isNegocio = (vertical || "").toUpperCase() === "NEGOCIO";
  const icon = isGabinete ? "💅" : isNegocio ? "🏪" : "💈";

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/barbershop/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (e) {
      console.error("Error cargando equipo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Selecciona una imagen menor a 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/barbershop/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          photoUrl: photoPreview,
        }),
      });
      if (res.ok) {
        setNewName("");
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchStaff();
      }
    } catch (e) {
      console.error("Error agregando miembro:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePhoto = async (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/barbershop/staff", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, photoUrl: base64 }),
        });
        if (res.ok) {
          fetchStaff();
        }
      } catch (e) {
        console.error("Error actualizando foto:", e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a este ${terms.staffSingular.toLowerCase()}?`)) return;
    try {
      const res = await fetch(`/api/barbershop/staff?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error("Error eliminando miembro:", e);
    }
  };

  return (
    <div className="border border-[#2a2520] bg-[#131110] p-5 sm:p-8 space-y-6 overflow-x-hidden min-w-0">
      <div className="border-b border-[#2a2520] pb-4">
        <span style={{ color: terms.accentColor }} className="font-mono text-xs tracking-[0.2em] uppercase break-words font-bold">
          Equipo de Trabajo / {terms.staffTitle}
        </span>
        <p className="font-mono text-xs text-[#a89e90] mt-1">
          Agrega a las personas que atienden en tu establecimiento y sube su fotografía. Tus clientes los seleccionarán al calificar o agendar.
        </p>
      </div>

      {/* Formulario para agregar */}
      <form onSubmit={handleAddStaff} className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-14 h-14 bg-[#0a0807] border border-[#2a2520] rounded-full overflow-hidden flex items-center justify-center relative shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-[#5c554c]">{icon}</span>
              )}
            </div>
            <div className="min-w-0">
              <label
                htmlFor="staff-photo-input"
                className="cursor-pointer font-mono text-[10px] tracking-wider uppercase bg-[#2a2520] text-[#f3ece1] hover:bg-[#3a3530] px-3 py-1.5 transition-colors inline-block whitespace-nowrap"
              >
                {photoPreview ? "Cambiar Foto" : "Subir Foto"}
              </label>
              <input
                id="staff-photo-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="font-mono text-[9px] text-[#5c554c] mt-1 whitespace-nowrap">
                PNG, JPG (Máx. 5MB)
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full min-w-0">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Nombre del ${terms.staffSingular.toLowerCase()} (ej: Maria, Sofia)`}
              className="flex-1 min-w-0 bg-[#0a0807] border border-[#2a2520] px-4 py-2.5 font-mono text-xs text-[#f3ece1] focus:outline-none focus:border-[#f3ece1]"
            />
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              style={{ backgroundColor: terms.accentColor }}
              className="px-5 py-2.5 font-mono text-xs tracking-widest uppercase text-[#0a0807] hover:brightness-110 transition-all disabled:opacity-50 font-bold shrink-0 whitespace-nowrap"
            >
              {submitting ? "Agregando..." : "+ Agregar"}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="font-mono text-xs text-[#5c554c]">Cargando lista...</p>
      ) : staff.length === 0 ? (
        <p className="font-mono text-xs text-[#5c554c] italic">
          No has registrado miembros aún. Si no agregas ninguno, la pregunta por WhatsApp se omitirá automáticamente.
        </p>
      ) : (
        <ul className="space-y-3 pt-2 min-w-0">
          {staff.map((s, idx) => (
            <li
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0a0807] border border-[#2a2520] p-4 gap-3 min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 bg-[#131110] border border-[#2a2520] rounded-full overflow-hidden flex items-center justify-center shrink-0 relative group">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{icon}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ color: terms.accentColor }} className="font-mono text-xs font-bold shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="font-display text-lg text-[#f3ece1] truncate">
                      {s.name}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[#5c554c] truncate">
                    {s.role === "OWNER" ? `Dueño / ${terms.staffSingular} Principal` : `${terms.staffSingular} del equipo`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <label style={{ color: terms.accentColor }} className="cursor-pointer font-mono text-[10px] tracking-wider uppercase hover:underline whitespace-nowrap">
                  Cambiar Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpdatePhoto(s.id, file);
                    }}
                  />
                </label>

                <button
                  onClick={() => handleDeleteStaff(s.id)}
                  className="font-mono text-[10px] tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors border border-red-900/40 bg-red-950/20 px-3 py-1"
                >
                  Eliminar ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
