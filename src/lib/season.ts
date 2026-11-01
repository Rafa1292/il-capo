/**
 * Temporada navideña: del 1 de noviembre al 6 de enero, en hora de Costa Rica.
 * El servidor corre en UTC, así que el mes y el día se piden en la zona del
 * negocio: si no, la decoración cambiaría a las 6 p.m. del día anterior.
 */
export function isChristmasSeason(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Costa_Rica",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return month >= 11 || (month === 1 && day <= 6);
}
