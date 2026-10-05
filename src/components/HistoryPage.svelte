<script lang="ts">
	import { app } from '../lib/app.svelte.ts';
	import type { Room } from '../lib/types.ts';

	let { room }: { room: Room } = $props();
	const rows = $derived(app.data.history.filter((h) => h.room === room.id).sort((a, b) => b.completedAt - a.completedAt));
	const assistantName = (id: string) => app.data.assistants.find((a) => a.id === id)?.name || id;
</script>

<div class="page-title">
	<div>
		<h1>處理紀錄</h1>
		<p>{room.name} 教室的協助順序與等待時間。</p>
	</div>
</div>
<div class="history-card">
	<table>
		<thead><tr><th>完成時間</th><th>座位</th><th>學生</th><th>助教</th><th>總耗時</th></tr></thead>
		<tbody>
			{#each rows as h (h.id)}
				<tr>
					<td>{new Date(h.completedAt).toLocaleString('zh-TW')}</td>
					<td>{h.seat}</td>
					<td>{h.name}</td>
					<td>{assistantName(h.assistant)}</td>
					<td>{Math.round((h.completedAt - h.createdAt) / 1000)} 秒</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="empty-queue">尚無處理紀錄。完成協助後會記錄在這裡。</td></tr>
			{/each}
		</tbody>
	</table>
</div>
