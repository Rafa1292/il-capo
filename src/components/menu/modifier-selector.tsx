"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Minus, Plus, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MenuItem,
  ModifierGroup,
  CombinableElement,
  CartModifierGroup,
  CartModifierElement,
} from "@/types";

type Sel = Record<string, Record<string, number>>; // groupId -> elementId -> qty
type Combine = Record<string, string>; // groupId -> elementId de la 2ª mitad
type Unit = { sel: Sel; combine: Combine };
type ConfigLine = { modifiers: CartModifierGroup[]; quantity: number };

interface Props {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  onConfirm: (lines: ConfigLine[]) => void;
}

export function ModifierSelector({ item, open, onClose, onConfirm }: Props) {
  // Una configuración por cada unidad pedida
  const [units, setUnits] = useState<Unit[]>([{ sel: {}, combine: {} }]);
  const [active, setActive] = useState(0);
  // Grupo cuyo selector de "2ª mitad" está abierto
  const [pickerGroup, setPickerGroup] = useState<string | null>(null);
  // Grupos contraídos (acordeón)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Paso de upsell (order bump) antes de confirmar
  const [showUpsell, setShowUpsell] = useState(false);

  function toggleCollapse(groupId: string) {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  const count = units.length;
  const activeUnit = units[active] ?? { sel: {}, combine: {} };

  function updateActive(fn: (u: Unit) => Unit) {
    setUnits((prev) => prev.map((u, i) => (i === active ? fn(u) : u)));
  }

  function selectUnit(i: number) {
    setActive(i);
    setPickerGroup(null);
  }

  function getQty(groupId: string, elementId: string) {
    return activeUnit.sel[groupId]?.[elementId] ?? 0;
  }

  // Múltiple: ajusta cantidad de un elemento (con tope de grupo)
  function setQty(groupId: string, elementId: string, qty: number, maxSelect: number) {
    updateActive((u) => {
      const group = { ...(u.sel[groupId] ?? {}) };
      const groupTotal = Object.values(group).reduce((s, v) => s + v, 0);
      const current = group[elementId] ?? 0;
      const delta = qty - current;
      if (delta > 0 && groupTotal + delta > maxSelect) return u; // cap
      if (qty <= 0) delete group[elementId];
      else group[elementId] = qty;
      return { ...u, sel: { ...u.sel, [groupId]: group } };
    });
  }

  // Contrae el grupo resuelto y expande el siguiente (flujo tipo wizard)
  function autoAdvance(groupId: string) {
    const idx = item.modifierGroups.findIndex((g) => g.modifierGroupId === groupId);
    const next = item.modifierGroups[idx + 1];
    setCollapsed((prev) => {
      const state = { ...prev, [groupId]: true };
      if (next) state[next.modifierGroupId] = false;
      return state;
    });
  }

  // Elegir uno: reemplaza la selección; cambiar el 1er sabor descarta la combinación previa
  function selectSingle(groupId: string, elementId: string, required: boolean) {
    const alreadySelected = (activeUnit.sel[groupId]?.[elementId] ?? 0) > 0;
    const willDeselect = alreadySelected && !required;

    updateActive((u) => {
      let sel: Sel;
      if (willDeselect) {
        const g = { ...(u.sel[groupId] ?? {}) };
        delete g[elementId];
        sel = { ...u.sel, [groupId]: g };
      } else {
        sel = { ...u.sel, [groupId]: { [elementId]: 1 } };
      }
      const combine = { ...u.combine };
      delete combine[groupId];
      return { sel, combine };
    });
    if (pickerGroup === groupId) setPickerGroup(null);

    if (willDeselect) return;
    // Si el sabor es combinable, no avanzamos: dejamos elegir "Combinar mitad"
    const el = item.modifierGroups
      .find((g) => g.modifierGroupId === groupId)
      ?.elements.find((e) => e.modifierElementId === elementId);
    if (el?.combinable) return;

    setTimeout(() => autoAdvance(groupId), 220);
  }

  function chooseCombine(groupId: string, elementId: string) {
    updateActive((u) => ({ ...u, combine: { ...u.combine, [groupId]: elementId } }));
    setPickerGroup(null);
  }

  function removeCombine(groupId: string) {
    updateActive((u) => {
      const c = { ...u.combine };
      delete c[groupId];
      return { ...u, combine: c };
    });
  }

  function setCount(n: number) {
    const next = Math.max(1, n);
    setUnits((prev) => {
      if (next > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: next - prev.length }, () => ({ sel: {}, combine: {} }) as Unit),
        ];
      }
      return prev.slice(0, next);
    });
    setActive((a) => Math.min(a, next - 1));
    setPickerGroup(null);
  }

  // Sabor seleccionado (1ª mitad) de un grupo de elegir uno
  function firstSelectedElement(group: ModifierGroup, u: Unit) {
    const sel = u.sel[group.modifierGroupId] ?? {};
    const id = Object.keys(sel).find((k) => sel[k] > 0);
    return id ? group.elements.find((e) => e.modifierElementId === id) : undefined;
  }

  // Elemento de la 2ª mitad (combinada) resuelto desde el 1er sabor
  function combinedElement(group: ModifierGroup, u: Unit): CombinableElement | null {
    const combinedId = u.combine[group.modifierGroupId];
    if (!combinedId) return null;
    const first = firstSelectedElement(group, u);
    return first?.combinableGroupElements?.find((e) => e.modifierElementId === combinedId) ?? null;
  }

  // Resumen de lo elegido en un grupo (para mostrar cuando está contraído)
  function groupSummary(group: ModifierGroup, u: Unit): string {
    if (group.maxSelect === 1) {
      const first = firstSelectedElement(group, u);
      if (!first) return "";
      const comb = combinedElement(group, u);
      return comb ? `${first.name.trim()} / ${comb.name.trim()}` : first.name.trim();
    }
    const sel = u.sel[group.modifierGroupId] ?? {};
    return group.elements
      .filter((e) => (sel[e.modifierElementId] ?? 0) > 0)
      .map((e) => {
        const q = sel[e.modifierElementId];
        return (q > 1 ? `${q}× ` : "") + e.name.trim();
      })
      .join(", ");
  }

  function isValid(u: Unit) {
    for (const group of item.modifierGroups) {
      const total = Object.values(u.sel[group.modifierGroupId] ?? {}).reduce((s, v) => s + v, 0);
      if (total < group.minSelect) return false;
    }
    return true;
  }

  function buildModifiers(u: Unit): CartModifierGroup[] {
    return item.modifierGroups
      .map((g) => {
        const sel = u.sel[g.modifierGroupId] ?? {};
        const elements: CartModifierElement[] = g.elements
          .filter((el) => (sel[el.modifierElementId] ?? 0) > 0)
          .map((el) => ({
            modifierElementId: el.modifierElementId,
            name: el.name,
            price: el.price,
            quantity: sel[el.modifierElementId],
          }));
        const combined = combinedElement(g, u);
        if (combined) {
          elements.push({
            modifierElementId: combined.modifierElementId,
            name: combined.name,
            price: combined.price,
            quantity: 1,
            isCombined: true,
          });
        }
        return { ...g, elements };
      })
      .filter((g) => g.elements.length > 0);
  }

  function lineUnit(u: Unit) {
    return item.modifierGroups.reduce((sum, g) => {
      const sel = u.sel[g.modifierGroupId] ?? {};
      const normal = g.elements.reduce(
        (s, el) => s + (sel[el.modifierElementId] ?? 0) * el.price,
        0
      );
      const combined = combinedElement(g, u);
      return sum + normal + (combined?.price ?? 0);
    }, item.price);
  }

  const allValid = units.every(isValid);
  const total = units.reduce((s, u) => s + lineUnit(u), 0);

  // Grupos opcionales (extras/adicionales) — candidatos a upsell
  const optionalGroups = item.modifierGroups.filter(
    (g) => g.minSelect === 0 && g.elements.length > 0
  );
  const noExtrasChosen = units.every((u) =>
    optionalGroups.every(
      (g) => Object.values(u.sel[g.modifierGroupId] ?? {}).reduce((s, v) => s + v, 0) === 0
    )
  );
  // Solo ofrecemos el order-bump para una sola pizza (evita ambigüedad de a cuál sumar)
  const canUpsell = count === 1 && optionalGroups.length > 0 && noExtrasChosen;

  function reset() {
    setUnits([{ sel: {}, combine: {} }]);
    setActive(0);
    setPickerGroup(null);
    setCollapsed({});
    setShowUpsell(false);
  }

  function handleConfirm() {
    if (!allValid) return;
    if (canUpsell && !showUpsell) {
      setShowUpsell(true);
      return;
    }
    onConfirm(units.map((u) => ({ modifiers: buildModifiers(u), quantity: 1 })));
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl flex flex-col max-h-[88vh] p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="text-base">{item.name}</SheetTitle>
        </SheetHeader>

        {!showUpsell ? (
          <>
        {/* Cantidad + unidades — barra compacta de una sola fila */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 shrink-0">
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setCount(count - 1)}
              disabled={count <= 1}
              aria-label="Quitar uno"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-5 text-center text-sm font-semibold tabular-nums">{count}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setCount(count + 1)}
              aria-label="Agregar uno"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {count > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pl-1" style={{ scrollbarWidth: "none" }}>
              {units.map((u, i) => {
                const valid = isValid(u);
                return (
                  <button
                    key={i}
                    onClick={() => selectUnit(i)}
                    className={cn(
                      "relative h-8 w-8 shrink-0 rounded-full border text-xs font-semibold transition-colors",
                      active === i
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-muted text-foreground hover:bg-muted/70"
                    )}
                  >
                    {i + 1}
                    {valid && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-emerald-500 text-white">
                        <Check className="h-2 w-2" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Cantidad de pizzas</span>
          )}
        </div>

        {/* Formulario de la unidad activa */}
        <div className="space-y-6 px-5 py-4 overflow-y-auto flex-1">
          {item.modifierGroups.map((group) => {
            const groupId = group.modifierGroupId;
            const single = group.maxSelect === 1;
            const required = group.minSelect > 0;
            const groupSel = activeUnit.sel[groupId] ?? {};
            const groupTotal = Object.values(groupSel).reduce((s, v) => s + v, 0);
            const atMax = groupTotal >= group.maxSelect;
            const incomplete = groupTotal < group.minSelect;
            const helper = single
              ? "Elegí 1"
              : required
                ? `Elegí al menos ${group.minSelect}`
                : `Opcional · hasta ${group.maxSelect}`;

            const firstEl = single ? firstSelectedElement(group, activeUnit) : undefined;
            const canCombine = !!(
              firstEl?.combinable &&
              firstEl.combinableGroupElements &&
              firstEl.combinableGroupElements.length > 0
            );
            const combined = single ? combinedElement(group, activeUnit) : null;

            // ── Modo picker: elegir la 2ª mitad (swap del grupo) ──
            if (single && pickerGroup === groupId && firstEl) {
              return (
                <div key={groupId} className="space-y-2.5">
                  <div className="space-y-1 text-center">
                    <h3 className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-foreground">
                      <span className="text-[9px] text-primary/70">✦</span>
                      Combinar con
                      <span className="text-[9px] text-primary/70">✦</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Primera mitad:{" "}
                      <span className="font-medium text-foreground">{firstEl.name.trim()}</span>
                    </p>
                    <button
                      onClick={() => setPickerGroup(null)}
                      className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {firstEl.combinableGroupElements!
                      .filter((ce) => ce.modifierElementId !== firstEl.modifierElementId)
                      .map((ce) => (
                        <button
                          key={ce.modifierElementId}
                          type="button"
                          onClick={() => chooseCombine(groupId, ce.modifierElementId)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                        >
                          <span className="min-w-0">
                            <span className="text-sm font-medium">{ce.name.trim()}</span>
                            {ce.price > 0 && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                +₡{ce.price.toLocaleString("es-CR")}
                              </span>
                            )}
                          </span>
                          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                  </div>
                </div>
              );
            }

            const isCollapsed = !!collapsed[groupId];
            const summary = groupSummary(group, activeUnit);

            return (
              <div key={groupId}>
                <button
                  type="button"
                  onClick={() => toggleCollapse(groupId)}
                  className="relative flex w-full flex-col items-center gap-1"
                >
                  <h3 className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-foreground">
                    <span className="text-[9px] text-primary/70">✦</span>
                    {group.name}
                    <span className="text-[9px] text-primary/70">✦</span>
                  </h3>
                  <span
                    className={cn(
                      "px-6 text-[11px] font-medium",
                      isCollapsed && summary
                        ? "text-foreground"
                        : required && incomplete
                          ? "text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    {isCollapsed ? summary || helper : helper}
                  </span>
                  <ChevronDown
                    className={cn(
                      "absolute right-0 top-0.5 h-4 w-4 text-muted-foreground transition-transform",
                      !isCollapsed && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-2.5 pt-2.5">
                    {canCombine && !combined && (
                      <div className="text-center">
                        <button
                          onClick={() => setPickerGroup(groupId)}
                          className="rounded-full border border-primary/40 px-2.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/5"
                        >
                          Combinar mitad
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {group.elements.map((el) => {
                    const qty = getQty(groupId, el.modifierElementId);
                    const selected = qty > 0;
                    const info = (
                      <span className="min-w-0">
                        <span className="text-sm font-medium">{el.name.trim()}</span>
                        {el.price > 0 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            +₡{el.price.toLocaleString("es-CR")}
                          </span>
                        )}
                      </span>
                    );

                    // ── Elegir uno: fila tipo radio ──
                    if (single) {
                      return (
                        <button
                          key={el.modifierElementId}
                          type="button"
                          onClick={() => selectSingle(groupId, el.modifierElementId, required)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                            selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          )}
                        >
                          {info}
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              selected ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                            )}
                          >
                            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    }

                    // ── Múltiple: tocar para agregar; stepper al estar seleccionado ──
                    return (
                      <div
                        key={el.modifierElementId}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                          selected ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        {selected ? (
                          <>
                            {info}
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() =>
                                  setQty(groupId, el.modifierElementId, qty - 1, group.maxSelect)
                                }
                                aria-label="Quitar uno"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-4 text-center text-sm font-semibold tabular-nums">
                                {qty}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() =>
                                  setQty(groupId, el.modifierElementId, qty + 1, group.maxSelect)
                                }
                                disabled={atMax}
                                aria-label="Agregar uno"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={atMax}
                            onClick={() => setQty(groupId, el.modifierElementId, 1, group.maxSelect)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 text-left",
                              atMax && "opacity-40"
                            )}
                          >
                            {info}
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                              <Plus className="h-4 w-4" />
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                    {/* Resumen de la combinación elegida */}
                    {single && combined && firstEl && (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3.5 py-2.5">
                        <span className="min-w-0 text-sm">
                          <span className="font-medium">Combinada:</span> {firstEl.name.trim()} /{" "}
                          {combined.name.trim()}
                        </span>
                        <button
                          onClick={() => removeCombine(groupId)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Quitar combinación"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </>
        ) : (
          /* ── Order bump: upsell de extras ── */
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-4 text-center">
              <p className="text-base font-bold">🔥 ¿La hacemos más rica?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sumá un extra y llevala al siguiente nivel
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {optionalGroups.flatMap((g) =>
                g.elements.map((el) => {
                  const qty = getQty(g.modifierGroupId, el.modifierElementId);
                  const selected = qty > 0;
                  const groupTotal = Object.values(activeUnit.sel[g.modifierGroupId] ?? {}).reduce(
                    (s, v) => s + v,
                    0
                  );
                  const atMax = groupTotal >= g.maxSelect;
                  return (
                    <button
                      key={el.modifierElementId}
                      type="button"
                      disabled={!selected && atMax}
                      onClick={() =>
                        selected
                          ? setQty(g.modifierGroupId, el.modifierElementId, qty - 1, g.maxSelect)
                          : setQty(g.modifierGroupId, el.modifierElementId, 1, g.maxSelect)
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:bg-muted/40",
                        !selected && atMax && "opacity-40"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />}
                      <span className="font-medium">{el.name.trim()}</span>
                      {el.price > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +₡{el.price.toLocaleString("es-CR")}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <SheetFooter className="border-t border-border px-5 py-4 shrink-0">
          {showUpsell ? (
            <div className="flex w-full gap-2">
              <Button variant="outline" className="shrink-0" onClick={() => setShowUpsell(false)}>
                Volver
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 justify-between bg-primary text-primary-foreground"
              >
                <span>{noExtrasChosen ? "Agregar así" : "Agregar al carrito"}</span>
                <span className="tabular-nums">₡{total.toLocaleString("es-CR")}</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!allValid}
              className="w-full justify-between bg-primary text-primary-foreground"
            >
              <span>{count > 1 ? `Agregar ${count} al carrito` : "Agregar al carrito"}</span>
              <span className="tabular-nums">₡{total.toLocaleString("es-CR")}</span>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
