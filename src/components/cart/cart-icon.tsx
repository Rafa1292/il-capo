import { ShoppingBag } from "lucide-react";
import { isChristmasSeason } from "@/lib/season";

/** Ícono del carrito: en temporada navideña es un trineo tirado por un reno, con el mismo trazo de lucide. */
export function CartIcon({ className }: { className?: string }) {
  if (!isChristmasSeason()) return <ShoppingBag className={className} />;
  return (
    <svg
      viewBox="0 0 44 24"
      style={{ width: "auto", aspectRatio: "44 / 24" }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 5c2 0 3.5 1 4 3s1 3 3 3h5c1.6 0 3-1 3.5-3v3c0 2.5-2 4-4.5 4H9c-3 0-5-2-5-5z" />
      <path d="M8.5 15v4" />
      <path d="M15.5 15v4" />
      <path d="M2 19h17a3 3 0 0 0 3-3" />
      {/* Arnés */}
      <path d="M19.5 9.5 29 12" />
      {/* Reno: lomo, patas, cuello, cabeza y astas */}
      <path d="M29 12h8" />
      <path d="M29 12l-1 7" />
      <path d="M31.5 12v7" />
      <path d="M35 12v7" />
      <path d="M37 12l1 7" />
      <path d="M37 12l2.5-4.5" />
      <path d="M39.5 7.5H43" />
      <path d="M39.5 7.5 38 2" />
      <path d="M38.8 5 41.5 3" />
    </svg>
  );
}
