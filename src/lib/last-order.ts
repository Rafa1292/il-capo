// Guarda en el dispositivo la referencia al último pedido creado (id + token de
// acceso). Es la red de seguridad del cliente: si cierra o refresca la página de
// retorno después de pagar, puede volver a /pedido/[id]?t=... sin perder el link.
// Solo se usa en el cliente (localStorage).

const KEY = "il-capo-last-order";

export interface LastOrder {
  id: string;
  accessToken: string;
  createdAt: number;
}

export function saveLastOrder(id: string, accessToken: string): void {
  try {
    const value: LastOrder = { id, accessToken, createdAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // localStorage lleno o bloqueado: no es crítico.
  }
}

export function getLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    if (!parsed?.id || !parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function lastOrderUrl(o: LastOrder): string {
  return `/pedido/${o.id}?t=${encodeURIComponent(o.accessToken)}`;
}
