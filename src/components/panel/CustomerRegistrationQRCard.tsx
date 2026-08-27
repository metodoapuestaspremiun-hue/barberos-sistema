"use client";

import { useState, useEffect } from "react";
import DownloadQRButton from "@/components/DownloadQRButton";
import { getTenantTerms } from "@/lib/tenant-dictionary";

interface CustomerRegistrationQRCardProps {
  barbershopId: string;
  barbershopName: string;
  vertical?: string | null;
}

export default function CustomerRegistrationQRCard({
  barbershopId,
  barbershopName,
  vertical,
}: CustomerRegistrationQRCardProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const registrationUrl = `${origin || "https://barberosplus.com"}/registro/${barbershopId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    registrationUrl
  )}`;

  const terms = getTenantTerms(vertical);
  const accentColor = terms.accentColor;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
    }
  };

  return (
    <div className="bg-[#131110] border border-[#2a2520] rounded-xl p-6 shadow-2xl relative overflow-hidden transition-all hover:border-[#3a332c]">
      {/* Glow ambiental de fondo */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Contenedor del QR */}
        <div className="relative group flex-shrink-0">
          <div className="p-3 bg-[#0a0807] border border-[#2a2520] rounded-xl flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`QR de Registro - ${barbershopName}`}
              className="w-40 h-40 object-contain rounded-lg"
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-[#a89e90] tracking-wider uppercase">
              Escanea para probar
            </span>
          </div>
        </div>

        {/* Información y Acciones */}
        <div className="flex-1 space-y-4 text-left">
          <div>
            <h3 className="text-xl font-display font-medium text-[#f3ece1]">
              QR de Captación de Clientes
            </h3>
            <p className="text-xs font-sans text-[#a89e90] mt-1">
              Muestra este QR en recepción para que nuevos clientes registren sus datos al instante.
            </p>
          </div>

          {/* Enlace directo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#0a0807] p-2.5 rounded-lg border border-[#2a2520]">
            <input
              type="text"
              readOnly
              value={registrationUrl}
              className="bg-transparent text-xs font-mono text-[#f3ece1] px-2 py-1 flex-1 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 text-xs font-mono tracking-wider uppercase bg-[#2a2520] hover:bg-[#3a332c] text-[#f3ece1] rounded transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <span>✓</span> Copiado
                </>
              ) : (
                <>
                  <span>📋</span> Copiar Link
                </>
              )}
            </button>
          </div>

          {/* Botón de descarga de QR */}
          <div className="pt-1">
            <DownloadQRButton
              qrUrl={qrImageUrl}
              barbershopName={barbershopName}
              filePrefix="qr_registro_clientes"
              variant="solid"
              label="DESCARGAR QR PARA IMPRIMIR (PNG)"
              className="w-full sm:w-auto font-mono text-xs tracking-widest px-6 py-3 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
