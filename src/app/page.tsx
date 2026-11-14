import Image from "next/image";
import Navbar from "@/components/Navbar";
import ScrollHero from "@/components/ScrollHero";
import StoreSection from "@/components/store/StoreSection";
import RevealObserver from "@/components/RevealObserver";
import ProductShowcase from "@/components/ProductShowcase";
import ContactForm from "@/components/ContactForm";
import OrderWhatsApp from "@/components/OrderWhatsApp";
import StructuredData from "@/components/StructuredData";
import { waLink, WhatsAppIcon, WHATSAPP_NUMBER } from "@/lib/whatsapp";

const features = [
  { icon: "🥔", title: "Real Ingredients", text: "Simple, recognisable ingredients. No shortcuts, just great taste." },
  { icon: "🍁", title: "Made in Canada", text: "Proudly produced in Canada with locally sourced crops." },
  { icon: "💥", title: "Bigger Crunch", text: "Cooked to the perfect crisp so every bite crunches loud." },
  { icon: "🎉", title: "Better Fun", text: "Made for movie nights, game days, lunchboxes and road trips." },
];

const marquee = ["Classic Chips", "Hot & Spicy Nachos", "Cheese Puff", "Sea Salt Popcorn"];

export default function Home() {
  return (
    <div id="top">
      <StructuredData />
      <RevealObserver />
      <Navbar />

      <main>
        {/* HERO */}
        <ScrollHero />

        {/* 3D STORE */}
        <StoreSection />

        {/* MARQUEE */}
        <div className="overflow-hidden border-y-4 border-ink bg-brand py-4 text-ink">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-3xl tracking-wide">
            {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
              <span key={i} className="flex items-center gap-10">
                {m} <span aria-hidden>★</span>
              </span>
            ))}
          </div>
        </div>

        <ProductShowcase />

        <OrderWhatsApp />

        {/* WHY */}
        <section id="why" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <p className="font-bold uppercase tracking-[0.2em] text-brand">Why YUMSO</p>
              <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl lg:text-6xl">
                Snacking, Done Right
              </h2>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  data-reveal
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-brand/60"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-3xl">
                    {f.icon}
                  </div>
                  <h3 className="mt-5 font-display text-2xl tracking-wide">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="scroll-mt-20 bg-white py-20 text-ink sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div data-reveal className="overflow-hidden rounded-[2rem] border-4 border-ink shadow-[0_10px_0_#0b0b0b]">
              <Image
                src="/logo.jpeg"
                alt="YUMSO logo"
                width={796}
                height={600}
                sizes="(min-width: 1024px) 600px, 100vw"
                className="w-full scale-[1.02]"
              />
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-brand-text">Our Story</p>
              <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl lg:text-6xl">
                Born to Make You Say &ldquo;Yum, So Good!&rdquo;
              </h2>
              <p className="mt-6 leading-relaxed text-ink/70">
                YUMSO started with a simple idea: snacks should be fun, flavour-packed and made with
                ingredients you can feel good about. From our kitchens in Canada, we craft every
                batch for the biggest crunch and the boldest taste.
              </p>
              <p className="mt-4 leading-relaxed text-ink/70">
                Whether you&apos;re team Classic, team Spicy, team Cheesy or team Popcorn, there&apos;s a
                YUMSO bag waiting for you.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[
                  ["4", "Flavours"],
                  ["100%", "Real Taste"],
                  ["🍁", "Made in Canada"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-2xl bg-cream p-4">
                    <p className="font-display text-4xl text-brand-text">{n}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="scroll-mt-20 bg-brand py-20 text-ink sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="font-bold uppercase tracking-[0.2em]">Get in Touch</p>
              <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl lg:text-6xl">
                Want YUMSO on Your Shelves?
              </h2>
              <p className="mt-6 max-w-md text-ink/80">
                Retailers, distributors and snack fans: drop us a line and our team will reply
                within one business day.
              </p>
              <ul className="mt-8 space-y-3 font-semibold">
                <li>📧 hello@yumso.ca</li>
                <li>
                  <a
                    href={waLink("Hi YUMSO! 👋")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <WhatsAppIcon /> WhatsApp: +{WHATSAPP_NUMBER}
                  </a>
                </li>
                <li>📍 Canada</li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={waLink("Hi YUMSO! 👋 I'd like to place an order.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-ink shadow-xl ring-4 ring-white/20 transition hover:scale-110"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="h-16 w-32 overflow-hidden">
            <Image
              src="/logo-dark.jpeg"
              alt="YUMSO logo"
              width={794}
              height={600}
              sizes="128px"
              className="h-full w-full scale-125 object-cover"
            />
          </div>
          <p className="text-sm text-white/50">
            © 2026 YUMSO Snacks. Bigger Crunch · Better Fun.
          </p>
        </div>
      </footer>
    </div>
  );
}
