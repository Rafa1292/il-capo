// Horario de atención de la pizzería. Fuente única: lo usan el indicador
// "abierto/cerrado" de la portada y el detalle del pie.

export interface ScheduleBlock {
  label: string;
  /** 0 = domingo, 1 = lunes … 6 = sábado */
  days: number[];
  /** minutos desde medianoche */
  open: number;
  close: number;
}

const at = (hour: number, minute = 0) => hour * 60 + minute;

export const TIMEZONE = "America/Costa_Rica";

export const SCHEDULE: ScheduleBlock[] = [
  { label: "Lunes – Jueves", days: [1, 2, 3, 4], open: at(11), close: at(20, 30) },
  { label: "Viernes – Domingo", days: [5, 6, 0], open: at(11), close: at(21, 30) },
];

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function blockForDay(day: number): ScheduleBlock | null {
  return SCHEDULE.find((b) => b.days.includes(day)) ?? null;
}

/**
 * Día y hora EN COSTA RICA, no en el dispositivo.
 *
 * Un cliente de viaje, con VPN o con el reloj mal puesto vería "cerrado" a la
 * hora equivocada si usáramos su zona horaria.
 */
export function nowInCostaRica(date: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  // Con hour12:false algunos runtimes devuelven "24" a la medianoche.
  const hour = Number(value("hour")) % 24;

  return { day, minutes: hour * 60 + Number(value("minute")) };
}

export function openStatus(now = nowInCostaRica()): { isOpen: boolean; block: ScheduleBlock | null } {
  const block = blockForDay(now.day);
  if (!block) return { isOpen: false, block: null };
  return { isOpen: now.minutes >= block.open && now.minutes < block.close, block };
}
