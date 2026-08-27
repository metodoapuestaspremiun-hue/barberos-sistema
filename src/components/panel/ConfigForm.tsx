"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTenantTerms } from "@/lib/tenant-dictionary";

interface SettingsProps {
  initialData: {
    riskThresholdNormal: number;
    riskThresholdAt: number;
    loyaltyMode: string;
    visitDurationMin: number | null;
    businessInfo: string | null;
    requiredCuts: number;
    vertical?: string | null;
  };
  isPremium: boolean;
}

export default function ConfigForm({ initialData, isPremium }: SettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    riskThresholdNormal: initialData.riskThresholdNormal,
    riskThresholdAt: initialData.riskThresholdAt,
    loyaltyMode: initialData.loyaltyMode,
    visitDurationMin: initialData.visitDurationMin || "",
    businessInfo: initialData.businessInfo || "",
    requiredCuts: initialData.requiredCuts,
    vertical: initialData.vertical || "BARBERIA",
  });

  const terms = getTenantTerms(formData.vertical);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        riskThresholdNormal: parseFloat(formData.riskThresholdNormal.toString()),
        riskThresholdAt: parseFloat(formData.riskThresholdAt.toString()),
        loyaltyMode: formData.loyaltyMode,
        visitDurationMin: formData.visitDurationMin === "" ? null : parseInt(formData.visitDurationMin.toString()),
        requiredCuts: parseInt(formData.requiredCuts.toString()),
        vertical: formData.vertical,
      };

      if (isPremium) {
        payload.businessInfo = formData.businessInfo.trim() || null;
      }

      if ((payload.riskThresholdNormal as number) >= (payload.riskThresholdAt as number)) {
        throw new Error("El umbral normal debe ser menor que el umbral de riesgo.");
      }

      const res = await fetch("/api/barbershop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setSuccess(true);
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const businessInfoLength = formData.businessInfo.length;
  const BUSINESS_INFO_MAX = 2000;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-mono">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-mono">
          Configuración guardada exitosamente.
        </div>
      )}

      {/* Tipo de Negocio / Vertical */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">
            Tipo de Negocio
          </h2>
          <p className="text-sm text-[#a89e90] font-sans">
            Selecciona la identidad de tu establecimiento para adaptar automáticamente las imágenes, textos y términos de tu plataforma.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">
            Modalidad del Negocio
          </label>
          <select
            name="vertical"
            value={formData.vertical}
            onChange={handleChange}
            className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:outline-none transition-colors font-sans"
          >
            <option value="BARBERIA">💈 Barbería (Estilo masculino, cortes y barba)</option>
            <option value="GABINETE">💅 Gabinete de Belleza / Salón (Estética femenina, servicios y cuidado)</option>
            <option value="NEGOCIO">🏪 Negocio / Comercio General (Fidelización por visitas y equipo)</option>
          </select>
        </div>
      </div>

      {/* Información del Negocio — Solo PREMIUM */}
      {isPremium && (
        <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide">
                Información de tu Negocio
              </h2>
              <span style={{ color: terms.accentColor, borderColor: `${terms.accentColor}4D`, backgroundColor: `${terms.accentColor}1A` }} className="border px-2 py-0.5 text-[9px] font-mono rounded">
                PREMIUM
              </span>
            </div>
            <p className="text-sm text-[#a89e90] font-sans leading-relaxed">
              Describe tu {terms.businessTypeName.toLowerCase()}: cuántos {terms.staffTitle.toLowerCase()} tienes, desde cuándo operas, horario de atención, 
              servicios que ofreces, zona/barrio, competencia cercana, cualquier detalle relevante. 
              El Director IA usará esta información para personalizar sus recomendaciones.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">
              Descripción del Negocio
            </label>
            <textarea
              name="businessInfo"
              value={formData.businessInfo}
              onChange={handleChange}
              maxLength={BUSINESS_INFO_MAX}
              rows={6}
              placeholder={`Ej: Somos un ${terms.businessTypeName.toLowerCase()} en el centro de Cuenca, operamos desde 2019. Atendemos de lunes a sábado de 9am a 7pm. Nuestros servicios principales son cuidado facial, manicure y pestañas. Nuestro diferenciador es el trato personalizado y la fidelización por WhatsApp.`}
              className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-4 focus:outline-none transition-colors font-sans text-sm leading-relaxed resize-y min-h-[120px]"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#5c554c]">
                Esta información es tu declaración — el Director la usará como contexto, pero si contradice 
                los datos reales del Motor, lo señalará con honestidad.
              </p>
              <span className={`font-mono text-[10px] shrink-0 ml-4 ${
                businessInfoLength > BUSINESS_INFO_MAX * 0.9 
                  ? "text-amber-400" 
                  : "text-[#5c554c]"
              }`}>
                {businessInfoLength} / {BUSINESS_INFO_MAX}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Umbrales de Riesgo */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Umbrales de Riesgo (Motor de Conocimiento)</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            Configura qué tan rápido el Motor marca a un cliente como atrasado o en riesgo, en base a su ritmo habitual de visitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Recordatorio Preventivo (Nx)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                name="riskThresholdNormal"
                value={formData.riskThresholdNormal}
                onChange={handleChange}
                className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 pl-10 focus:outline-none transition-colors font-mono"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c554c] font-mono">X</span>
            </div>
            <p className="text-xs text-[#5c554c] mt-1">Ej: 0.8 significa que si suele venir cada 10 días, al día 8 se le recordará su próximo {terms.rewardUnitSingular}.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">En Riesgo / Atrasado desde (Mx)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="10"
                name="riskThresholdAt"
                value={formData.riskThresholdAt}
                onChange={handleChange}
                className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 pl-10 focus:outline-none transition-colors font-mono"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c554c] font-mono">X</span>
            </div>
            <p className="text-xs text-[#5c554c] mt-1">Ej: 2.0 significa que si pasa del día 20 (el doble), entra "En Riesgo".</p>
          </div>
        </div>
      </div>

      {/* Modo de Lealtad */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Modo de Fidelidad</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            ¿Cómo cuentas las visitas para premios ({terms.rewardUnitPlural} gratis)?
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Modo de Acumulación</label>
          <select
            name="loyaltyMode"
            value={formData.loyaltyMode}
            onChange={handleChange}
            className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:outline-none transition-colors font-sans"
          >
            <option value="BY_PROFILE">Por Perfil (Cada persona acumula para sí misma)</option>
            <option value="BY_ACCOUNT">Por Cuenta (Padre e hijo acumulan juntos en el mismo WhatsApp)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label style={{ textTransform: 'uppercase' }} className="text-xs tracking-widest text-[#a89e90] font-mono">
            {terms.rewardUnitPlural} para Premio
          </label>
          <input
            type="number"
            min="2"
            max="50"
            step="1"
            name="requiredCuts"
            value={formData.requiredCuts}
            onChange={handleChange}
            className="w-full max-w-[200px] bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:outline-none transition-colors font-mono"
            required
          />
          <p className="text-xs text-[#5c554c] mt-1">¿Cuántos {terms.rewardUnitPlural} necesita un cliente para ganar su {terms.rewardUnitSingular} gratis? (Mínimo 2, máximo 50)</p>
        </div>
      </div>

      {/* Duración de la Visita */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Operativa</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            Duración estándar de un servicio. Sirve para calcular capacidad del {terms.businessTypeName.toLowerCase()}.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Duración (Minutos)</label>
          <input
            type="number"
            min="5"
            max="480"
            name="visitDurationMin"
            value={formData.visitDurationMin}
            onChange={handleChange}
            placeholder="Opcional (Ej. 40)"
            className="w-full max-w-[200px] bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:outline-none transition-colors font-mono"
          />
          <p className="text-xs text-[#5c554c] mt-1">Déjalo en blanco si no quieres capturar la hora de inicio de las visitas.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: terms.accentColor }}
        className="w-full sm:w-auto text-[#0a0807] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm tracking-[0.2em] uppercase py-4 px-8 transition-colors flex items-center justify-center min-w-[200px] font-bold"
      >
        {loading ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}
