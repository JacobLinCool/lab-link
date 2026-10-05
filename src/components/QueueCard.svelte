<script lang="ts">
	import { ArrowRight, Check } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
	import { elapsed, type Route } from '../lib/planner.ts';
	import type { Assistant, Call, User } from '../lib/types.ts';

	let { calls, route, user }: { calls: Call[]; route?: Route<Assistant, Call>; user: User } = $props();
	const active = $derived(calls.find((c) => c.assistant === user.uid));
</script>

<div class="queue-card">
	<div class="card-heading"><h2>你的建議順序</h2><span>距離 × 等待時間</span></div>
	{#if active}
		<div class="queue-row">
			<span class="badge">協助中</span>
			<strong>{active.seat}</strong>
			<span>完成後更新你的所在位置</span>
			<button class="primary small" onclick={() => app.complete(active)}><Check />完成協助</button>
		</div>
	{/if}
	{#each route?.stops ?? [] as c, i (c.id)}
		<div class="queue-row">
			<b class="queue-index">{i + 1}</b>
			<strong>{c.seat}</strong>
			<span>{c.name} · 等待 {elapsed(c.createdAt, app.now)}</span>
			<button class="text-button" onclick={() => app.claim(c)}>開始協助<ArrowRight /></button>
		</div>
	{:else}
		<div class="empty-queue">目前沒有分配給你的待處理呼叫。</div>
	{/each}
	<p class="route-note">依走道距離與等待時間重算，超過 10 分鐘優先；建議順序可由助教調整。</p>
</div>
