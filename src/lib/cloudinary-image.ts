/**
 * Normaliza fotos de Cloudinary para mostrarlas en grilla.
 *
 * El problema que resuelve: las fotos se suben con la forma que tengan. Al
 * meterlas en un cuadro, o se recortan (y al ingrediente le falta un pedazo) o
 * quedan de tamaños distintos y la grilla se ve desalineada.
 *
 * `c_pad,ar_1:1` mete la foto entera dentro de un cuadrado y rellena lo que
 * sobra, sin recortar nada. `b_transparent` deja ese relleno invisible, así que
 * el ingrediente se ve apoyado sobre la página y no dentro de una caja — esto
 * asume PNG con fondo transparente, que es como se suben.
 *
 * `f_auto,q_auto` son de yapa pero pesan: la misma foto pasa de 577 KB a 54 KB,
 * y esto es un menú público que se abre desde el celular con datos.
 *
 * Una URL que no sea de Cloudinary vuelve intacta.
 */

const MARKER = "/image/upload/";
const TRANSFORM = "c_pad,ar_1:1,b_transparent,f_auto,q_auto";

export function squareImage(url: string, width = 400): string {
  const at = url.indexOf(MARKER);
  if (at === -1) return url;

  const head = url.slice(0, at + MARKER.length);
  const tail = url.slice(at + MARKER.length);

  // Ya normalizada: no se le encima otra transformación.
  if (tail.startsWith("c_pad,ar_1:1")) return url;

  return `${head}${TRANSFORM},w_${width}/${tail}`;
}
