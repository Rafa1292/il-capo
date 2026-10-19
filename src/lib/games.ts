import "server-only";
import { cookies } from "next/headers";
import { nicoPost } from "@/lib/nico";
import { readVerifiedPhone, VERIFIED_PHONE_COOKIE } from "@/lib/cash-verification";
import type { Location } from "@/lib/locations";

export type GamesEntry =
  | { enabled: false }
  | { enabled: true; url: string; direct: boolean; balance: number | null };

/**
 * Los juegos de la sede para este aparato. Si acá ya se comprobó el WhatsApp
 * (pago en efectivo), se le pasa ese número a nico: el link entra directo y
 * viene el saldo de fichas. Si no, el link normal, donde se verifica.
 */
export async function gamesEntry(location: Location): Promise<GamesEntry> {
  const jar = await cookies();
  const phone = readVerifiedPhone(jar.get(VERIFIED_PHONE_COOKIE)?.value);
  const res = await nicoPost<{ data: GamesEntry }>("/api/public/games/entry", { phone }, location);
  return res.data;
}
