import Image from "next/image";
import { isChristmasSeason } from "@/lib/season";

/** Gorro navideño sobre un avatar. El padre tiene que ser `relative`. Fuera de temporada no pinta nada. */
export function SantaHat({ width, className }: { width: number; className: string }) {
  if (!isChristmasSeason()) return null;
  return (
    <Image
      src="/santa-hat.png"
      alt=""
      width={width}
      height={Math.round((width * 188) / 240)}
      className={`pointer-events-none absolute ${className}`}
    />
  );
}
