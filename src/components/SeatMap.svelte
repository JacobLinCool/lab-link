<script lang="ts">
	import { BellRing, DoorOpen, Monitor, Route as RouteIcon, UserCheck } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
	import { floorGrid, type Route } from '../lib/planner.ts';
	import { isSeatDisabled } from '../lib/seats.ts';
	import type { Assistant, Call, Room, User } from '../lib/types.ts';

	let { room, calls, routes, user }: { room: Room; calls: Call[]; routes: Route<Assistant, Call>[]; user: User } = $props();

	let showRoutes = $state(true);

	const seats = $derived(
		room.seats.map((s) => {
			const call = calls.find((c) => c.seat === s.id);
			const own = call?.uid === user.uid;
			const route = routes.find((r) => r.stops.some((c) => c.seat === s.id));
			const order = route ? route.stops.findIndex((c) => c.seat === s.id) + 1 : 0;
			const unavailable = isSeatDisabled(room.layout, s.id);
			const disabled = unavailable || (!app.isTa && !!(call || app.myCall) && !own);
			const status = unavailable ? '停用' : call ? (call.status === 'serving' ? '協助中' : '等待協助') : '';
			return { ...s, call, own, route, order, disabled, status, unavailable };
		}),
	);
	const grid = $derived(floorGrid(room.seats, room.tables ?? []));
</script>

<div class="map-card">
	<div class="card-heading">
		<div>
			<h2>教室座位圖</h2>
			<span>{app.isTa ? '點擊呼叫中的座位，開始協助同學' : '點擊你的位置，即可呼叫助教'}</span>
		</div>
		{#if app.isTa}
			<button class="toggle" class:on={showRoutes} onclick={() => (showRoutes = !showRoutes)}><RouteIcon />建議路線 <b></b></button>
		{:else}
			<span class="live-label"><b></b>即時更新</span>
		{/if}
	</div>
	<div class="room-map">
		<div class="front"><div>講台 / 投影幕</div></div>
		<div class="seating" style:grid-template-columns={grid.columns} style:grid-template-rows={grid.rows}>
			{#each room.tables ?? [] as t (t.id)}
				<div class="table" style:grid-column="{t.x + 1} / span {t.w}" style:grid-row="{t.y + 1} / span {t.h}">{t.id}</div>
			{/each}
			{#each seats as s (s.id)}
				<button
					class="seat"
					class:unavailable={s.unavailable}
					class:waiting={s.call?.status === 'waiting'}
					class:serving={s.call?.status === 'serving'}
					class:mine={s.own}
					style:grid-row={s.y + 1}
					style:grid-column={s.x + 1}
					title={s.unavailable ? `${s.id} · 停用` : s.route ? `${s.id} · ${s.route.name} 建議第 ${s.order} 站` : s.id}
					aria-label={`${s.id} 座位${s.status ? '，' + s.status : ''}`}
					disabled={s.disabled}
					onclick={() => app.seatClick(s.id)}
				>
					{#if s.call?.status === 'serving'}<UserCheck />{:else if s.call}<BellRing />{:else}<Monitor />{/if}
					<span>{s.id}</span>
					{#if s.unavailable}<small>停用</small>{/if}
					{#if app.isTa && showRoutes && s.route}<b class="route-number">{s.order}</b>{/if}
				</button>
			{/each}
		</div>
		<div class="room-back">
			<span><DoorOpen />出入口</span>
			<span><DoorOpen />出入口</span>
		</div>
	</div>
	<div class="map-legend">
		<span><b class="legend-dot"></b>可選座位</span>
		<span><b class="legend-dot waiting"></b>等待協助</span>
		<span><b class="legend-dot serving"></b>協助中</span>
		<span><b class="legend-dot mine"></b>我的座位</span>
	</div>
</div>
