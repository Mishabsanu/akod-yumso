"use client";

import Image from "next/image";
import { useState } from "react";
import { products } from "@/data/products";
import { waLink, WhatsAppIcon } from "@/lib/whatsapp";

export default function OrderWhatsApp() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const items = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const totalBags = items.reduce((n, p) => n + qty[p.id], 0);

  const change = (id: string, d: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] ?? 0) + d)) }));

  const message = [
    "Hi YUMSO! 👋 I'd like to place an order:",
    "",
    ...items.map((p) => `• ${qty[p.id]} x ${p.name} (${p.flavor}) - ${p.weight}`),
    "",
    `Total: ${totalBags} bag${totalBags === 1 ? "" : "s"}`,
    name ? `Name: ${name}` : "",
    address ? `Delivery address: ${address}` : "",
  ]
    .join("\n")
    .trim();

  return (
    <section id="order" className="scroll-mt-20 bg-[#0f2a1a] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-[#25D366]">
            <WhatsAppIcon /> Order on WhatsApp
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl lg:text-6xl">Build Your Snack Box</h2>
          <p className="mt-4 text-white/70">
            Choose your flavours and quantities, then send your order straight to us on WhatsApp.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {products.map((p) => {
              const q = qty[p.id] ?? 0;
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-4 rounded-3xl border-2 bg-white/[0.04] p-4 transition ${
                    q > 0 ? "border-[#25D366]" : "border-white/10"
                  }`}
                >
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={660}
                    height={600}
                    sizes="80px"
                    className={`h-20 w-20 shrink-0 rounded-2xl object-cover ${p.bg}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl tracking-wide">{p.name}</p>
                    <p className="text-xs text-white/60">
                      {p.flavor} · {p.weight}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => change(p.id, -1)}
                        aria-label={`Remove one ${p.name}`}
                        className="h-8 w-8 rounded-full bg-white/10 text-lg font-bold hover:bg-white/20 disabled:opacity-30"
                        disabled={q === 0}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold tabular-nums">{q}</span>
                      <button
                        type="button"
                        onClick={() => change(p.id, 1)}
                        aria-label={`Add one ${p.name}`}
                        className="h-8 w-8 rounded-full bg-[#25D366] text-lg font-bold text-ink hover:brightness-110"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="h-fit rounded-3xl border-4 border-ink bg-white p-6 text-ink shadow-[0_8px_0_#25D366]">
            <h3 className="font-display text-3xl tracking-wide">Your Order</h3>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">Tap + on a flavour to add it to your order.</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {items.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-bold">× {qty[p.id]}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-ink/10 pt-2 font-bold">
                  <span>Total bags</span>
                  <span>{totalBags}</span>
                </li>
              </ul>
            )}
            <div className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                aria-label="Your name"
                className="w-full rounded-xl border-2 border-ink/20 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none"
              />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Delivery address (optional)"
                aria-label="Delivery address"
                className="w-full rounded-xl border-2 border-ink/20 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none"
              />
            </div>
            {items.length ? (
              <a
                href={waLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-bold text-ink shadow-[0_5px_0_#128C7E] transition hover:-translate-y-0.5"
              >
                <WhatsAppIcon /> Send Order on WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-ink/10 px-6 py-3.5 font-bold text-ink/60"
              >
                <WhatsAppIcon /> Send Order on WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
