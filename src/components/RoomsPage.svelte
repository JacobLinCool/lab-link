<script lang="ts">
	import { ArrowUpRight, DoorOpen, Info, Plus } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
</script>

<div class="page-title">
	<div>
		<h1>今天在哪裡上課？</h1>
		<p>選擇你的教室，開始今天的實習。</p>
	</div>
	{#if app.isTa}
		<button class="primary small" onclick={app.newRoom}><Plus />新增教室</button>
	{/if}
</div>
<div class="room-cards">
	{#each app.data.rooms as r (r.id)}
		<button class="room-card" onclick={() => app.enterRoom(r.id)}>
			<div class="room-card-top"><span><DoorOpen />LAB ROOM</span><span class="badge">開放中</span></div>
			<div class="room-number">{r.name}<span>教室</span></div>
			<div class="room-card-bottom">
				<div>
					{r.course}<small>{r.seats.length} 個座位 · {app.data.calls.filter((c) => c.room === r.id).length} 位等待中</small>
				</div>
				<span class="circle-arrow"><ArrowUpRight /></span>
			</div>
		</button>
	{/each}
</div>
<div class="welcome-note"><Info />第一次使用？進入教室後，點選你所在的座位就能呼叫助教。</div>
