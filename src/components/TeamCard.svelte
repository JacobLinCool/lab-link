<script lang="ts">
	import { app, live } from '../lib/app.svelte.ts';
	import type { Route } from '../lib/planner.ts';
	import type { Assistant, Call, User } from '../lib/types.ts';

	let { assistants, routes, user }: { assistants: Assistant[]; routes: Route<Assistant, Call>[]; user: User } = $props();
	const participating = $derived(assistants.some((a) => a.id === user.uid));
</script>

<div class="team-card">
	<div class="card-heading"><h2>現場助教</h2><span>{assistants.length} 位</span></div>
	{#each assistants as a, i (a.id)}
		<div class="team-row">
			<span class="team-avatar">{i + 1}</span>
			<div>
				<strong>{a.name}</strong>
				<small>{a.seat || '講台'} · {routes.find((r) => r.id === a.id)?.stops.length || 0} 位待協助</small>
			</div>
			<b class="online-dot"></b>
		</div>
	{/each}
	{#if !live}
		<div class="demo-team">
			<span>多人路線示範</span>
			{#each [1, 2, 3] as n (n)}<button onclick={() => app.demoTeam(n)}>{n} 位</button>{/each}
		</div>
	{/if}
	<label class="presence">
		<input
			type="checkbox"
			checked={participating}
			onchange={(e) => {
				if (!e.currentTarget.checked && app.serving) {
					e.currentTarget.checked = true;
					return app.toast('請先完成協助，再暫停接單。');
				}
				app.setPresence(e.currentTarget.checked);
			}}
		/>參與本教室路線分配
	</label>
</div>
