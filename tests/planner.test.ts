import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultLayout, makeLayout, planRoutes, walkDistance } from '../src/lib/planner.ts';

const floor = makeLayout({ kind: 'rows', rows: 6, columns: 8 });
const seats = floor.seats;
const now = 1000000;

test('each waiting request assigned once across three assistants', () => {
	const calls = seats.slice(0, 15).map((s, i) => ({ uid: String(i), seat: s.id, createdAt: now - i * 1000, status: 'waiting' as const }));
	const routes = planRoutes(calls, [{ id: 'a', seat: 'A1' }, { id: 'b', seat: 'D4' }, { id: 'c', seat: 'F8' }], floor, now);
	const assigned = routes.flatMap((r) => r.stops);
	assert.equal(assigned.length, 15);
	assert.equal(new Set(assigned.map((c) => c.uid)).size, 15);
});

test('overdue request takes priority over nearby recent request', () => {
	const routes = planRoutes(
		[
			{ seat: 'F8', createdAt: now - 11 * 60000, status: 'waiting' as const },
			{ seat: 'A1', createdAt: now, status: 'waiting' as const },
		],
		[{ id: 'ta', seat: 'A1' }],
		floor,
		now,
	);
	assert.equal(routes[0].stops[0].seat, 'F8');
});

test('serving and removed seats are excluded, no assistant returns no route', () => {
	assert.deepEqual(planRoutes([{ seat: 'A1', createdAt: now, status: 'waiting' as const }], [], floor), []);
	const r = planRoutes(
		[
			{ seat: 'A1', createdAt: now, status: 'serving' as const },
			{ seat: 'Z9', createdAt: now, status: 'waiting' as const },
		],
		[{ id: 'a' }],
		floor,
		now,
	);
	assert.equal(r[0].stops.length, 0);
});

test('long-table layout: 6 tables with 8 seats on each side', () => {
	const room = makeLayout(defaultLayout);
	assert.equal(room.tables.length, 6);
	assert.equal(room.seats.length, 96);
	assert.equal(new Set(room.seats.map((s) => `${s.x},${s.y}`)).size, 96);
	const tableCells = new Set(room.tables.flatMap((t) => Array.from({ length: t.h }, (_, i) => `${t.x},${t.y + i}`)));
	assert.ok(room.seats.every((s) => !tableCells.has(`${s.x},${s.y}`)));
});

test('walking to the other side of a table goes around its end', () => {
	const room = makeLayout(defaultLayout);
	const at = (id: string) => room.seats.find((s) => s.id === id)!;
	const walk = walkDistance(room);
	// A3 (left, third) to A11 (right, third): around the front end of table A.
	assert.equal(walk(at('A3'), at('A11')), 3 + 2 + 3);
	// Back-to-back seats across the aisle between tables A and B stay close.
	assert.equal(walk(at('A11'), at('B3')), 2);
});
