import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSeats,planRoutes} from '../src/planner.js';
const seats=makeSeats(),now=1000000;
test('each waiting request assigned once across three assistants',()=>{const calls=seats.slice(0,15).map((s,i)=>({uid:String(i),seat:s.id,createdAt:now-i*1000,status:'waiting'}));const routes=planRoutes(calls,[{id:'a',seat:'A1'},{id:'b',seat:'D4'},{id:'c',seat:'F8'}],seats,now);const assigned=routes.flatMap(r=>r.stops);assert.equal(assigned.length,15);assert.equal(new Set(assigned.map(c=>c.uid)).size,15)});
test('overdue request takes priority over nearby recent request',()=>{const routes=planRoutes([{seat:'F8',createdAt:now-11*60000,status:'waiting'},{seat:'A1',createdAt:now,status:'waiting'}],[{id:'ta',seat:'A1'}],seats,now);assert.equal(routes[0].stops[0].seat,'F8')});
test('serving and removed seats are excluded, no assistant returns no route',()=>{assert.deepEqual(planRoutes([{seat:'A1',status:'waiting'}],[],seats),[]);const r=planRoutes([{seat:'A1',status:'serving'},{seat:'Z9',status:'waiting'}],[{id:'a'}],seats,now);assert.equal(r[0].stops.length,0)});
