import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, runTransaction, serverTimestamp, getDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { defaultLayout, makeLayout } from './planner.ts';
import type { Call, CallAction, Role, Room, Seat, State, User } from './types.ts';

const env = import.meta.env;
export const live = Boolean(env.VITE_FIREBASE_API_KEY);

const KEY = 'lablink-v3';
const empty = (): State => ({ rooms: [], calls: [], assistants: [], history: [] });
const initial = (): State => ({
	rooms: [{ id: '316', name: '316', course: '程式設計實習', layout: defaultLayout, ...makeLayout(defaultLayout) }],
	calls: [
		{ id: 'demo-a', uid: 'demo-a', room: '316', seat: 'B3', name: '陳同學', createdAt: Date.now() - 240000, status: 'waiting' },
		{ id: 'demo-b', uid: 'demo-b', room: '316', seat: 'D6', name: '林同學', createdAt: Date.now() - 120000, status: 'waiting' },
		{ id: 'demo-c', uid: 'demo-c', room: '316', seat: 'F2', name: '王同學', createdAt: Date.now() - 60000, status: 'waiting' },
	],
	assistants: [{ id: 'demo-ta', name: '你', room: '316', seat: 'A1', active: true }],
	history: [],
});

let db: Firestore;
let auth: Auth;
let user: User | null = null;
let listener: ((state: State) => void) | null = null;
let unsubs: Unsubscribe[] = [];

function read(): State {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as State) : initial();
	} catch {
		return initial();
	}
}
let state = live ? empty() : read();

function publish() {
	localStorage.setItem(KEY, JSON.stringify(state));
	listener?.(state);
}

export function reportError(message: string) {
	window.dispatchEvent(new CustomEvent('store-error', { detail: message }));
}

function current() {
	if (!user) throw Error('請先登入。');
	return user;
}

function stopSnapshots() {
	unsubs.forEach((f) => f());
	unsubs = [];
}

function startSnapshots() {
	stopSnapshots();
	state = empty();
	const keys = (Object.keys(state) as (keyof State)[]).filter((k) => k !== 'history' || user?.role === 'ta');
	for (const key of keys)
		unsubs.push(
			onSnapshot(
				collection(db, key),
				(snap) => {
					state = { ...state, [key]: snap.docs.map((d) => ({ ...d.data(), id: d.id })) };
					listener?.(state);
				},
				(err) => reportError(err.message),
			),
		);
}

if (live) {
	const app = initializeApp({
		apiKey: env.VITE_FIREBASE_API_KEY,
		authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: env.VITE_FIREBASE_PROJECT_ID,
		appId: env.VITE_FIREBASE_APP_ID,
	});
	db = getFirestore(app);
	auth = getAuth(app);
}

export function subscribe(fn: (state: State) => void) {
	listener = fn;
	if (live)
		return () => {
			stopSnapshots();
			listener = null;
		};
	fn(state);
	const onStorage = () => {
		state = read();
		fn(state);
	};
	window.addEventListener('storage', onStorage);
	return () => {
		window.removeEventListener('storage', onStorage);
		listener = null;
	};
}

export function watchAuth(fn: (user: User | null) => void): Unsubscribe {
	if (!live) return () => {};
	return onAuthStateChanged(auth, async (u) => {
		if (!u) {
			stopSnapshots();
			state = empty();
			listener?.(state);
			return fn(null);
		}
		if (env.VITE_ALLOWED_DOMAIN && !u.email?.endsWith('@' + env.VITE_ALLOWED_DOMAIN)) {
			await signOut(auth);
			reportError('請使用指定的學校網域帳號登入。');
			return;
		}
		const token = await u.getIdTokenResult();
		const profile = await getDoc(doc(db, 'profiles', u.uid));
		const email = u.email ?? '';
		user = {
			uid: u.uid,
			name: u.displayName || '同學',
			email,
			studentId: (profile.data()?.studentId as string | undefined) || email.split('@')[0],
			role: token.claims.ta ? 'ta' : 'student',
		};
		startSnapshots();
		fn(user);
	});
}

export async function login(role: Role): Promise<User | null> {
	if (live) {
		await signInWithPopup(auth, new GoogleAuthProvider());
		return null;
	}
	const ta = role === 'ta';
	user = {
		uid: ta ? 'demo-ta' : 'demo-student',
		name: ta ? '林助教' : '許同學',
		studentId: ta ? 'TA-001' : 'B11303042',
		email: ta ? 'ta@school.edu.tw' : 'b11303042@school.edu.tw',
		role,
	};
	return user;
}

export async function logout() {
	if (live) await signOut(auth);
	user = null;
}

