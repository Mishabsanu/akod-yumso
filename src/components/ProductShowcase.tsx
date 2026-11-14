"use client";

import Image from "next/image";
import { useState } from "react";
import { products } from "@/data/products";
import { waLink, WhatsAppIcon } from "@/lib/whatsapp";

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const p = products[active];

  return (
    <section id="products" className="scroll-mt-20 bg-cream py-20 text-ink sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-brand-text">Our Snacks</p>
          <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl lg:text-6xl">
            Pick Your Crunch
          </h2>
          <p className="mt-4 text-ink/70">
            Four bold flavours, one promise: real ingredients and great taste in every bag.
          </p>
        </div>

        {/* Flavour tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-3" role="group" aria-label="Choose a flavour">
          {products.map((item, i) => (
            <button
              key={item.id}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`rounded-full border-2 border-ink px-5 py-2 text-sm font-bold transition ${
                i === active
                  ? `${item.bg} text-white shadow-[0_4px_0_#0b0b0b] ${item.id === "chips" ? "!text-ink" : ""}`
                  : "bg-white hover:-translate-y-0.5"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Featured product */}
        <div
          data-reveal
          className={`mt-10 grid items-center gap-8 overflow-hidden rounded-[2rem] border-4 border-ink p-6 shadow-[0_10px_0_#0b0b0b] transition-colors duration-500 sm:p-10 lg:grid-cols-2 ${p.bg}`}
        >
          <div className="relative mx-auto w-full max-w-md">
            <Image
              key={p.id}
              src={p.image}
              alt={`YUMSO ${p.name} ${p.flavor}`}
              width={660}
              height={600}
              sizes="(min-width: 1024px) 448px, 90vw"
              className="animate-float w-full rounded-3xl border-4 border-ink shadow-2xl"
            />
          </div>
          <div className={p.id === "chips" ? "text-ink" : "text-white"}>
            <span className={`inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest ${p.chip}`}>
              {p.badge}
            </span>
            <h3 className="text-stroke mt-4 font-display text-5xl tracking-wide text-white sm:text-6xl lg:text-7xl">
              {p.name}
            </h3>
            <p className="mt-1 font-display text-3xl tracking-wide">{p.flavor}</p>
            <p className="mt-5 max-w-lg text-base leading-relaxed opacity-90">{p.description}</p>
            <dl className="mt-6 flex flex-wrap gap-6 text-sm font-semibold">
              <div>
                <dt className="opacity-70">Net Wt.</dt>
                <dd className="text-lg">{p.weight}</dd>
              </div>
              <div>
                <dt className="opacity-70">Made in</dt>
                <dd className="text-lg">Canada 🍁</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border-2 border-ink bg-white text-ink">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="h-11 w-11 text-xl font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                  className="h-11 w-11 text-xl font-bold"
                >
                  +
                </button>
              </div>
              <a
                href={waLink(
                  `Hi YUMSO! 👋 I'd like to order ${qty} x ${p.name} (${p.flavor}) - ${p.weight}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-[#25D366] px-7 py-3 font-bold text-ink shadow-[0_5px_0_#0b0b0b] transition hover:-translate-y-0.5"
              >
                <WhatsAppIcon /> Order on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Grid of all products */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((item, i) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border-4 border-ink bg-white shadow-[0_6px_0_#0b0b0b] transition hover:-translate-y-1 sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block w-full text-left"
              >
                <div className={`overflow-hidden ${item.bg}`}>
                  <Image
                    src={item.image}
                    alt={`YUMSO ${item.name}`}
                    width={660}
                    height={600}
                    sizes="(min-width: 1024px) 300px, 50vw"
                    className="aspect-[11/10] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-3 pt-3 sm:px-5 sm:pt-5">
                  <h3 className="font-display text-2xl tracking-wide sm:text-3xl">{item.name}</h3>
                  <p className="text-xs font-semibold text-ink/60 sm:text-sm">
                    {item.flavor} · {item.weight}
                  </p>
                </div>
              </button>
              <div className="p-3 sm:p-5 sm:pt-4">
                <a
                  href={waLink(`Hi YUMSO! 👋 I'd like to order ${item.name} (${item.flavor}) - ${item.weight}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-xs font-bold text-ink transition hover:brightness-105 sm:text-sm"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Order<span className="hidden sm:inline"> on WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
