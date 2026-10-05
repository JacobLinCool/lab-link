import * as store from './store.ts';
import { defaultLayout, makeLayout } from './planner.ts';
import type { Call, Layout, Point, Role, State, User } from './types.ts';

export interface RoomDraft {
	id?: string;
	name: string;
	course: string;
	layout: Layout;
	removed: string[];
	positions: Record<string, Point>;
}

class App {
	data = $state.raw<State>({ rooms: [], calls: [], assistants: [], history: [] });
	user = $state<User | null>(null);
	roomId = $state<string | null>(null);
	view = $state<'map' | 'history'>('map');
	now = $state(Date.now());
	draft = $state<RoomDraft | null>(null);
	toastMessage = $state('');
	toastVisible = $state(false);

	room = $derived(this.data.rooms.find((r) => r.id === this.roomId));
	isTa = $derived(this.user?.role === 'ta');
	myCall = $derived(this.data.calls.find((c) => c.uid === this.user?.uid));
	serving = $derived(this.data.calls.some((c) => c.assistant === this.user?.uid));

	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	toast(message: string) {
		this.toastMessage = message;
		this.toastVisible = true;
		clearTimeout(this.#toastTimer);
		this.#toastTimer = setTimeout(() => (this.toastVisible = false), 4500);
	}

	async run(fn: () => unknown) {
		try {
			await fn();
		} catch (e) {
			this.toast(e instanceof Error ? e.message : String(e));
		}
	}

	start() {
		const onError = (e: Event) => this.toast((e as CustomEvent<string>).detail);
		window.addEventListener('store-error', onError);
		const stopData = store.subscribe((s) => (this.data = structuredClone(s)));
		const stopAuth = store.watchAuth((u) => (this.user = u));
		const tick = setInterval(() => (this.now = Date.now()), 1000);
		return () => {
			window.removeEventListener('store-error', onError);
			stopData();
			stopAuth();
			clearInterval(tick);
		};
	}

	login = (role: Role) =>
		this.run(async () => {
			const u = await store.login(role);
			if (u) this.user = u;
		});

	logout = () =>
		this.run(async () => {
			if (!(await this.leavePresence('請先完成協助，再登出。'))) return;
			await store.logout();
			this.user = null;
			this.roomId = null;
		});

	enterRoom = (id: string) =>
		this.run(async () => {
			this.roomId = id;
			if (this.isTa) await store.presence(id);
		});

	leaveRoom = () =>
		this.run(async () => {
			if (!(await this.leavePresence('請先完成協助，再切換教室。'))) return;
			this.roomId = null;
			this.view = 'map';
		});

	async leavePresence(blocked: string) {
		if (!this.isTa || !this.roomId) return true;
		if (this.serving) {
			this.toast(blocked);
			return false;
		}
		await store.presence(this.roomId, false);
		return true;
	}

	showHistory = () => {
		if (!this.roomId) return this.toast('請先選擇教室。');
		this.view = 'history';
	};

	setPresence = (active: boolean) => this.run(() => store.presence(this.roomId!, active));

	seatClick = (seat: string) =>
		this.run(async () => {
			const c = this.data.calls.find((c) => c.room === this.roomId && c.seat === seat);
			if (!this.isTa) {
				if (!c) await store.callSeat(this.roomId!, seat);
				return;
			}
			if (!c) return this.toast('這個座位目前沒有呼叫。');
			if (c.status === 'waiting') await store.act(c, 'claim');
			else if (c.assistant === this.user?.uid) await store.act(c, 'complete');
			else this.toast('另一位助教正在協助這位同學。');
		});

	claim = (call: Call) => this.run(() => store.act(call, 'claim'));
	complete = (call: Call) => this.run(() => store.act(call, 'complete'));
	cancel = () => this.run(() => store.act(this.myCall, 'cancel'));
	demoTeam = (count: number) => store.demoTeam(count, this.roomId!);

	newRoom = () => {
		this.draft = { name: '', course: '程式設計實習', layout: { ...defaultLayout }, removed: [], positions: {} };
	};

	editRoom = () => {
		const r = this.room;
		if (!r) return;
		this.draft = {
			id: r.id,
			name: r.name,
			course: r.course,
			layout: { ...r.layout },
			positions: Object.fromEntries(r.seats.map((s) => [s.id, { x: s.x, y: s.y }])),
			removed: makeLayout(r.layout)
				.seats.filter((s) => !r.seats.some((x) => x.id === s.id))
				.map((s) => s.id),
		};
	};

	saveDraft = () =>
		this.run(async () => {
			const d = this.draft!;
			const { seats: all, tables } = makeLayout(d.layout);
			const seats = all.filter((s) => !d.removed.includes(s.id)).map((s) => ({ ...s, ...d.positions[s.id] }));
			if (!seats.length) throw Error('至少保留一個座位。');
			const layout = $state.snapshot(d.layout);
			await store.saveRoom({ id: d.id || crypto.randomUUID(), name: d.name.trim(), course: d.course.trim(), layout, seats, tables });
			this.draft = null;
			this.toast('教室已儲存');
		});
}

export const app = new App();
export const live = store.live;
