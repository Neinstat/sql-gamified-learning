/**
 * Food truck orders (GAME_DESIGN.md §4–§5): each order is an order template with one variant of
 * its parameters, e.g. `price-under:3.5`. The id is all that is saved; the template rebuilds the
 * customer's line, the task and its SQL, and what the customer buys. Who orders it (their look)
 * and how they say it are picked from the day's seed, so a reload shows the same day.
 */
import type { Lang } from '../feedback';
import type { InputMode, RequestLevel } from '../levels';
import { conceptLesson, type ConceptId } from './concepts';
import { TEMPLATES_ID } from './locales/id/templates';
import { templateById, type OrderTemplate, type Purchase, type TemplateText, type TemplateVariant } from './templates';

export type CustomerLook = 'student' | 'runner' | 'painter' | 'office' | 'grandpa';
export const LOOKS: readonly CustomerLook[] = ['student', 'runner', 'painter', 'office', 'grandpa'];

export type TruckOrder = {
  /** `template:variant`, saved in the day log. */
  id: string;
  template: OrderTemplate;
  variant: TemplateVariant;
  concept: ConceptId;
  look: CustomerLook;
  /** Which of the template's lines the customer says. */
  line: number;
  /** What they buy once served: menu item ids and quantities (recorded in `sales`). */
  buys: readonly Purchase[];
};

export const orderId = (template: OrderTemplate, variant: TemplateVariant) => `${template.id}:${variant.key}`;

/** The template and variant an order id names, or undefined for an unknown or old id. */
export function parseOrderId(id: string): { template: OrderTemplate; variant: TemplateVariant } | undefined {
  const at = id.indexOf(':');
  if (at < 0) return undefined;
  const template = templateById(id.slice(0, at));
  const variant = template?.variants.find((v) => v.key === id.slice(at + 1));
  return template && variant ? { template, variant } : undefined;
}

export const isOrderId = (id: string) => parseOrderId(id) !== undefined;

/** A small seeded random generator (mulberry32), the same one the data uses. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number from a text, to seed the random generator (FNV-1a). */
export function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The day's orders, in the order customers arrive: who comes (a look that differs from the two
 * before, so identical customers never stand together) and how each says it. Same date and ids,
 * same customers.
 */
export function dayOrders(date: string, ids: readonly string[]): TruckOrder[] {
  const rand = seeded(hashText(`customers ${date}`));
  const orders: TruckOrder[] = [];
  for (const id of ids) {
    const found = parseOrderId(id);
    if (!found) continue;
    const recent = orders.slice(-2).map((o) => o.look);
    const looks = LOOKS.filter((l) => !recent.includes(l));
    orders.push({
      id,
      ...found,
      concept: found.template.concept,
      look: looks[Math.floor(rand() * looks.length)],
      line: Math.floor(rand() * found.template.text.lines.length),
      buys: found.variant.buys,
    });
  }
  return orders;
}

/** An order rebuilt from its id alone (for replaying sales); the look and line don't matter there. */
export function orderFromId(id: string): TruckOrder | undefined {
  return dayOrders('replay', [id])[0];
}

const textFor = (template: OrderTemplate, lang: Lang): TemplateText =>
  (lang === 'id' ? TEMPLATES_ID[template.id] : undefined) ?? template.text;

/** The customer's line in the player's language (English when no translation exists). */
export function orderLine(order: TruckOrder, lang: Lang): string {
  const text = textFor(order.template, lang);
  const line = text.lines[order.line] ?? text.lines[0];
  return line(order.variant.params);
}

/**
 * How much of the query the player writes, by their mastery of the order's concept
 * (GAME_DESIGN.md §5 "Input grows with the player"):
 * - keyword (level 0–1): fill in one word or value, as the template gives it;
 * - condition (level 2–3): fill in the whole WHERE condition;
 * - free (level 4–5): type the whole query in the editor.
 */
export type InputStage = 'keyword' | 'condition' | 'free';

export function inputStage(level: number | undefined): InputStage {
  if (level === undefined || level < 2) return 'keyword';
  return level < 4 ? 'condition' : 'free';
}

/** The input for an order at a stage. Every solution is `SELECT … FROM … WHERE condition;`. */
export function stagedInput(template: OrderTemplate, variant: TemplateVariant, stage: InputStage): InputMode {
  const solution = template.solution(variant.params);
  if (stage === 'free') return { kind: 'free' };
  const where = solution.lastIndexOf(' WHERE ');
  if (stage === 'keyword' || where < 0) return template.input(variant.params);
  const condition = solution.slice(where + ' WHERE '.length).replace(/;\s*$/, '');
  return { kind: 'fill-blank', template: `${solution.slice(0, where)} WHERE ___;`, answers: [condition], blankSize: 28 };
}

/**
 * The order as a level the console can run: the task, the query to complete (more of it as the
 * concept is mastered), the hints, and the concept's lesson card.
 */
export function orderLevel(order: TruckOrder, lang: Lang, stage: InputStage = 'keyword'): RequestLevel {
  const { template, variant } = order;
  const p = variant.params;
  const text = textFor(template, lang);
  return {
    id: `order:${order.id}`,
    title: text.title(p),
    character: 'regular',
    station: template.station,
    lesson: conceptLesson(template.concept, lang),
    dialogue: [orderLine(order, lang)],
    task: text.task(p),
    input: stagedInput(template, variant, stage),
    solution: template.solution(p),
    hints: [text.hints[0](p), text.hints[1](p), text.hints[2](p)],
    success: text.success(p),
  };
}
