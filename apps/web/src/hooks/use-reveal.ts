"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal via IntersectionObserver (ported from docs/index.html).
 *
 * Usage:
 *   const [ref, visible] = useReveal<HTMLDivElement>();
 *   <div ref={ref} className={`reveal ${visible ? "visible" : ""}`}>
 *
 * - Fires once per element (unobserved after first intersection).
 * - Honors prefers-reduced-motion by revealing immediately.
 * - `delay` adds a reveal-delay-N class for staggered children.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      queueMicrotask(() => setVisible(true));
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (options?.once !== false) observer.unobserve(entry.target);
          } else if (options?.once === false) {
            setVisible(false);
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return [ref, visible] as const;
}

/**
 * Observes ALL `.reveal` descendants inside a container and adds `.visible`
 * as they scroll into view — lets a whole page opt into staggered reveals
 * without wiring a ref per element.
 *
 * Usage: const containerRef = useRevealAll();
 */
export function useRevealAll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = root.querySelectorAll<HTMLElement>(".reveal:not(.visible)");
    if (reduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
