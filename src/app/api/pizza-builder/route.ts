import { nicoGet } from "@/lib/nico";
import { NextResponse } from "next/server";
import type { PizzaBuilderData } from "@/types";

export async function GET() {
  try {
    const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder");
    return NextResponse.json(json.data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
