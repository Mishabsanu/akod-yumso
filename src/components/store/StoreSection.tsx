"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/data/products";
import { heroTheme } from "@/data/hero";
import { waLink, WhatsAppIcon } from "@/lib/whatsapp";
import type { StoreEngine, StoreProduct } from "./engine";

const STORE_PRODUCTS: StoreProduct[] = products.map((p) => ({
  id: p.id,
  name: p.name,
  flavor: p.flavor,
  price: heroTheme[p.id].price,
  color: heroTheme[p.id].glow,
  pack: heroTheme[p.id].pack,
}));

export default function StoreSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StoreEngine | null>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [entered, setEntered] = useState(false);
  const [locked, setLocked] = useState(false);
  const [touch, setTouch] = useState(false);
  const [hover, setHover] = useState<StoreProduct | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string; color: string } | null>(null);
  const [full, setFull] = useState(false);

  /* ---------- minimap ---------- */
  const drawMini = useCallback((x: number, z: number, yaw: number) => {
    const c = miniRef.current;
    const eng = engineRef.current;
    if (!c || !eng) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { W, D } = eng.size;
    const s = c.width / W;
    const tx = (vx: number) => (vx + W / 2) * s;
    const tz = (vz: number) => (vz + D / 2) * s;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(10,10,10,0.75)";
    ctx.fillRect(0, 0, c.width, c.height);
    for (const r of eng.layout) {
      ctx.fillStyle = r.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(tx(r.x1), tz(r.z1), (r.x2 - r.x1) * s, (r.z2 - r.z1) * s);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#25D366";
    ctx.fillRect(tx(-2), c.height - 3, 4 * s, 3); // entrance
    ctx.save();
    ctx.translate(tx(x), tz(z));
    ctx.rotate(-yaw);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  /* ---------- lazy-load the 3D engine when the section approaches ---------- */
  const loadingRef = useRef(false);
  const unmountedRef = useRef(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    unmountedRef.current = false;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0].isIntersecting;
        engineRef.current?.setVisible(vis);
        if (!vis || loadingRef.current) return;
        loadingRef.current = true;
        setStatus("loading");
        import("./engine")
          .then(({ createStore }) =>
            createStore(canvasHost.current!, STORE_PRODUCTS, {
              onHover: setHover,
              onPick: (p) => {
                setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
                setToast({ key: Date.now(), text: `+1 ${p.name} · ${p.flavor}`, color: p.color });
              },
              onLock: (l) => {
                setLocked(l);
                if (!l && !matchMedia("(pointer: coarse)").matches) {
                  setEntered(false);
                  engineRef.current?.setActive(false);
                }
              },
              onFrame: (x, z, yaw) => {
                drawMini(x, z, yaw);
                if (wrapRef.current) wrapRef.current.dataset.pos = `${x.toFixed(1)},${z.toFixed(1)}`;
              },
            }),
          )
          .then((eng) => {
            if (unmountedRef.current) return eng.dispose();
            engineRef.current = eng;
            setStatus("ready");
          })
          .catch((err) => {
            console.error("YUMSO store failed to load", err);
            setStatus("error");
          });
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [drawMini]);

  useEffect(
    () => () => {
      unmountedRef.current = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      loadingRef.current = false;
    },
    [],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => engineRef.current?.resize());
    ro.observe(el);
    const onFs = () => setFull(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", onFs);
    const mq = matchMedia("(pointer: coarse)");
    const id = requestAnimationFrame(() => setTouch(mq.matches));
    return () => {
      ro.disconnect();
      document.removeEventListener("fullscreenchange", onFs);
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  // C toggles cart while shopping
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (entered && e.key.toLowerCase() === "c") setCartOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entered]);

  const enter = () => {
    if (!engineRef.current) return;
    setEntered(true);
    engineRef.current.enter();
    if (touch) engineRef.current.setActive(true);
  };
  const exit = () => {
    engineRef.current?.exit();
    setEntered(false);
  };
  const toggleFull = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  };

  /* ---------- cart ---------- */
  const lines = useMemo(() => STORE_PRODUCTS.filter((p) => (cart[p.id] ?? 0) > 0), [cart]);
  const count = lines.reduce((n, p) => n + cart[p.id], 0);
  const total = lines.reduce((n, p) => n + cart[p.id] * p.price, 0);
  const message = [
    "Hi YUMSO! 🛒 My order from your 3D store:",
    "",
    ...lines.map((p) => `• ${cart[p.id]} x ${p.name} (${p.flavor}) @ $${p.price.toFixed(2)}`),
    "",
    `Total: ${count} bag${count === 1 ? "" : "s"} · $${total.toFixed(2)} CAD`,
  ].join("\n");
  const removeOne = (id: string) => {
    engineRef.current?.removeOne(id);
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }));
  };

  /* ---------- touch controls ---------- */
  const joyBase = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const joyMove = (e: React.PointerEvent) => {
    const b = joyBase.current?.getBoundingClientRect();
    if (!b) return;
    let dx = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
    let dy = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    setKnob({ x: dx, y: dy });
    engineRef.current?.setMove(dx, -dy);
  };
  const joyEnd = () => {
    setKnob({ x: 0, y: 0 });
    engineRef.current?.setMove(0, 0);
  };
  const lookState = useRef<{ x: number; y: number; sx: number; sy: number; t: number } | null>(null);

  const showLookLayer = entered && !locked;

  return (
    <section id="store" aria-label="YUMSO 3D store" className="relative bg-black">
      <div ref={wrapRef} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden select-none">
        <div ref={canvasHost} className="absolute inset-0" />

        {/* drag-to-look / tap-to-pick layer (touch, or desktop without pointer lock) */}
        {showLookLayer && (
          <div
            className="absolute inset-0 z-10 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              lookState.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
            }}
            onPointerMove={(e) => {
              const s = lookState.current;
              if (!s) return;
              engineRef.current?.look((e.clientX - s.x) * 1.4, (e.clientY - s.y) * 1.4);
              s.x = e.clientX;
              s.y = e.clientY;
            }}
            onPointerUp={(e) => {
              const s = lookState.current;
              lookState.current = null;
              if (s && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < 8 && performance.now() - s.t < 300)
                engineRef.current?.pickAt(e.clientX, e.clientY);
            }}
          />
        )}

        {/* ---------- start / pause screen ---------- */}
        {!entered && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-black/70 via-black/40 to-black/80 px-4 text-center text-white">
            <div className="max-w-xl" data-reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">Virtual shopping · 3D</p>
              <h2 className="mt-3 font-display text-5xl tracking-wide md:text-7xl">
                Step inside the <span className="text-brand">YUMSO Store</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-white/75 md:text-base">
                Walk the aisles, grab packs straight off the shelf into your cart, then check out on WhatsApp.
              </p>
              <button
                type="button"
                onClick={enter}
                disabled={status !== "ready"}
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand px-8 py-4 font-bold text-ink shadow-[0_6px_0_#a67800] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {status === "ready" ? (count ? "🛒 Resume shopping" : "🛒 Enter the store") : status === "error" ? "3D not supported on this device" : "Loading store…"}
              </button>
              <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 text-left text-xs text-white/75 sm:grid-cols-4">
                {(touch
                  ? [["🕹️", "Left stick: walk"], ["👆", "Drag: look"], ["🫳", "Tap pack: add"], ["🛒", "Cart: top right"]]
                  : [["⌨️", "WASD / arrows: walk"], ["🖱️", "Mouse: look"], ["🖱️", "Click / E: add pack"], ["⎋", "Esc: pause · C: cart"]]
                ).map(([i, t]) => (
                  <div key={t} className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <span className="text-lg">{i}</span>
                    <p className="mt-1 font-semibold">{t}</p>
                  </div>
                ))}
              </div>
              {count > 0 && (
                <a
                  href={waLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-ink"
                >
                  <WhatsAppIcon /> Checkout {count} item{count > 1 ? "s" : ""} · ${total.toFixed(2)}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ---------- HUD ---------- */}
        {entered && (
          <>
            {/* crosshair */}
            {!touch && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`h-3 w-3 rounded-full border-2 transition ${hover ? "scale-150 border-[#25D366]" : "border-white/80"}`}
                />
              </div>
            )}

            {/* hover label */}
            {hover && (
              <div className="pointer-events-none absolute left-1/2 top-[58%] z-20 -translate-x-1/2 rounded-2xl border border-white/20 bg-black/70 px-4 py-2 text-center text-white backdrop-blur-md">
                <p className="font-display text-xl tracking-wide" style={{ color: hover.color }}>
                  {hover.name} · {hover.flavor}
                </p>
                <p className="text-xs text-white/80">
                  ${hover.price.toFixed(2)} · {touch ? "Tap to add to cart" : "Click or press E to add to cart"}
                </p>
              </div>
            )}

            {/* toast */}
            {toast && (
              <div
                key={toast.key}
                className="hero-fade pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-bold text-ink shadow-xl"
                style={{ background: toast.color }}
              >
                🛒 {toast.text}
              </div>
            )}

            {/* top bar */}
            <div className="absolute right-3 top-3 z-30 flex gap-2">
              <button
                type="button"
                onClick={() => setCartOpen((o) => !o)}
                className="relative flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-ink shadow-lg"
              >
                🛒 Cart
                {count > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#25D366] px-1.5 text-xs">{count}</span>
                )}
              </button>
              <button
                type="button"
                onClick={toggleFull}
                aria-label={full ? "Exit fullscreen" : "Fullscreen"}
                className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg sm:flex"
              >
                {full ? "⤡" : "⤢"}
              </button>
              <button
                type="button"
                onClick={exit}
                className="h-11 rounded-full bg-black/70 px-4 text-sm font-bold text-white shadow-lg backdrop-blur"
              >
                Exit
              </button>
            </div>

            {/* cart panel */}
            {cartOpen && (
              <div className="absolute right-3 top-16 z-30 w-[min(92vw,320px)] rounded-3xl bg-white p-5 text-ink shadow-2xl">
                <h3 className="font-display text-3xl tracking-wide">Your Cart</h3>
                {lines.length === 0 ? (
                  <p className="mt-2 text-sm text-ink/60">Empty. Grab a pack from any shelf!</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {lines.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeOne(p.id)}
                            aria-label={`Remove one ${p.name}`}
                            className="h-7 w-7 rounded-full bg-ink/10 font-bold"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold">{cart[p.id]}</span>
                          <span className="w-14 text-right">${(cart[p.id] * p.price).toFixed(2)}</span>
                        </span>
                      </li>
                    ))}
                    <li className="flex justify-between border-t border-ink/10 pt-2 font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </li>
                  </ul>
                )}
                {lines.length > 0 && (
                  <a
                    href={waLink(message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-ink"
                  >
                    <WhatsAppIcon /> Checkout on WhatsApp
                  </a>
                )}
                {!touch && locked && <p className="mt-3 text-center text-[11px] text-ink/50">Press Esc to use the mouse here</p>}
              </div>
            )}

            {/* minimap */}
            <canvas
              ref={miniRef}
              width={130}
              height={170}
              className="absolute left-3 top-3 z-20 rounded-xl border border-white/20 shadow-lg sm:bottom-4 sm:top-auto"
            />

            {/* joystick */}
            {touch && (
              <div
                ref={joyBase}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  joyMove(e);
                }}
                onPointerMove={(e) => e.buttons && joyMove(e)}
                onPointerUp={joyEnd}
                onPointerCancel={joyEnd}
                className="absolute bottom-8 left-6 z-30 h-32 w-32 touch-none rounded-full border-2 border-white/40 bg-white/10 backdrop-blur"
              >
                <div
                  className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/80 shadow-lg"
                  style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${knob.y * 36}px))` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
