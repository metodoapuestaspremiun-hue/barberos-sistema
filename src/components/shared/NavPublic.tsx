"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/como-funciona", label: "Cómo Funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/historias", label: "Historias" },
  { href: "/resenas", label: "Reseñas" },
];

export default function NavPublic() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar menú al navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // En la pantalla de login/acceso no mostramos la barra pública para mantener la vista limpia de app
  if (pathname === "/login" || pathname === "/acceso") {
    return null;
  }

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* ── BARRA SUPERIOR ────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#2a2520] bg-[#0a0807]/95 backdrop-blur-sm"
        aria-label="Navegación principal"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
          {/* Logotipo */}
          <Link href="/" aria-label="BarberOS — Inicio">
            <img
              src="/logos/barberos_logo_concept_1 - copia.jpg"
              alt="BarberOS"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Links desktop */}
          <ul className="hidden md:flex items-center gap-8" role="list">
            {navLinks.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors ${
                      isActive
                        ? "text-[#d97644]"
                        : "text-[#5c554c] hover:text-[#a89e90]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Derecha: CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/acceso"
              className="font-mono text-xs tracking-[0.2em] uppercase text-[#0a0807] bg-[#d97644] px-4 py-2 hover:bg-[#e8854f] transition-colors"
            >
              Acceder
            </Link>

            {/* Hamburger — solo mobile */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span
                className={`block h-[1.5px] w-5 bg-[#a89e90] transition-all duration-300 origin-center ${
                  menuOpen ? "rotate-45 translate-y-[6.5px]" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-5 bg-[#a89e90] transition-all duration-300 ${
                  menuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-5 bg-[#a89e90] transition-all duration-300 origin-center ${
                  menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ── OVERLAY MENÚ MOBILE ────────────────────────────────── */}
      {/* FUERA del <nav> para evitar que quede atrapado en su stacking context */}
      <div
        className={`fixed inset-0 z-40 bg-[#0a0807] transition-all duration-300 flex flex-col items-center justify-center gap-10 md:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <ul className="flex flex-col items-center gap-8" role="list">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`font-display text-4xl font-light tracking-widest transition-colors ${
                    isActive
                      ? "text-[#d97644]"
                      : "text-[#f3ece1] hover:text-[#d97644]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/acceso"
          className="font-mono text-sm tracking-[0.3em] uppercase text-[#0a0807] bg-[#d97644] px-10 py-4 hover:bg-[#e8854f] transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          Acceder
        </Link>
      </div>
    </>
  );
}
