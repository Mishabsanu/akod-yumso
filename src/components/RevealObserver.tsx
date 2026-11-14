"use client";

import { useEffect } from "react";

/** Adds `.revealed` to every `[data-reveal]` element as it scrolls into view. */
export default function RevealObserver() {
  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    const observe = () => document.querySelectorAll("[data-reveal]:not(.revealed)").forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
