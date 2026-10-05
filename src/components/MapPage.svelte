<script lang="ts">
	import { ArrowLeft, BellRing, MousePointer2, SlidersHorizontal } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
	import { elapsed, planRoutes } from '../lib/planner.ts';
	import type { Room, User } from '../lib/types.ts';
	import SeatMap from './SeatMap.svelte';
	import QueueCard from './QueueCard.svelte';
	import ProfileCard from './ProfileCard.svelte';
	import TeamCard from './TeamCard.svelte';
	import TipCard from './TipCard.svelte';

	let { room, user }: { room: Room; user: User } = $props();

	const calls = $derived(app.data.calls.filter((c) => c.room === room.id));
	const assistants = $derived(app.data.assistants.filter((a) => a.room === room.id && a.active));
	const routes = $derived(planRoutes(calls, assistants, room, app.now));
	const waiting = $derived(calls.filter((c) => c.status === 'waiting'));
	const mine = $derived(app.myCall);
</script>

<div class="page-title">
	<div>
		<h1>{room.name} 教室</h1>
		<p>{app.isTa ? '掌握每個呼叫，讓協助走得更順。' : '找到你的座位，讓助教知道你需要協助。'}</p>
	</div>
	<div class="title-actions">
		<button class="text-button" onclick={app.leaveRoom}><ArrowLeft />切換教室</button>
		{#if app.isTa}
			<button class="secondary small" onclick={app.editRoom}><SlidersHorizontal />編輯教室</button>
		{/if}
	</div>
</div>
<div class="dashboard">
	<section class="main-column">
		<div class="stats">
			<div><span>教室座位<strong>{room.seats.length}<small>個</small></strong></span></div>
			<div><span>等待協助<strong>{waiting.length}<small>位同學</small></strong></span></div>
			<div><span>現場助教<strong>{assistants.length}<small>位</small></strong></span></div>
			<div>
				<span>最久等待<strong class="time-number">{waiting.length ? elapsed(Math.min(...waiting.map((c) => c.createdAt)), app.now) : '00:00'}</strong></span>
			</div>
		</div>
		<SeatMap {room} {calls} {routes} {user} />
		<div class="instruction" class:requested={mine}>
			{#if mine}<BellRing />{:else}<MousePointer2 />{/if}
			<div>
				{#if mine}
					<strong>{mine.status === 'serving' ? '助教正在協助你' : '已送出呼叫，安心等一下'}</strong>
					<span>{mine.room !== room.id ? `另一間教室 ${mine.room} · ` : ''}{mine.seat} 座位 · 已等待 {elapsed(mine.createdAt, app.now)}</span>
				{:else}
					<strong>不用一直舉手，我們看得到。</strong>
					<span>選擇你的座位後，助教會依等待時間與路線前往協助。</span>
				{/if}
			</div>
			{#if mine?.status === 'waiting'}
				<button class="text-button" onclick={app.cancel}>取消呼叫</button>
			{/if}
		</div>
		{#if app.isTa}
			<QueueCard {calls} route={routes.find((r) => r.id === user.uid)} {user} />
		{/if}
	</section>
	<aside class="side-panel">
		<ProfileCard {user} />
		{#if app.isTa}
			<TeamCard {assistants} {routes} {user} />
		{:else}
			<TipCard />
		{/if}
	</aside>
</div>
