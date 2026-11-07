"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-3xl border-4 border-ink bg-white p-10 text-center text-ink shadow-[0_8px_0_#0b0b0b]">
        <p className="font-display text-4xl tracking-wide">Thanks! 🎉</p>
        <p className="mt-2 text-ink/70">We got your message and will get back to you soon.</p>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-brand/60";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: connect to an email service or API route
        setSent(true);
      }}
      className="space-y-4 rounded-3xl border-4 border-ink bg-white p-6 text-ink shadow-[0_8px_0_#0b0b0b] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input required name="name" aria-label="Your name" placeholder="Your name" className={input} />
        <input required type="email" name="email" aria-label="Email address" placeholder="Email address" className={input} />
      </div>
      <select name="topic" aria-label="Topic" className={input} defaultValue="">
        <option value="" disabled>
          I&apos;m interested in…
        </option>
        <option>Becoming a retailer / distributor</option>
        <option>Bulk & event orders</option>
        <option>General question</option>
      </select>
      <textarea required name="message" aria-label="Your message" rows={4} placeholder="Your message" className={input} />
      <button
        type="submit"
        className="w-full rounded-full border-2 border-ink bg-brand px-6 py-3 font-bold text-ink shadow-[0_5px_0_#0b0b0b] transition hover:-translate-y-0.5"
      >
        Send Message
      </button>
    </form>
  );
}
