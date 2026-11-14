"use client";

import Image from "next/image";
import { useState } from "react";
import { WhatsAppIcon } from "@/lib/whatsapp";

const links = [
  { href: "#store", label: "3D Store" },
  { href: "#products", label: "Products" },
  { href: "#order", label: "Order" },
  { href: "#why", label: "Why YUMSO" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        <a href="#top" aria-label="YUMSO home" className="block h-14 w-28 overflow-hidden">
          <Image
            src="/logo-dark.jpeg"
            alt="YUMSO logo"
            width={794}
            height={600}
            sizes="112px"
            className="h-full w-full scale-125 object-cover"
          />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:text-brand"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#order"
          className="hidden items-center gap-2 rounded-full bg-[#25D366] px-5 py-2 text-sm font-bold text-ink shadow-[0_4px_0_#128C7E] transition hover:-translate-y-0.5 lg:inline-flex"
        >
          <WhatsAppIcon className="h-4 w-4" /> Order Now
        </a>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-white lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="space-y-1 border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 font-semibold text-white/90 hover:bg-white/5 hover:text-brand"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