export async function callSeat(room: string, seat: string) {
	const me = current();
	const uid = me.uid;
	if (!live) {
		state = read();
		if (state.calls.some((c) => c.uid === uid)) throw Error('你已經有一個呼叫，請先取消。');
		if (state.calls.some((c) => c.room === room && c.seat === seat)) throw Error('這個座位正在呼叫。');
		state.calls.push({ id: uid, uid, room, seat, name: me.name, createdAt: Date.now(), status: 'waiting' });
		publish();
		return;
	}
	const ref = doc(db, 'calls', uid);
	const lock = doc(db, 'seatLocks', `${room}_${seat}`);
	await runTransaction(db, async (tx) => {
		const roomRef = doc(db, 'rooms', room);
		const [c, l, r] = await Promise.all([tx.get(ref), tx.get(lock), tx.get(roomRef)]);
		if (!r.exists() || !(r.data().seats as Seat[]).some((s) => s.id === seat)) throw Error('座位不存在。');
		if (c.exists() || l.exists()) throw Error('帳號已有呼叫，或座位已被使用。');
		tx.set(ref, { uid, room, seat, name: me.name, createdAt: Date.now(), requestedAt: serverTimestamp(), status: 'waiting', assistant: null });
		tx.set(lock, { uid, room, seat });
		tx.update(roomRef, { activeCount: (r.data().activeCount || 0) + 1 });
	});
}

export async function act(call: Call | undefined, action: CallAction) {
	if (!call) throw Error('呼叫已結束。');
	if (action === 'cancel' && call.status === 'serving') throw Error('助教已開始協助，請由助教完成呼叫。');
	const me = current();
	if (!live) {
		state = read();
		const c = state.calls.find((x) => x.id === call.id);
		if (!c) throw Error('這個呼叫已經結束。');
		if (action === 'claim') {
			if (c.status !== 'waiting') throw Error('已有助教前往。');
			if (state.calls.some((x) => x.assistant === me.uid)) throw Error('請先完成目前的協助。');
			c.status = 'serving';
			c.assistant = me.uid;
			const a = state.assistants.find((x) => x.id === me.uid);
			if (a) {
				a.seat = c.seat;
				a.room = c.room;
			} else state.assistants.push({ id: me.uid, name: me.name, seat: c.seat, room: c.room, active: true });
		} else {
			if (action === 'complete') state.history.unshift({ ...c, id: crypto.randomUUID(), assistant: me.uid, completedAt: Date.now() });
			state.calls = state.calls.filter((x) => x.id !== call.id);
		}
		publish();
		return;
	}
	const ref = doc(db, 'calls', call.id);
	await runTransaction(db, async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists()) throw Error('呼叫已結束。');
		const c = snap.data() as Call;
		const roomRef = doc(db, 'rooms', c.room);
		const roomSnap = await tx.get(roomRef);
		if (action === 'claim') {
			const aRef = doc(db, 'assistants', me.uid);
			const a = await tx.get(aRef);
			if (a.data()?.currentCall) throw Error('請先完成目前的協助。');
			if (c.status !== 'waiting') throw Error('已有助教前往。');
			tx.update(ref, { status: 'serving', assistant: me.uid });
			tx.set(aRef, { name: me.name, room: c.room, seat: c.seat, active: true, currentCall: call.id });
		} else {
			tx.update(roomRef, { activeCount: Math.max(0, (roomSnap.data()?.activeCount || 0) - 1) });
			tx.delete(ref);
			tx.delete(doc(db, 'seatLocks', `${c.room}_${c.seat}`));
			if (action === 'complete') {
				tx.set(doc(collection(db, 'history')), { ...c, assistant: me.uid, completedAt: Date.now(), finishedAt: serverTimestamp() });
				tx.set(doc(db, 'assistants', me.uid), { name: me.name, room: c.room, seat: c.seat, active: true, currentCall: null });
			}
		}
	});
}

export async function saveRoom(room: Room) {
	if (!live) {
		state = read();
		if (state.calls.some((c) => c.room === room.id)) throw Error('請先處理完此教室的呼叫，再編輯座位。');
		const i = state.rooms.findIndex((r) => r.id === room.id);
		if (i >= 0) state.rooms[i] = room;
		else state.rooms.push(room);
		publish();
		return;
	}
	await runTransaction(db, async (tx) => {
		const ref = doc(db, 'rooms', room.id);
		const existing = await tx.get(ref);
		if ((existing.data()?.activeCount || 0) > 0) throw Error('請先處理完此教室的呼叫，再編輯座位。');
		tx.set(ref, { ...room, seatIds: room.seats.map((s) => s.id), activeCount: 0 });
	});
}

export async function presence(room: string, active = true) {
	const me = current();
	if (live) {
		await setDoc(doc(db, 'assistants', me.uid), { name: me.name, room, active }, { merge: true });
		return;
	}
	state = read();
	const a = state.assistants.find((a) => a.id === me.uid);
	if (a) {
		a.active = active;
		a.room = room;
	} else state.assistants.push({ id: me.uid, name: me.name, room, seat: 'A1', active });
	publish();
}

export function demoTeam(count: number, room: string) {
	if (live) return;
	state = read();
	state.assistants = state.assistants.filter((a) => !a.id.startsWith('sim-ta'));
	for (let i = 1; i < count; i++) state.assistants.push({ id: `sim-ta-${i}`, name: `助教 ${i + 1}`, room, seat: i === 1 ? 'F8' : 'D1', active: true });
	publish();
}
