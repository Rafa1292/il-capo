/**
 * Horario de atención.
 *
 * Lo publica el local desde nico, sede por sede (`/api/public/status`). Antes
 * estaba escrito acá: cambiar media hora exigía un despliegue y las dos sedes
 * mostraban el mismo horario a la fuerza. Este archivo ya no decide el horario,
 * solo sabe interpretarlo: pasarlo a minutos, decir si está abierto ahora y
 * agrupar los días para mostrarlos.
 */

export const TIMEZONE = "America/Costa_Rica";

/** Un día con atención, en minutos desde medianoche. */
export interface ScheduleDay {
  /** 0 = domingo, 1 = lunes … 6 = sábado */
  day: number;
  open: number;
  close: number;
}

/** Los días que se atiende. Los ausentes están cerrados. */
export type Schedule = ScheduleDay[];

/** Como viene de nico: la hora en "HH:MM". */
export interface RawScheduleDay {
  day: number;
  open: string;
  close: string;
}

const at = (hour: number, minute = 0) => hour * 60 + minute;

/**
 * El horario de respaldo: el que esta página tenía escrito antes de que nico lo
 * publicara. Solo se usa cuando nico no lo tiene configurado o no responde.
 *
 * Existe porque el horario es informativo y no frena nada: ante una caída, un
 * horario aproximado le sirve más al cliente que un hueco en la página. Si de
 * verdad no se puede atender, lo que corta es el interruptor de pedidos.
 */
export const DEFAULT_SCHEDULE: Schedule = [
  { day: 1, open: at(11), close: at(20, 30) },
  { day: 2, open: at(11), close: at(20, 30) },
  { day: 3, open: at(11), close: at(20, 30) },
  { day: 4, open: at(11), close: at(20, 30) },
  { day: 5, open: at(11), close: at(21, 30) },
  { day: 6, open: at(11), close: at(21, 30) },
  { day: 0, open: at(11), close: at(21, 30) },
];

function toMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Lo que manda nico, pasado a minutos.
 *
 * Una lista vacía es un horario válido —no se atiende ningún día—; solo la
 * ausencia de horario cae al de respaldo. Confundir las dos cosas publicaría un
 * horario inventado y mandaría gente a un local cerrado.
 */
export function parseSchedule(raw: RawScheduleDay[] | null | undefined): Schedule {
  if (!raw) return DEFAULT_SCHEDULE;
  if (raw.length === 0) return [];

  const days: Schedule = [];
  for (const entry of raw) {
    const open = toMinutes(entry.open);
    const close = toMinutes(entry.close);
    if (open === null || close === null || open === close) continue;
    if (entry.day < 0 || entry.day > 6) continue;
    days.push({ day: entry.day, open, close });
  }

  // Venían días y no quedó ninguno: eso es un dato corrupto, no una semana
  // cerrada. Publicar "cerrado siempre" por un error de formato mandaría a la
  // gente a creer que el local cerró.
  return days.length > 0 ? days : DEFAULT_SCHEDULE;
}

/** "20:30". Con dos dígitos en la hora: "1:00" al lado de "17:00" se lee mal. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dayHours(schedule: Schedule, day: number): ScheduleDay | null {
  return schedule.find((d) => d.day === day) ?? null;
}

/** Cierra al día siguiente: abre 17:00 y cierra 01:00. */
function crossesMidnight(d: ScheduleDay): boolean {
  return d.close <= d.open;
}

function isWithin(d: ScheduleDay, minutes: number): boolean {
  // Si cruza medianoche, la parte de la madrugada la resuelve el bloque del día
  // anterior en `openStatus`; acá solo cuenta lo que va de la apertura en
  // adelante.
  return crossesMidnight(d) ? minutes >= d.open : minutes >= d.open && minutes < d.close;
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

/**
 * ¿Está abierto ahora? `hours` son las horas que corresponde mostrar: las de
 * hoy, o las de ayer si seguimos dentro de un cierre pasada la medianoche.
 */
export function openStatus(
  schedule: Schedule,
  now = nowInCostaRica()
): { isOpen: boolean; hours: ScheduleDay | null } {
  const today = dayHours(schedule, now.day);
  if (today && isWithin(today, now.minutes)) return { isOpen: true, hours: today };

  // A la 1 de la mañana del domingo seguimos en la jornada del sábado.
  const yesterday = dayHours(schedule, (now.day + 6) % 7);
  if (yesterday && crossesMidnight(yesterday) && now.minutes < yesterday.close) {
    return { isOpen: true, hours: yesterday };
  }

  return { isOpen: false, hours: today };
}

/** Un tramo de la semana con el mismo horario, ya listo para mostrar. */
export interface ScheduleBlock {
  /** "Lunes – Jueves", "Viernes y Sábado", "Domingo" */
  label: string;
  days: number[];
  /** null = cerrado esos días */
  open: number | null;
  close: number | null;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** La semana empieza el lunes: nadie lee su horario arrancando en domingo. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

function label(days: number[]): string {
  if (days.length === 1) return DAY_NAMES[days[0]];
  const first = DAY_NAMES[days[0]];
  const last = DAY_NAMES[days[days.length - 1]];
  return days.length === 2 ? `${first} y ${last}` : `${first} – ${last}`;
}

/**
 * Junta los días seguidos que tienen la misma hora: siete filas iguales se leen
 * como "Lunes – Domingo". Los días cerrados también salen, porque no verlos se
 * confunde con que la información esté incompleta.
 */
export function scheduleBlocks(schedule: Schedule): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  for (const day of WEEK) {
    const hours = dayHours(schedule, day);
    const previous = blocks[blocks.length - 1];
    const same =
      previous && previous.open === (hours?.open ?? null) && previous.close === (hours?.close ?? null);

    if (same) {
      previous.days.push(day);
      previous.label = label(previous.days);
    } else {
      blocks.push({
        label: DAY_NAMES[day],
        days: [day],
        open: hours?.open ?? null,
        close: hours?.close ?? null,
      });
    }
  }

  return blocks;
}
