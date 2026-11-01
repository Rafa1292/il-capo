import { Great_Vibes } from "next/font/google";
import Image from "next/image";

const greetingFont = Great_Vibes({ weight: "400", subsets: ["latin"] });

// Tres planos de profundidad: lejos es chico, lento y tenue; cerca, grande y rápido.
const SNOW_LAYERS = [
  { size: 6, duration: 26, opacity: 0.75, sway: 10 },
  { size: 10, duration: 17, opacity: 0.9, sway: 18 },
  { size: 15, duration: 11, opacity: 1, sway: 28 },
];

// Valores fijos y no aleatorios: el servidor y el cliente tienen que pintar lo mismo.
const SNOWFLAKES = Array.from({ length: 60 }, (_, i) => {
  const layer = SNOW_LAYERS[i % 3];
  return {
    left: (i * 61.8) % 100,
    size: layer.size + (i % 2),
    opacity: layer.opacity,
    duration: layer.duration + (i * 7) % 6,
    delay: -((i * 13) % 30),
    sway: layer.sway,
    swayDuration: 3 + (i * 11) % 4,
  };
});

/** Nieve de la carta. No recibe toques y queda debajo de la barra y de los diálogos. */
export function ChristmasSnow() {
  return (
    <div aria-hidden className="xmas-snow pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {SNOWFLAKES.map((flake, i) => (
        <span
          key={i}
          className="xmas-flake"
          style={{
            left: `${flake.left}%`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          <span
            className="xmas-flake-core"
            style={
              {
                width: flake.size,
                height: flake.size,
                animationDuration: `${flake.swayDuration}s`,
                "--xmas-sway": `${flake.sway}px`,
              } as React.CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}

/** Saludo de temporada. El margen a los dos lados lo centra aunque Santa ocupe la derecha. */
export function ChristmasGreeting() {
  return (
    <p className={`${greetingFont.className} xmas-shimmer mb-5 py-1 text-center text-[2rem] leading-tight md:text-4xl`}>
      Ya huele a Navidad en il Capo
    </p>
  );
}

/**
 * Santa saliendo de detrás de la primera tarjeta del carrusel, que hace de pared.
 * La foto viene cortada a la derecha: ese borde queda escondido bajo la tarjeta.
 */
export function ChristmasWallSanta() {
  return (
    <div aria-hidden className="pointer-events-none -mr-5 flex shrink-0 snap-start items-end">
      <Image src="/santa-peek.png" alt="" width={100} height={322} draggable={false} />
    </div>
  );
}

/** Cierre de la carta. La foto trae fondo negro, por eso la tarjeta también lo es. */
export function ChristmasClosing() {
  return (
    <div className="mt-8 flex items-center gap-3 overflow-hidden rounded-xl border border-[#c9a24b] bg-black pr-4">
      <Image src="/santa-wink.png" alt="" width={124} height={100} className="shrink-0" />
      <p className="font-serif text-base font-semibold leading-snug text-[#f6f1e7]">
        Santa ya pidió la suya. ¿Y vos?
      </p>
    </div>
  );
}
