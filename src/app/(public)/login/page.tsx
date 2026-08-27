"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "checking">("checking");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Verificar si ya hay sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/barbershop/status");
        if (res.ok) {
          // Ya tiene sesión activa, redirigir al panel
          router.replace("/panel");
          return;
        }
      } catch {
        // No hay sesión, mostrar formulario de login
      }
      setStatus("idle");
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setStatus("error");
      setMessage("Por favor, ingresa tu código PIN.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("¡Acceso correcto! Redirigiendo...");
        // Redirigir al panel de control
        setTimeout(() => {
          router.push("/panel");
        }, 800);
      } else {
        setStatus("error");
        setMessage(data.error || "El código PIN ingresado es incorrecto.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión con el servidor.");
    }
  };

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === "checking") {
    return (
      <main className="min-h-[80vh] flex items-center justify-center p-6 bg-[#09090b]">
        <div className="text-center space-y-4">
          <span className="inline-block w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-400">
            Verificando sesión...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-[#09090b]">
      <div className="w-full max-w-md p-8 sm:p-10 bg-[#121214]/95 border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Halo de luz plateado superior */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-zinc-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo e Identidad */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50 mb-4 bg-zinc-900 p-1 flex items-center justify-center">
            <Image
              src="/logos/negocios_icon_192.png"
              alt="NegociOS Icon"
              width={76}
              height={76}
              className="w-full h-full object-cover rounded-xl"
              priority
            />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-zinc-100 tracking-tight">
            NegociOS
          </h2>
          <p className="font-mono text-[11px] tracking-[0.25em] text-zinc-400 uppercase mt-1.5">
            Acceso al Panel de Control
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-400 mb-2">
              Código PIN de Acceso
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ej. 123456"
              disabled={status === "loading"}
              autoFocus
              className="w-full px-4 py-3.5 font-mono text-xl text-center tracking-[0.35em] bg-zinc-950/90 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all shadow-inner"
            />
          </div>

          {message && (
            <p
              className={`font-mono text-xs text-center p-2.5 rounded-lg ${
                status === "success"
                  ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800"
                  : "bg-red-950/50 text-red-400 border border-red-800"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3.5 font-mono text-xs tracking-[0.2em] uppercase text-zinc-950 bg-zinc-100 hover:bg-white active:bg-zinc-200 rounded-xl transition-all shadow-md shadow-white/10 disabled:opacity-50 font-bold"
          >
            {status === "loading" ? "VERIFICANDO..." : "INGRESAR AL PANEL"}
          </button>
        </form>
      </div>
    </main>
  );
}
