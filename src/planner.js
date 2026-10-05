// Deterministic, age-weighted greedy assignment with an overdue fairness guard.
// Distance follows the room's orthogonal aisles; this is a heuristic, not a global optimum.
export function planRoutes(calls, assistants, seats, now = Date.now()) {
  const pending = calls.filter(c => c.status === 'waiting' && seats.some(s => s.id === c.seat));
  const routes = assistants.map(a => ({ ...a, stops: [], distance: 0, point: seats.find(s => s.id === a.seat) || { x: 0, y: 0 } }));
  const remaining = [...pending];
  while (remaining.length && routes.length) {
    const overdue = remaining.filter(c => now - c.createdAt >= 10 * 60000);
    const candidates = overdue.length ? [overdue.sort((a,b) => a.createdAt-b.createdAt)[0]] : remaining;
    let best;
    for (const c of candidates) for (const r of routes) {
      const s = seats.find(s => s.id === c.seat);
      const distance = Math.abs(s.x-r.point.x) + Math.abs(s.y-r.point.y);
      const age = Math.max(0, (now-c.createdAt)/60000);
      const score = (r.distance + distance + r.stops.length * 2) / (1+age * .55);
      if (!best || score < best.score) best = { c, r, s, distance, score };
    }
    best.r.stops.push(best.c); best.r.distance += best.distance; best.r.point = best.s;
    remaining.splice(remaining.indexOf(best.c),1);
  }
  return routes;
}
export function makeSeats(rows=6, columns=8) {
  return Array.from({length:rows*columns},(_,i)=>({id:`${String.fromCharCode(65+Math.floor(i/columns))}${i%columns+1}`,x:i%columns+(i%columns>=columns/2?1:0),y:Math.floor(i/columns)}));
}
