<script lang="ts">
	import { ChevronRight, GraduationCap, LogOut, ShieldCheck } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
</script>

<header>
	<div class="header-left">
		<a class="brand" href="/" onclick={(e) => (e.preventDefault(), app.user && app.leaveRoom())}>LabLink</a>
		<div class="breadcrumb"><ChevronRight /> <span>{app.room ? `${app.room.name} 教室` : '教室總覽'}</span></div>
	</div>
	<div class="header-right">
		{#if app.isTa && app.room}
			<nav class="header-nav">
				<button class:active={app.view === 'map'} onclick={() => (app.view = 'map')}>座位圖</button>
				<button class:active={app.view === 'history'} onclick={app.showHistory}>處理紀錄</button>
			</nav>
			<span class="header-divider"></span>
		{/if}
		<button class="role-chip" disabled={!app.user} onclick={app.logout}>
			{#if app.isTa}<ShieldCheck />助教模式{:else}<GraduationCap />學生模式{/if}
			{#if app.user}<LogOut />{/if}
		</button>
	</div>
</header>
