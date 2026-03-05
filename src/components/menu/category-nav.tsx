"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/types";

interface Props {
  categories: MenuCategory[];
}

export function CategoryNav({ categories }: Props) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);
  const isManualScroll = useRef(false);

  // IntersectionObserver to update active tab on scroll
  useEffect(() => {
    if (categories.length === 0) return;

    const scrollContainer = (document.querySelector('[data-scroll-container]') as HTMLElement) ?? null;
    const observers: IntersectionObserver[] = [];

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isManualScroll.current) {
            setActive(cat.id);
          }
        },
        { root: scrollContainer, rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  // Keep the active button scrolled into view inside the nav (horizontal only)
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!nav || !btn) return;
    nav.scrollTo({
      left: btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2,
      behavior: "smooth",
    });
  }, [active]);

  function scrollToCategory(id: string) {
    isManualScroll.current = true;
    setActive(id);
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;

    const scrollContainer = (document.querySelector('[data-scroll-container]') as HTMLElement) ?? document.documentElement;
    const containerRect = scrollContainer.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const navHeight = navRef.current?.offsetHeight ?? 44;
    const targetScroll = scrollContainer.scrollTop + (elRect.top - containerRect.top) - navHeight - 8;

    scrollContainer.scrollTo({ top: targetScroll, behavior: "smooth" });
    setTimeout(() => {
      isManualScroll.current = false;
    }, 900);
  }

  return (
    <div className="sticky top-0 z-40 -mx-4 bg-background border-b border-border">
      <div
        ref={navRef}
        className="flex overflow-x-auto px-4"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className={`shrink-0 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
              active === cat.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
