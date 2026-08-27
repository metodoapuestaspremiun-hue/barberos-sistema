"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/como-funciona", label: "Cómo Funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/historias", label: "Historias" },
  { href: "/resenas", label: "Reseñas" },
  { href: "/acceso", label: "Acceso" },
];

export default function FooterPublic() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/acceso") {
    return null;
  }

  return (
    <footer
      className="border-t border-[#2a2520] bg-[#0a0807] py-16 px-6"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Marca */}
          <div>
            <p className="font-display text-2xl font-light tracking-widest text-[#f3ece1] mb-3">
              BarberOS
            </p>
            <p className="font-mono text-xs text-[#5c554c] tracking-widest uppercase max-w-xs">
              El sistema operativo de tu barbería.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Navegación de pie de página">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-3" role="list">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-mono text-xs tracking-[0.15em] uppercase text-[#5c554c] hover:text-[#a89e90] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2a2520] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-[#5c554c]">
            © {new Date().getFullYear()} BarberOS. Todos los derechos reservados.
          </p>
          <p className="font-mono text-xs text-[#3a3530]">
            Diseñado por{" "}
            <a
              href="https://www.cesarreyesjaramillo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#a89e90] underline transition-colors"
            >
              César Reyes
            </a>
            {" "}| BarberOSPlus {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
