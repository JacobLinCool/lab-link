import type { Call, Layout, Point, Seat, Table } from './types.ts';

type PlanCall = Pick<Call, 'seat' | 'status' | 'createdAt'>;
type PlanAssistant = { id: string; seat?: string };
type Floor = { seats: Seat[]; tables?: Table[] };
export type Route<A, C> = A & { stops: C[]; distance: number; point: Point };

const key = (p: Point) => `${p.x},${p.y}`;

// Walking distance on the room grid. Tables are obstacles, so reaching the other side of
// the same table means walking around its end; a one-cell margin surrounds the room.
export function walkDistance({ seats, tables = [] }: Floor) {
	const manhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
	if (!tables.length) return manhattan;
	const blocked = new Set<string>();
	for (const t of tables) for (let dx = 0; dx < t.w; dx++) for (let dy = 0; dy < t.h; dy++) blocked.add(key({ x: t.x + dx, y: t.y + dy }));
	const xs = [...seats.map((s) => s.x), ...tables.flatMap((t) => [t.x, t.x + t.w - 1])];
	const ys = [...seats.map((s) => s.y), ...tables.flatMap((t) => [t.y, t.y + t.h - 1])];
	const [minX, maxX, minY, maxY] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 1];
	const cache = new Map<string, Map<string, number>>();
	const flood = (from: Point) => {
		const dist = new Map([[key(from), 0]]);
		const queue = [from];
		for (let i = 0; i < queue.length; i++) {
			const p = queue[i];
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const n = { x: p.x + dx, y: p.y + dy };
				if (n.x < minX || n.x > maxX || n.y < minY || n.y > maxY || blocked.has(key(n)) || dist.has(key(n))) continue;
				dist.set(key(n), dist.get(key(p))! + 1);
				queue.push(n);
			}
		}
		return dist;
	};
	return (a: Point, b: Point) => {
		if (!cache.has(key(a))) cache.set(key(a), flood(a));
		return cache.get(key(a))!.get(key(b)) ?? manhattan(a, b);
	};
}

// Deterministic, age-weighted greedy assignment with an overdue fairness guard.
// This is a heuristic, not a global optimum.
export function planRoutes<C extends PlanCall, A extends PlanAssistant>(calls: C[], assistants: A[], floor: Floor, now = Date.now()): Route<A, C>[] {
	const seatOf = (id?: string) => floor.seats.find((s) => s.id === id);
	const walk = walkDistance(floor);
	const pending = calls.filter((c) => c.status === 'waiting' && seatOf(c.seat));
	const routes: Route<A, C>[] = assistants.map((a) => ({ ...a, stops: [], distance: 0, point: seatOf(a.seat) ?? { x: 0, y: 0 } }));
	const remaining = [...pending];
	while (remaining.length && routes.length) {
		const overdue = remaining.filter((c) => now - c.createdAt >= 10 * 60000);
		const candidates = overdue.length ? [overdue.sort((a, b) => a.createdAt - b.createdAt)[0]] : remaining;
		let best: { c: C; r: Route<A, C>; s: Seat; distance: number; score: number } | undefined;
		for (const c of candidates)
			for (const r of routes) {
				const s = seatOf(c.seat)!;
				const distance = walk(r.point, s);
				const age = Math.max(0, (now - c.createdAt) / 60000);
				const score = (r.distance + distance + r.stops.length * 2) / (1 + age * 0.55);
				if (!best || score < best.score) best = { c, r, s, distance, score };
			}
		best!.r.stops.push(best!.c);
		best!.r.distance += best!.distance;
		best!.r.point = best!.s;
		remaining.splice(remaining.indexOf(best!.c), 1);
	}
	return routes;
}

const letter = (i: number) => String.fromCharCode(65 + i);

// Builds seat and table coordinates for a layout preset.
// tables: long tables running front-to-back, seats on both sides. Each table column takes
//   grid columns [seat, table, seat, aisle]; table rows are separated by a cross aisle.
//   Table A seats are A1..An on the left side (front to back), then A(n+1)..A(2n) on the right.
// rows: classic rows of seats with a centre aisle column.
export function makeLayout(layout: Layout): { seats: Seat[]; tables: Table[] } {
	if (layout.kind === 'rows') {
		const { rows, columns } = layout;
		const seats = Array.from({ length: rows * columns }, (_, i) => ({
			id: `${letter(Math.floor(i / columns))}${(i % columns) + 1}`,
			x: (i % columns) + (i % columns >= columns / 2 ? 1 : 0),
			y: Math.floor(i / columns),
		}));
		return { seats, tables: [] };
	}
	const { tableRows, tableColumns, seatsPerSide: n } = layout;
	const seats: Seat[] = [];
	const tables: Table[] = [];
	for (let r = 0; r < tableRows; r++)
		for (let c = 0; c < tableColumns; c++) {
			const id = letter(r * tableColumns + c);
			const x = c * 4;
			const y = r * (n + 1);
			tables.push({ id, x: x + 1, y, w: 1, h: n });
			for (let i = 0; i < n; i++) {
				seats.push({ id: `${id}${i + 1}`, x, y: y + i });
				seats.push({ id: `${id}${n + i + 1}`, x: x + 2, y: y + i });
			}
		}
	return { seats, tables };
}

export const defaultLayout: Layout = { kind: 'tables', tableRows: 2, tableColumns: 3, seatsPerSide: 8 };

// CSS grid tracks for a floor plan: seat tracks are widest, table tracks narrower,
// empty tracks (aisles) thin.
export function floorGrid(seats: Point[], tables: Table[]) {
	const inTable = (axis: 'x' | 'y', v: number) => tables.some((t) => v >= t[axis] && v < t[axis] + (axis === 'x' ? t.w : t.h));
	const size = (axis: 'x' | 'y') => Math.max(0, ...seats.map((s) => s[axis]), ...tables.map((t) => t[axis] + (axis === 'x' ? t.w : t.h) - 1)) + 1;
	const columns = Array.from({ length: size('x') }, (_, x) =>
		seats.some((s) => s.x === x) ? 'minmax(0,1fr)' : inTable('x', x) ? 'minmax(0,.7fr)' : 'minmax(0,.3fr)',
	).join(' ');
	const rows = Array.from({ length: size('y') }, (_, y) => (seats.some((s) => s.y === y) || inTable('y', y) ? 'auto' : '14px')).join(' ');
	return { columns, rows };
}

export function elapsed(since: number, now: number) {
	const s = Math.max(0, Math.floor((now - since) / 1000));
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
